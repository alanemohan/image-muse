import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { getMe, signOut as apiSignOut } from "@/services/authService";
import { getAuthToken, onAuthChange } from "@/services/apiClient";

type User = {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  is_admin?: boolean;
  created_at?: string | null;
  last_sign_in_at?: string | null;
};

type Session = {
  access_token: string;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const bootstrap = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setLoading(true);

    const token = getAuthToken();
    if (!token) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setSession(null);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const currentUser = await getMe();
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      setSession({ access_token: token });
      setUser(currentUser);
    } catch {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      setSession(null);
      setUser(null);
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void bootstrap();

    const unsubscribe = onAuthChange(() => {
      void bootstrap();
    });

    return unsubscribe;
  }, [bootstrap]);

  const signOut = useCallback(async () => {
    apiSignOut();
    setSession(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
