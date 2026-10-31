// API qrPayload is like: zahln://pay?order=ord_…
export function orderIdFromQr(raw: string) {
  const text = raw.trim();
  if (!text) return "";

  try {
    const parsed = JSON.parse(text) as { orderId?: string; id?: string; order?: string };
    if (parsed.orderId) return parsed.orderId;
    if (parsed.order) return parsed.order;
    if (parsed.id) return parsed.id;
  } catch {
    // not json
  }

  const orderMatch = text.match(/(?:[?&](?:order|orderId|id)=)([A-Za-z0-9_-]+)/i);
  if (orderMatch?.[1]) return orderMatch[1];

  if (/^ord_[A-Za-z0-9_-]+$/i.test(text)) return text;

  try {
    const url = new URL(text);
    const fromQuery =
      url.searchParams.get("order") ||
      url.searchParams.get("orderId") ||
      url.searchParams.get("id");
    if (fromQuery) return fromQuery;
    const pathTail = url.pathname.split("/").filter(Boolean).pop();
    if (pathTail && /^ord_/i.test(pathTail)) return pathTail;
  } catch {
    // not a URL
  }

  if (text.includes("/")) {
    const parts = text.split(/[/?#&]/).filter(Boolean);
    const ord = parts.find((part) => /^ord_/i.test(part));
    if (ord) return ord;
  }

  return text;
}

export function newIdempotencyKey(kind = "pay") {
  return `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
