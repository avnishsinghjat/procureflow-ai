import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { getCurrentUser, setCurrentUser, login as storeLogin, logout as storeLogout, initStore } from '@/lib/store';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => User | null;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => null,
  logout: () => {},
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initStore();
    const u = getCurrentUser();
    setUser(u);
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string) => {
    const u = storeLogin(email, password);
    setUser(u);
    return u;
  };

  const logout = () => {
    storeLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
