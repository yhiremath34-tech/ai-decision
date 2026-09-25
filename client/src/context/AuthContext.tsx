import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { setApiAuthToken } from '../lib/api.js';

export interface User {
  id: string;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSupabaseConnected: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local demo user default
const DEMO_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'architect@decisionflow.ai',
  full_name: 'Lead Decision Architect',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            });
            setApiAuthToken(session.access_token);
          } else {
            setUser(null);
            setApiAuthToken(null);
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            if (currentSession?.user) {
              setUser({
                id: currentSession.user.id,
                email: currentSession.user.email || '',
                full_name: currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0] || 'User',
              });
              setApiAuthToken(currentSession.access_token);
            } else {
              setUser(null);
              setApiAuthToken(null);
            }
          });

          setLoading(false);
          return () => subscription.unsubscribe();
        } catch (e) {
          console.warn('[AuthContext] Supabase session retrieval error, falling back to local session:', e);
        }
      }

      // Local mock auth mode
      const savedLocalUser = localStorage.getItem('decisionflow_local_user');
      if (savedLocalUser) {
        try {
          const parsed = JSON.parse(savedLocalUser);
          setUser(parsed);
          setApiAuthToken('demo-token');
        } catch {
          setUser(DEMO_USER);
          setApiAuthToken('demo-token');
        }
      } else {
        // Default to active demo user for instant explore
        setUser(DEMO_USER);
        localStorage.setItem('decisionflow_local_user', JSON.stringify(DEMO_USER));
        setApiAuthToken('demo-token');
      }

      setLoading(false);
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };
        if (data.session) {
          setApiAuthToken(data.session.access_token);
          setUser({
            id: data.user.id,
            email: data.user.email || email,
            full_name: data.user.user_metadata?.full_name || email.split('@')[0],
          });
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // Local mode login
    const localUser: User = {
      id: 'user_' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)),
      email,
      full_name: email.split('@')[0],
    };
    setUser(localUser);
    localStorage.setItem('decisionflow_local_user', JSON.stringify(localUser));
    setApiAuthToken('demo-token');
    return { success: true };
  };

  const register = async (fullName: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) return { success: false, error: error.message };
        if (data.session) {
          setApiAuthToken(data.session.access_token);
          setUser({
            id: data.user?.id || 'temp',
            email,
            full_name: fullName,
          });
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // Local mode register
    const localUser: User = {
      id: 'user_' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)),
      email,
      full_name: fullName,
    };
    setUser(localUser);
    localStorage.setItem('decisionflow_local_user', JSON.stringify(localUser));
    setApiAuthToken('demo-token');
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('decisionflow_local_user');
    setApiAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSupabaseConnected: isSupabaseConfigured,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
