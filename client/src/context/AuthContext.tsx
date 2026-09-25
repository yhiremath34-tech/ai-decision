import React, { createContext, useContext, useState, useEffect } from 'react';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { setApiAuthToken } from '../lib/api.js';

export interface User {
  id: string;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: User;
  loading: boolean;
  isSupabaseConnected: boolean;
  updateProfileName: (name: string) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const OPEN_WORKSPACE_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'workspace@decisionflow.ai',
  full_name: 'Decision Architect',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('decisionflow_workspace_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return OPEN_WORKSPACE_USER;
  });

  useEffect(() => {
    // Open access mode: configure token for all requests immediately
    setApiAuthToken('open-access-token');
  }, []);

  const updateProfileName = (name: string) => {
    const updated = { ...user, full_name: name };
    setUser(updated);
    try {
      localStorage.setItem('decisionflow_workspace_user', JSON.stringify(updated));
    } catch {}
  };

  const login = async (): Promise<{ success: boolean }> => {
    return { success: true };
  };

  const register = async (fullName: string): Promise<{ success: boolean }> => {
    if (fullName) updateProfileName(fullName);
    return { success: true };
  };

  const logout = async (): Promise<void> => {
    // No-op in open access mode
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: false,
        isSupabaseConnected: isSupabaseConfigured,
        updateProfileName,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
