import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { loginErrorMessage, useSession } from "../session";
import type { Copy } from "../i18n";

export function Login({ t }: { t: Copy }) {
  const { user, login } = useSession();
  const [username, setUsername] = useState("finance");
  const [password, setPassword] = useState("test1234");
  const [candidateId, setCandidateId] = useState(import.meta.env.VITE_CANDIDATE_ID || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login({ username, password, candidateId: candidateId.trim() });
    } catch (err) {
      setError(loginErrorMessage(err, t.errorGeneric, t.errorCredentials));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <form className="card" onSubmit={onSubmit}>
        <p className="brand">Zahln</p>
        <h1>{t.loginTitle}</h1>
        <p className="hint">{t.loginHint}</p>
        <label>
          {t.username}
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </label>
        <label>
          {t.password}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        <label>
          {t.candidateId}
          <input value={candidateId} onChange={(e) => setCandidateId(e.target.value)} />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="primary" type="submit" disabled={busy || !candidateId.trim()}>
          {t.signIn}
        </button>
      </form>
    </div>
  );
}
