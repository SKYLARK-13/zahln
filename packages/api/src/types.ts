export type PriceGroup = "student" | "staff" | "guest";
export type UserRole = PriceGroup | "cashier" | "finance";
export type OrderStatus = "open" | "paying" | "paid" | "expired";
export type PaymentStatus = "pending" | "confirmed" | "declined";
export type RefundStatus = "pending" | "completed" | "failed";
export type AttentionReason =
  | "pending_too_long"
  | "refund_pending_too_long"
  | "refund_failed";

export type LocalizedText = { de: string; en: string };

export type Ref = { id: string; name: string };

export type Prices = {
  student: number;
  staff: number;
  guest: number;
};

export type User = {
  id: string;
  displayName: string;
  role: UserRole;
  priceGroup?: PriceGroup | null;
  tillId?: string | null;
  mensaId?: string | null;
};

export type Session = {
  accessToken: string;
  tokenType?: "Bearer";
  expiresAt: string;
  user: User;
};

export type AppConfig = {
  minAppVersion: string;
  paymentsEnabled: boolean;
};

export type MenuItem = {
  id: string;
  name: LocalizedText;
  prices: Prices;
};

export type Till = { id: string; name: string };

export type Mensa = {
  id: string;
  name: string;
  city: string;
  tills: Till[];
  menu: MenuItem[];
};

export type OrderLine = {
  itemId: string;
  name: LocalizedText;
  quantity: number;
  unitPrices?: Prices | null;
  unitPriceCents?: number | null;
};

export type Order = {
  id: string;
  status: OrderStatus;
  mensa: Ref;
  till: Ref;
  items: OrderLine[];
  qrPayload: string;
  currency?: "EUR";
  amounts?: Prices | null;
  priceGroup?: PriceGroup | null;
  amountCents?: number | null;
  paymentId?: string | null;
  createdAt: string;
  expiresAt: string;
  version: number;
};

export type Payer = { id: string; displayName: string };

export type PaymentItem = {
  itemId: string;
  name: LocalizedText;
  quantity: number;
  unitPriceCents: number;
};

export type Payment = {
  id: string;
  orderId: string;
  status: PaymentStatus;
  amountCents: number;
  currency?: "EUR";
  priceGroup: PriceGroup;
  mensa: Ref;
  till: Ref;
  payer: Payer;
  items: PaymentItem[];
  refundedAmountCents: number;
  pendingRefundAmountCents: number;
  refundableAmountCents: number;
  needsAttention: boolean;
  attentionReasons: AttentionReason[];
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type PaymentEvent = {
  at: string;
  type:
    | "payment_created"
    | "payment_confirmed"
    | "payment_declined"
    | "refund_requested"
    | "refund_completed"
    | "refund_failed";
  amountCents: number | null;
  refundId: string | null;
};

export type Refund = {
  id: string;
  paymentId: string;
  amountCents: number;
  currency?: "EUR";
  status: RefundStatus;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentDetail = Payment & {
  refunds: Refund[];
  history: PaymentEvent[];
};

export type PaymentPage = {
  items: Payment[];
  nextCursor: string | null;
};

export type Totals = {
  paymentCount: number;
  grossCents: number;
  refundedCents: number;
  netCents: number;
  pendingCount: number;
  pendingCents: number;
};

export type TillTotals = Totals & { till: Ref };
export type MensaTotals = Totals & { mensa: Ref; tills: TillTotals[] };
export type DailyTotals = Totals & {
  date: string;
  currency?: "EUR";
  mensas: MensaTotals[];
};

export type Problem = {
  code: string;
  title: string;
  status: number;
  retryable: boolean;
  detail?: string | null;
};

export type ListPaymentsQuery = {
  mensaId?: string;
  tillId?: string;
  status?: PaymentStatus;
  from?: string;
  to?: string;
  needsAttention?: boolean;
  q?: string;
  limit?: number;
  cursor?: string;
};
