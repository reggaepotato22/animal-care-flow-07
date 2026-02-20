import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

const ADMIN_AUTH_STORAGE_KEY = "vetcare-admin-auth";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

const ADMIN_USER: AdminUser = {
  id: "admin-1",
  email: "admin@vetcare.demo",
  name: "Admin",
};

export const ADMIN_CREDENTIALS = {
  email: "admin@vetcare.demo",
  password: "admin123",
};

interface AdminAuthContextValue {
  user: AdminUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

function loadStoredAdminUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminUser;
    if (parsed?.id && parsed?.email && parsed?.name) return parsed;
  } catch {
    // ignore
  }
  return null;
}

function saveAdminUser(user: AdminUser | null) {
  if (user) {
    localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(loadStoredAdminUser);

  const login = useCallback((email: string, password: string): boolean => {
    const normalizedEmail = email.trim().toLowerCase();
    if (
      normalizedEmail === ADMIN_CREDENTIALS.email &&
      password === ADMIN_CREDENTIALS.password
    ) {
      setUser(ADMIN_USER);
      saveAdminUser(ADMIN_USER);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveAdminUser(null);
  }, []);

  useEffect(() => {
    setUser(loadStoredAdminUser());
  }, []);

  const value: AdminAuthContextValue = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
