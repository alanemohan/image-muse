import { createContext, useContext, useEffect, useState } from 'react';
import { getMe, signOut as apiSignOut } from '@/services/authService';
import { getAuthToken, onAuthChange } from '@/services/apiClient';

type User = {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  is_admin?: boolean;
};

type Session = {
  access_token: string;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  setUser: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = getAuthToken();
      if (!token) {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getMe();
        setSession({ access_token: token });
        setUser(currentUser);
      } catch {
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();

    const unsubscribe = onAuthChange(() => {
      void bootstrap();
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    apiSignOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
