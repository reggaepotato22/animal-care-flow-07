import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { DEMO_USER, getDemoCredentials } from "@/lib/authStore";
import { DEMO_ACCOUNT_ID, setActiveAccountId, getAccountScopedKey, createAccount } from "@/lib/accountStore";
import type { Role } from "@/lib/rbac";
import type { AccessToken } from "@/lib/tokenStore";

const AUTH_STORAGE_KEY = "vetcare-demo-auth";

export interface User {
  id: string;
  email: string;
  name: string;
}

const TOKEN_ACCOUNT_MAP_KEY = "acf_token_account_map";

function getTokenAccountId(tokenCode: string): string | null {
  try {
    const map = JSON.parse(localStorage.getItem(TOKEN_ACCOUNT_MAP_KEY) || "{}");
    return map[tokenCode] ?? null;
  } catch { return null; }
}

function setTokenAccountId(tokenCode: string, accountId: string): void {
  try {
    const map = JSON.parse(localStorage.getItem(TOKEN_ACCOUNT_MAP_KEY) || "{}");
    map[tokenCode] = accountId;
    localStorage.setItem(TOKEN_ACCOUNT_MAP_KEY, JSON.stringify(map));
  } catch {}
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  loginWithToken: (email: string, token: AccessToken) => boolean;
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
   * Token-gated login.
   * Demo tokens → shared demo environment.
   * Production tokens → isolated account per token code.
   */
  const loginWithToken = useCallback((email: string, token: AccessToken): boolean => {
    if (token.isDemo) {
      setUser(DEMO_USER);
      saveUser(DEMO_USER);
      setActiveAccountId(DEMO_ACCOUNT_ID);
      const roleKey = getAccountScopedKey("acf_role", DEMO_ACCOUNT_ID);
      if (!localStorage.getItem(roleKey)) {
        try { localStorage.setItem(roleKey, JSON.stringify("SuperAdmin")); } catch {}
      }
    } else {
      // Production: isolated account per token
      let accountId = getTokenAccountId(token.code);
      if (!accountId) {
        const acct = createAccount({
          name: token.clinicName,
          ownerEmail: email.trim().toLowerCase(),
          mode: "live",
        });
        accountId = acct.id;
        setTokenAccountId(token.code, accountId);
      }
      setActiveAccountId(accountId);
      const nameFromEmail = email.split("@")[0].replace(/[._-]/g, " ");
      const prodUser: User = {
        id: `u-${token.code.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now()}`,
        email: email.trim().toLowerCase(),
        name: nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1),
      };
      setUser(prodUser);
      saveUser(prodUser);
      const roleKey = getAccountScopedKey("acf_role", accountId);
      if (!localStorage.getItem(roleKey)) {
        try { localStorage.setItem(roleKey, JSON.stringify("SuperAdmin")); } catch {}
      }
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
