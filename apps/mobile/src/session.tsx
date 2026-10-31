import {
  ZahlnClient,
  isApiError,
  type Session,
  type User,
} from "@zahln/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "zahln.student.session";
const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://dev.zahln.de";

type Stored = {
  username: string;
  password: string;
  candidateId: string;
  session: Session;
};

type SessionContextValue = {
  ready: boolean;
  user: User | null;
  client: ZahlnClient;
  login: (input: {
    username: string;
    password: string;
    candidateId: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [stored, setStored] = useState<Stored | null>(null);
  const storedRef = useRef(stored);
  storedRef.current = stored;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setStored(JSON.parse(raw) as Stored);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const client = useMemo(
    () =>
      new ZahlnClient(
        {
          getCandidateId: () =>
            storedRef.current?.candidateId ||
            process.env.EXPO_PUBLIC_CANDIDATE_ID ||
            "",
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
                API_URL,
              ).login(current.username, current.password);
              const next = { ...current, session };
              storedRef.current = next;
              setStored(next);
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
              return session.accessToken;
            } catch {
              storedRef.current = null;
              setStored(null);
              await AsyncStorage.removeItem(STORAGE_KEY);
              return null;
            }
          },
        },
        API_URL,
      ),
    [],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      ready,
      user: stored?.session.user ?? null,
      client,
      login: async ({ username, password, candidateId }) => {
        const bootstrap = new ZahlnClient(
          {
            getCandidateId: () => candidateId,
            getAccessToken: () => null,
            refreshAccessToken: async () => null,
          },
          API_URL,
        );
        const session = await bootstrap.login(username, password);
        const next = { username, password, candidateId, session };
        storedRef.current = next;
        setStored(next);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      },
      logout: async () => {
        storedRef.current = null;
        setStored(null);
        await AsyncStorage.removeItem(STORAGE_KEY);
      },
    }),
    [client, ready, stored],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession needs SessionProvider");
  return value;
}

export function loginErrorMessage(error: unknown, fallback: string, credentials: string) {
  if (isApiError(error) && (error.code === "invalid_credentials" || error.status === 401)) {
    return credentials;
  }
  if (isApiError(error)) return error.message;
  return fallback;
}
