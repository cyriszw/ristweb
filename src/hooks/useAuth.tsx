import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  adminChecking: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminChecking, setAdminChecking] = useState(false);
  const mountedRef = useRef(true);

  const checkAdmin = async (userId: string) => {
    if (!mountedRef.current) return;
    setAdminChecking(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (!mountedRef.current) return;
      if (error) {
        console.error('Admin role check failed:', error);
        setIsAdmin(false);
        return;
      }
      setIsAdmin(!!data);
    } catch (err) {
      console.error('Admin role check crashed:', err);
      if (mountedRef.current) setIsAdmin(false);
    } finally {
      if (mountedRef.current) setAdminChecking(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.error('Session init failed:', error);
        if (!mountedRef.current) return;

        setSession(session ?? null);
        setUser(session?.user ?? null);

        if (session?.user) {
          await checkAdmin(session.user.id);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Auth initialization crashed:', err);
        if (mountedRef.current) {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    void initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;

      setSession(session ?? null);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Only re-check admin on actual sign-in, not on token refresh
        // This prevents resetting form state when switching browser tabs
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          void checkAdmin(session.user.id);
        }
      } else {
        setIsAdmin(false);
      }

      if (mountedRef.current) setLoading(false);
    });

    const safetyTimeout = window.setTimeout(() => {
      if (mountedRef.current) setLoading(false);
    }, 3000);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, adminChecking, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
