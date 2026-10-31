import { useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { copy, type Locale } from "./i18n";
import { Login } from "./pages/Login";
import { Overview } from "./pages/Overview";
import { PaymentDetail } from "./pages/PaymentDetail";
import { Payments } from "./pages/Payments";
import { useSession } from "./session";

export function App() {
  const [locale, setLocale] = useState<Locale>("de");
  const t = copy[locale];
  const { user, logout } = useSession();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login t={t} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <p className="brand notranslate" translate="no">
          <span className="brand-mark">Z</span>
          Zahln
          <span>
            {t.appName} · {user.displayName}
          </span>
        </p>
        <nav className="nav">
          <NavLink to="/" end>
            {t.overview}
          </NavLink>
          <NavLink to="/payments">{t.payments}</NavLink>
        </nav>
        <div className="actions">
          <button className="lang" type="button" onClick={() => setLocale(locale === "de" ? "en" : "de")}>
            {locale === "de" ? "EN" : "DE"}
          </button>
          <button className="ghost" type="button" onClick={logout}>
            {t.signOut}
          </button>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Overview t={t} locale={locale} />} />
        <Route path="/payments" element={<Payments t={t} locale={locale} />} />
        <Route path="/payments/:paymentId" element={<PaymentDetail t={t} locale={locale} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
