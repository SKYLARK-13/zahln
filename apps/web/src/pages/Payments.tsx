import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Payment, PaymentStatus } from "@zahln/api";
import { isApiError } from "@zahln/api";
import { downloadCsv, paymentsCsv } from "../csv";
import { money, paymentStatus, dateTime } from "../format";
import type { Copy, Locale } from "../i18n";
import { useSession } from "../session";

export function Payments({ t, locale }: { t: Copy; locale: Locale }) {
  const { client } = useSession();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [items, setItems] = useState<Payment[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  async function load(reset: boolean) {
    setBusy(true);
    setError("");
    try {
      const page = await client.listPayments({
        q: q.trim() || undefined,
        status: status || undefined,
        needsAttention: attentionOnly ? true : undefined,
        cursor: reset ? undefined : cursor || undefined,
        limit: 50,
      });
      setItems((current) => (reset ? page.items : [...current, ...page.items]));
      setCursor(page.nextCursor);
    } catch (err) {
      setError(isApiError(err) ? err.message : t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load(true);
  }, [status, attentionOnly]);

  return (
    <div>
      <form
        className="toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          void load(true);
        }}
      >
        <label>
          {t.search}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.searchPlaceholder}
          />
        </label>
        <label>
          {t.status}
          <select value={status} onChange={(e) => setStatus(e.target.value as PaymentStatus | "")}>
            <option value="">{t.all}</option>
            <option value="pending">{t.statusPending}</option>
            <option value="confirmed">{t.statusConfirmed}</option>
            <option value="declined">{t.statusDeclined}</option>
          </select>
        </label>
        <label>
          {t.attention}
          <select
            value={attentionOnly ? "1" : ""}
            onChange={(e) => setAttentionOnly(e.target.value === "1")}
          >
            <option value="">{t.all}</option>
            <option value="1">{t.needsAttention}</option>
          </select>
        </label>
        <button className="primary" type="submit" disabled={busy}>
          {t.search}
        </button>
        <button
          className="ghost"
          type="button"
          disabled={items.length === 0}
          onClick={() => downloadCsv(`zahln-payments.csv`, paymentsCsv(items, locale, t))}
        >
          {t.exportCsv}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      <div className="card">
        {busy && items.length === 0 ? <p className="loading">{t.refresh}…</p> : null}
        {!busy && items.length === 0 ? <p className="empty">{t.empty}</p> : null}
        {items.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>{t.created}</th>
                <th>{t.mensa}</th>
                <th>{t.till}</th>
                <th>{t.payer}</th>
                <th>{t.amount}</th>
                <th>{t.status}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((payment) => (
                <tr
                  key={payment.id}
                  className="rowlink"
                  onClick={() => navigate(`/payments/${payment.id}`)}
                >
                  <td>{dateTime(payment.createdAt, locale)}</td>
                  <td>{payment.mensa.name}</td>
                  <td>{payment.till.name}</td>
                  <td>{payment.payer.displayName}</td>
                  <td>{money(payment.amountCents, locale)}</td>
                  <td>
                    <span className={`badge ${payment.status === "declined" ? "danger" : payment.status === "confirmed" ? "ok" : "warn"}`}>
                      {paymentStatus(payment.status, t)}
                    </span>
                    {payment.needsAttention ? <span className="badge warn"> {t.attention}</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      {cursor ? (
        <div className="toolbar">
          <button className="ghost" type="button" disabled={busy} onClick={() => void load(false)}>
            {t.loadMore}
          </button>
        </div>
      ) : null}
    </div>
  );
}
