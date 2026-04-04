import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { DEMO_USER, getDemoCredentials } from "@/lib/authStore";
import { DEMO_ACCOUNT_ID, setActiveAccountId, getAccountScopedKey } from "@/lib/accountStore";
import type { Role } from "@/lib/rbac";

const AUTH_STORAGE_KEY = "vetcare-demo-auth";

export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  loginWithToken: (email: string) => boolean;
  loginDemo: (email: string, password: string) => boolean;
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

const REGISTERED_USERS_KEY = "vetcare_registered_users";

export interface RegisteredUser extends User {
  password: string;
  accountId: string;
  role?: Role;
}

function getRegisteredUsers(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function registerUser(user: RegisteredUser) {
  const users = getRegisteredUsers();
  users.push(user);
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser);

  const login = useCallback((email: string, password: string): boolean => {
    const normalizedEmail = email.trim().toLowerCase();

    // Check registered users
    const registeredUsers = getRegisteredUsers();
    const found = registeredUsers.find(
      (u) => u.email.trim().toLowerCase() === normalizedEmail && u.password === password
    );

    if (found) {
      const { password: _, ...userWithoutPassword } = found;
      setUser(userWithoutPassword);
      saveUser(userWithoutPassword);
      if (found.accountId) {
        setActiveAccountId(found.accountId);
        // Restore this account's role so RoleContext picks it up
        const roleKey = getAccountScopedKey("acf_role", found.accountId);
        if (!localStorage.getItem(roleKey)) {
          const roleToSet: Role = found.role ?? "SuperAdmin";
          try { localStorage.setItem(roleKey, JSON.stringify(roleToSet)); } catch {}
        }
      }
      return true;
    }

    return false;
  }, []);

  /**
   * Token-gated demo login.
   * The token is validated before this is called; the email is recorded for
   * activity tracking only. Every successful login enters the shared demo
   * environment — there are no separate live accounts.
   */
  const loginWithToken = useCallback((_email: string): boolean => {
    setUser(DEMO_USER);
    saveUser(DEMO_USER);
    setActiveAccountId(DEMO_ACCOUNT_ID);
    const roleKey = getAccountScopedKey("acf_role", DEMO_ACCOUNT_ID);
    if (!localStorage.getItem(roleKey)) {
      try { localStorage.setItem(roleKey, JSON.stringify("SuperAdmin")); } catch {}
    }
    return true;
  }, []);

  const loginDemo = useCallback((email: string, password: string): boolean => {
    const normalizedEmail = email.trim().toLowerCase();
    const demoCreds = getDemoCredentials();
    if (normalizedEmail === demoCreds.email && password === demoCreds.password) {
      setUser(DEMO_USER);
      saveUser(DEMO_USER);
      setActiveAccountId(DEMO_ACCOUNT_ID);
      // Ensure demo account always has a role set
      const demoRoleKey = getAccountScopedKey("acf_role", DEMO_ACCOUNT_ID);
      if (!localStorage.getItem(demoRoleKey)) {
        try { localStorage.setItem(demoRoleKey, JSON.stringify("SuperAdmin")); } catch {}
      }
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
    loginWithToken,
    loginDemo,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
