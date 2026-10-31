import { useEffect, useState } from "react";
import type { DailyTotals } from "@zahln/api";
import { isApiError } from "@zahln/api";
import { money, todayBerlin } from "../format";
import type { Copy, Locale } from "../i18n";
import { useSession } from "../session";

export function Overview({ t, locale }: { t: Copy; locale: Locale }) {
  const { client } = useSession();
  const [date, setDate] = useState(todayBerlin);
  const [data, setData] = useState<DailyTotals | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  async function load(nextDate = date) {
    setBusy(true);
    setError("");
    try {
      setData(await client.dailyTotals(nextDate));
    } catch (err) {
      setError(isApiError(err) ? err.message : t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load(date);
  }, [date]);

  return (
    <div>
      <div className="toolbar">
        <label>
          {t.date}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <button className="ghost" type="button" onClick={() => void load()} disabled={busy}>
          {t.refresh}
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="kpis">
        <Kpi label={t.paymentsCount} value={data ? String(data.paymentCount) : "—"} />
        <Kpi label={t.gross} value={data ? money(data.grossCents, locale) : "—"} />
        <Kpi label={t.refunded} value={data ? money(data.refundedCents, locale) : "—"} />
        <Kpi label={t.net} value={data ? money(data.netCents, locale) : "—"} />
        <Kpi
          label={t.pending}
          value={data ? `${data.pendingCount} · ${money(data.pendingCents, locale)}` : "—"}
        />
      </div>

      <div className="card">
        {busy && !data ? <p className="loading">{t.refresh}…</p> : null}
        <table>
          <thead>
            <tr>
              <th>{t.mensa}</th>
              <th>{t.till}</th>
              <th>{t.paymentsCount}</th>
              <th>{t.gross}</th>
              <th>{t.refunded}</th>
              <th>{t.net}</th>
              <th>{t.pending}</th>
            </tr>
          </thead>
          <tbody>
            {data?.mensas.flatMap((mensa) =>
              mensa.tills.map((till) => (
                <tr key={`${mensa.mensa.id}-${till.till.id}`}>
                  <td>{mensa.mensa.name}</td>
                  <td>{till.till.name}</td>
                  <td>{till.paymentCount}</td>
                  <td>{money(till.grossCents, locale)}</td>
                  <td>{money(till.refundedCents, locale)}</td>
                  <td>{money(till.netCents, locale)}</td>
                  <td>{till.pendingCount}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card kpi">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
