import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

const AUTH_STORAGE_KEY = "vetcare-demo-auth";

export interface User {
  id: string;
  email: string;
  name: string;
}

const DEMO_USER: User = {
  id: "demo-1",
  email: "demo@vetcare.demo",
  name: "Demo User",
};

const DEMO_CREDENTIALS = {
  email: "demo@vetcare.demo",
  password: "demo123",
};

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (parsed?.id && parsed?.email && parsed?.name) return parsed;
  } catch {
    // ignore
  }
  return null;
}

function saveUser(user: User | null) {
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser);

  const login = useCallback((email: string, password: string): boolean => {
    const normalizedEmail = email.trim().toLowerCase();
    if (
      normalizedEmail === DEMO_CREDENTIALS.email &&
      password === DEMO_CREDENTIALS.password
    ) {
      setUser(DEMO_USER);
      saveUser(DEMO_USER);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveUser(null);
  }, []);

  // Hydrate from storage on mount (e.g. new tab)
  useEffect(() => {
    setUser(loadStoredUser());
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { DEMO_CREDENTIALS };
