import {
  ZahlnClient,
  isApiError,
  type Session,
  type User,
} from "@zahln/api";
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "zahln.finance.session";

type Stored = {
  username: string;
  password: string;
  candidateId: string;
  session: Session;
};

type SessionContextValue = {
  user: User | null;
  candidateId: string;
  client: ZahlnClient;
  login: (input: { username: string; password: string; candidateId: string }) => Promise<void>;
  logout: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function readStored(): Stored | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<Stored | null>(() => readStored());
  const storedRef = useRef(stored);
  storedRef.current = stored;

  const client = useMemo(
    () =>
      new ZahlnClient(
        {
          getCandidateId: () => storedRef.current?.candidateId || import.meta.env.VITE_CANDIDATE_ID || "",
          getAccessToken: () => storedRef.current?.session.accessToken ?? null,
          refreshAccessToken: async () => {
            const current = storedRef.current;
            if (!current) return null;
            try {
              const session = await new ZahlnClient(
                {
                  getCandidateId: () => current.candidateId,
                  getAccessToken: () => null,
                  refreshAccessToken: async () => null,
                },
                import.meta.env.VITE_API_URL || "https://dev.zahln.de",
              ).login(current.username, current.password);
              const next = { ...current, session };
              storedRef.current = next;
              setStored(next);
              sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
              return session.accessToken;
            } catch {
              storedRef.current = null;
              setStored(null);
              sessionStorage.removeItem(STORAGE_KEY);
              return null;
            }
          },
        },
        import.meta.env.VITE_API_URL || "https://dev.zahln.de",
      ),
    [],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      user: stored?.session.user ?? null,
      candidateId: stored?.candidateId || import.meta.env.VITE_CANDIDATE_ID || "",
      client,
      login: async ({ username, password, candidateId }) => {
        const bootstrap = new ZahlnClient(
          {
            getCandidateId: () => candidateId,
            getAccessToken: () => null,
            refreshAccessToken: async () => null,
          },
          import.meta.env.VITE_API_URL || "https://dev.zahln.de",
        );
        const session = await bootstrap.login(username, password);
        const next = { username, password, candidateId, session };
        storedRef.current = next;
        setStored(next);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      },
      logout: () => {
        storedRef.current = null;
        setStored(null);
        sessionStorage.removeItem(STORAGE_KEY);
      },
    }),
    [client, stored],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}

export function loginErrorMessage(error: unknown, fallback: string, credentials: string) {
  if (isApiError(error) && (error.code === "invalid_credentials" || error.status === 401)) {
    return credentials;
  }
  if (isApiError(error)) return error.message;
  return fallback;
}
