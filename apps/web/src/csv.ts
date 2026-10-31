import type { Payment } from "@zahln/api";
import { money, paymentStatus } from "./format";
import type { Copy, Locale } from "./i18n";

export function paymentsCsv(payments: Payment[], locale: Locale, t: Copy) {
  const header = [
    "id",
    t.created,
    t.status,
    t.mensa,
    t.till,
    t.payer,
    t.priceGroup,
    t.amount,
    t.attention,
  ];
  const rows = payments.map((payment) => [
    payment.id,
    payment.createdAt,
    paymentStatus(payment.status, t),
    payment.mensa.name,
    payment.till.name,
    payment.payer.displayName,
    payment.priceGroup,
    money(payment.amountCents, locale),
    payment.needsAttention ? "yes" : "no",
  ]);
  const lines = [header, ...rows].map((cells) =>
    cells.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";"),
  );
  return `\uFEFF${lines.join("\n")}`;
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
