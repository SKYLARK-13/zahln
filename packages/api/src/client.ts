import { ApiError } from "./error";
import type {
  DailyTotals,
  ListPaymentsQuery,
  Mensa,
  Order,
  Payment,
  PaymentDetail,
  PaymentPage,
  Refund,
  Session,
} from "./types";

export type AuthStore = {
  getCandidateId: () => string;
  getAccessToken: () => string | null;
  // tokens last 5 min, so we re-login here on 401
  refreshAccessToken: () => Promise<string | null>;
};

type Query = Record<string, string | number | boolean | undefined | null>;

type RequestOptions = {
  method: "GET" | "POST";
  path: string;
  query?: Query;
  body?: unknown;
  auth?: boolean;
  idempotencyKey?: string;
  headers?: Record<string, string>;
};

function toQuery(query?: Query): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

export class ZahlnClient {
  constructor(
    private auth: AuthStore,
    private baseUrl = "https://dev.zahln.de",
  ) {}

  login(username: string, password: string) {
    return this.request<Session>({
      method: "POST",
      path: "/sessions",
      body: { username, password },
      auth: false,
    });
  }

  listMensas() {
    return this.request<{ items: Mensa[] }>({ method: "GET", path: "/mensas" });
  }

  // same Idempotency-Key when retrying create order
  createOrder(items: { itemId: string; quantity: number }[], idempotencyKey: string) {
    return this.request<Order>({
      method: "POST",
      path: "/orders",
      body: { items },
      idempotencyKey,
    });
  }

  getOrder(orderId: string) {
    return this.request<Order>({ method: "GET", path: `/orders/${orderId}` });
  }

  // keep the same Idempotency-Key when retrying a payment
  createPayment(orderId: string, amountCents: number, idempotencyKey: string, appVersion = "1.0.0") {
    return this.request<Payment>({
      method: "POST",
      path: `/orders/${orderId}/payments`,
      body: { amountCents },
      idempotencyKey,
      headers: { "X-App-Version": appVersion },
    });
  }

  listPayments(query: ListPaymentsQuery = {}) {
    return this.request<PaymentPage>({
      method: "GET",
      path: "/payments",
      query,
    });
  }

  getPayment(paymentId: string) {
    return this.request<PaymentDetail>({
      method: "GET",
      path: `/payments/${paymentId}`,
    });
  }

  createRefund(
    paymentId: string,
    amountCents: number,
    idempotencyKey: string,
    reason?: string,
  ) {
    return this.request<Refund>({
      method: "POST",
      path: `/payments/${paymentId}/refunds`,
      body: { amountCents, reason: reason || null },
      idempotencyKey,
    });
  }

  dailyTotals(date?: string) {
    return this.request<DailyTotals>({
      method: "GET",
      path: "/reports/daily-totals",
      query: { date },
    });
  }

  private async request<T>(
    options: RequestOptions,
    retried = false,
  ): Promise<T> {
    const candidateId = this.auth.getCandidateId();
    if (!candidateId) {
      throw new ApiError({
        code: "missing_candidate",
        title: "Missing candidate ID",
        status: 0,
        retryable: false,
      });
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-Candidate-Id": candidateId,
      ...options.headers,
    };

    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (options.idempotencyKey) {
      headers["Idempotency-Key"] = options.idempotencyKey;
    }

    const needsAuth = options.auth !== false;
    if (needsAuth) {
      const token = this.auth.getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${options.path}${toQuery(options.query)}`, {
        method: options.method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });
    } catch {
      if (!retried) return this.request<T>(options, true);
      throw new ApiError({
        code: "network_error",
        title: "Network error",
        status: 0,
        retryable: true,
      });
    }

    if (response.status === 401 && needsAuth && !retried) {
      const next = await this.auth.refreshAccessToken();
      if (next) return this.request<T>(options, true);
    }

    if (!response.ok) {
      const problem = await readProblem(response);
      const error = new ApiError(problem);
      // safe to retry GET, or POST when we have an Idempotency-Key
      const canRetry =
        error.retryable &&
        !retried &&
        (options.method === "GET" || Boolean(options.idempotencyKey));
      if (canRetry) return this.request<T>(options, true);
      throw error;
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }
}

async function readProblem(response: Response) {
  try {
    const body = (await response.json()) as Partial<{
      code: string;
      title: string;
      status: number;
      retryable: boolean;
      detail: string | null;
    }>;
    return {
      code: body.code || "unknown",
      title: body.title || response.statusText,
      status: body.status || response.status,
      retryable: Boolean(body.retryable),
      detail: body.detail,
    };
  } catch {
    return {
      code: "unknown",
      title: response.statusText || "Request failed",
      status: response.status,
      retryable: response.status >= 500,
    };
  }
}

// GET can come back stale, so never overwrite with a lower version
export function newerByVersion<T extends { version: number }>(current: T | undefined, incoming: T): T {
  if (!current || incoming.version >= current.version) return incoming;
  return current;
}
