import type { AttentionReason, PaymentStatus, PriceGroup, RefundStatus } from "@zahln/api";
import type { Copy, Locale } from "./i18n";

const berlin = "Europe/Berlin";

export function money(cents: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function dateTime(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    timeZone: berlin,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function todayBerlin() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: berlin,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function paymentStatus(status: PaymentStatus, t: Copy) {
  if (status === "confirmed") return t.statusConfirmed;
  if (status === "declined") return t.statusDeclined;
  return t.statusPending;
}

export function refundStatus(status: RefundStatus, t: Copy) {
  if (status === "completed") return t.statusCompleted;
  if (status === "failed") return t.statusFailed;
  return t.statusPending;
}

export function priceGroup(group: PriceGroup, t: Copy) {
  if (group === "staff") return t.groupStaff;
  if (group === "guest") return t.groupGuest;
  return t.groupStudent;
}

export function attentionReason(reason: AttentionReason, t: Copy) {
  if (reason === "refund_pending_too_long") return t.reasonRefundPendingTooLong;
  if (reason === "refund_failed") return t.reasonRefundFailed;
  return t.reasonPendingTooLong;
}

export function localize(name: { de: string; en: string }, locale: Locale) {
  return name[locale];
}
