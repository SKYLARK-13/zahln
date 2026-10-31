import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { isApiError, newerByVersion, type PaymentDetail as PaymentDetailType } from "@zahln/api";
import { attentionReason, dateTime, localize, money, paymentStatus, priceGroup, refundStatus } from "../format";
import type { Copy, Locale } from "../i18n";
import { useSession } from "../session";

const events: Record<string, keyof Copy> = {
  payment_created: "eventPaymentCreated",
  payment_confirmed: "eventPaymentConfirmed",
  payment_declined: "eventPaymentDeclined",
  refund_requested: "eventRefundRequested",
  refund_completed: "eventRefundCompleted",
  refund_failed: "eventRefundFailed",
};

export function PaymentDetail({ t, locale }: { t: Copy; locale: Locale }) {
  const { paymentId = "" } = useParams();
  const { client } = useSession();
  const [payment, setPayment] = useState<PaymentDetailType | undefined>();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError("");
    client
      .getPayment(paymentId)
      .then((next) => {
        if (!cancelled) setPayment((current) => newerByVersion(current, next));
      })
      .catch((err) => {
        if (!cancelled) setError(isApiError(err) ? err.message : t.errorGeneric);
      });
    return () => {
      cancelled = true;
    };
  }, [client, paymentId, t.errorGeneric]);

  if (error) {
    return (
      <div>
        <Link to="/payments">{t.back}</Link>
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!payment) return <p className="loading">{t.refresh}…</p>;

  return (
    <div className="detail">
      <header>
        <div>
          <Link to="/payments" className="muted">
            {t.back}
          </Link>
          <h1>{money(payment.amountCents, locale)}</h1>
          <p className="muted">
            {payment.mensa.name} · {payment.till.name} · {payment.payer.displayName}
          </p>
        </div>
        <span className={`badge ${payment.status === "declined" ? "danger" : payment.status === "confirmed" ? "ok" : "warn"}`}>
          {paymentStatus(payment.status, t)}
        </span>
      </header>

      <div className="card stack">
        <p>
          {t.order}: {payment.orderId}
        </p>
        <p>
          {t.priceGroup}: {priceGroup(payment.priceGroup, t)}
        </p>
        <p>
          {t.created}: {dateTime(payment.createdAt, locale)}
        </p>
        <p>
          {t.updated}: {dateTime(payment.updatedAt, locale)}
        </p>
        {payment.needsAttention
          ? payment.attentionReasons.map((reason) => (
              <p key={reason} className="error">
                {attentionReason(reason, t)}
              </p>
            ))
          : null}
      </div>

      <section className="card">
        <div className="stack">
          <h2>{t.items}</h2>
        </div>
        <table>
          <tbody>
            {payment.items.map((item) => (
              <tr key={item.itemId}>
                <td>
                  {item.quantity}× {localize(item.name, locale)}
                </td>
                <td>{money(item.unitPriceCents * item.quantity, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <div className="stack">
          <h2>{t.refunds}</h2>
        </div>
        {payment.refunds.length === 0 ? (
          <p className="empty">{t.empty}</p>
        ) : (
          <table>
            <tbody>
              {payment.refunds.map((refund) => (
                <tr key={refund.id}>
                  <td>{dateTime(refund.createdAt, locale)}</td>
                  <td>{money(refund.amountCents, locale)}</td>
                  <td>{refundStatus(refund.status, t)}</td>
                  <td>{refund.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <div className="stack">
          <h2>{t.history}</h2>
        </div>
        <table>
          <tbody>
            {payment.history.map((event, index) => (
              <tr key={`${event.at}-${index}`}>
                <td>{dateTime(event.at, locale)}</td>
                <td>{t[events[event.type] ?? "refresh"]}</td>
                <td>{event.amountCents != null ? money(event.amountCents, locale) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
