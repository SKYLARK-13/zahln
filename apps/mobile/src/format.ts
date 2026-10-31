import type { LocalizedText, PaymentStatus } from "@zahln/api";
import type { Copy, Locale } from "./i18n";

export function money(cents: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function dateTime(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    timeZone: "Europe/Berlin",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function localize(name: LocalizedText, locale: Locale) {
  return name[locale];
}

export function paymentStatus(status: PaymentStatus, t: Copy) {
  if (status === "confirmed") return t.statusConfirmed;
  if (status === "declined") return t.statusDeclined;
  return t.statusPending;
}
