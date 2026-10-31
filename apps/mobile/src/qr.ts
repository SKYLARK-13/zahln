// till QR is qrPayload from the API — usually just the order id
export function orderIdFromQr(raw: string) {
  const text = raw.trim();
  if (!text) return "";

  try {
    const parsed = JSON.parse(text) as { orderId?: string; id?: string };
    if (parsed.orderId) return parsed.orderId;
    if (parsed.id) return parsed.id;
  } catch {
    // not json, fine
  }

  if (text.includes("/")) {
    const parts = text.split("/").filter(Boolean);
    return parts[parts.length - 1] || text;
  }

  return text;
}

export function newIdempotencyKey(kind = "pay") {
  return `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
