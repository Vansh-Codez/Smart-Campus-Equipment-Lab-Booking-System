import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, getAuthToken, setAuthToken, removeAuthToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = async () => {
    try {
      if (getAuthToken()) {
        const profile = await api.getMe();
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch authenticated user profile:', err);
      removeAuthToken();
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      setAuthToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      const res = await api.register(data);
      if (res.is_approved && res.access_token) {
        setAuthToken(res.access_token);
        setToken(res.access_token);
        setUser(res.user);
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeAuthToken();
    setToken(null);
    setUser(null);
  };

  const switchDemoRole = async (role: UserRole) => {
    const roleCredentials: Record<UserRole, { email: string; pass: string }> = {
      student: { email: 'student@campus.edu', pass: 'campus123' },
      lab_assistant: { email: 'assistant@campus.edu', pass: 'campus123' },
      admin: { email: 'admin@campus.edu', pass: 'campus123' },
    };
    const cred = roleCredentials[role];
    await login(cred.email, cred.pass);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
