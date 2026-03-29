export type AccountMode = "demo" | "live";
export type AccountLifecycle = "trial" | "active" | "suspended" | "canceled";

export type PlanFeatureKey =
  | "patients"
  | "appointments"
  | "clinical_records"
  | "labs"
  | "hospitalization"
  | "inventory"
  | "notifications"
  | "audit_logs"
  | "multi_location"
  | "api_access"
  | "custom_roles";

export type UsageMetricKey =
  | "users"
  | "patients"
  | "appointments_month"
  | "storage_mb";

export interface Plan {
  id: string;
  name: string;
  mode: AccountMode;
  features: Record<PlanFeatureKey, boolean>;
  limits: Partial<Record<UsageMetricKey, number>>;
  priceCentsMonthly: number;
  currency: string;
}

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid";

export interface Subscription {
  id: string;
  provider: "manual" | "stripe";
  status: SubscriptionStatus;
  planId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface AccountSettings {
  timezone: string;
  locale: string;
  dataRetentionDays: number;
}

export interface Account {
  id: string;
  name: string;
  mode: AccountMode;
  lifecycle: AccountLifecycle;
  createdAt: string;
  trialEndsAt?: string;
  ownerEmail?: string;
  planId: string;
  subscription?: Subscription;
  settings: AccountSettings;
}

const ACCOUNTS_KEY = "acf_accounts";
const ACTIVE_ACCOUNT_KEY = "acf_active_account_id";
const DEFAULT_ACCOUNT_SETTINGS: AccountSettings = {
  timezone: "UTC",
  locale: "en",
  dataRetentionDays: 365,
};

export const DEMO_ACCOUNT_ID = "acct-demo";
export const DEMO_PLAN_ID = "plan-demo";
export const LIVE_STARTER_PLAN_ID = "plan-live-starter";
export const LIVE_PRO_PLAN_ID = "plan-live-pro";

export const PLANS: Plan[] = [
  {
    id: DEMO_PLAN_ID,
    name: "Demo",
    mode: "demo",
    features: {
      patients: true,
      appointments: true,
      clinical_records: true,
      labs: true,
      hospitalization: true,
      inventory: true,
      notifications: true,
      audit_logs: true,
      multi_location: false,
      api_access: false,
      custom_roles: true,
    },
    limits: {
      users: 10,
      patients: 500,
      appointments_month: 500,
      storage_mb: 250,
    },
    priceCentsMonthly: 0,
    currency: "USD",
  },
  {
    id: LIVE_STARTER_PLAN_ID,
    name: "Starter",
    mode: "live",
    features: {
      patients: true,
      appointments: true,
      clinical_records: true,
      labs: true,
      hospitalization: true,
      inventory: true,
      notifications: true,
      audit_logs: true,
      multi_location: false,
      api_access: false,
      custom_roles: false,
    },
    limits: {
      users: 15,
      patients: 2000,
      appointments_month: 2500,
      storage_mb: 2000,
    },
    priceCentsMonthly: 7900,
    currency: "USD",
  },
  {
    id: LIVE_PRO_PLAN_ID,
    name: "Pro",
    mode: "live",
    features: {
      patients: true,
      appointments: true,
      clinical_records: true,
      labs: true,
      hospitalization: true,
      inventory: true,
      notifications: true,
      audit_logs: true,
      multi_location: true,
      api_access: true,
      custom_roles: true,
    },
    limits: {
      users: 75,
      patients: 25000,
      appointments_month: 25000,
      storage_mb: 25000,
    },
    priceCentsMonthly: 19900,
    currency: "USD",
  },
];

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function getActiveAccountId(): string {
  try {
    return localStorage.getItem(ACTIVE_ACCOUNT_KEY) || DEMO_ACCOUNT_ID;
  } catch {
    return DEMO_ACCOUNT_ID;
  }
}

export function setActiveAccountId(accountId: string): void {
  try {
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, accountId);
  } catch {}
}

export function getAccountScopedKey(baseKey: string, accountId?: string): string {
  const id = accountId ?? getActiveAccountId();
  return `acct:${id}:${baseKey}`;
}

export function getAccounts(): Account[] {
  if (typeof window === "undefined") return [];
  const existing = readJSON<Account[]>(ACCOUNTS_KEY, []);
  const hasDemo = existing.some(a => a.id === DEMO_ACCOUNT_ID);
  if (hasDemo) return existing;
  const demoAccount: Account = {
    id: DEMO_ACCOUNT_ID,
    name: "Demo Clinic",
    mode: "demo",
    lifecycle: "trial",
    createdAt: new Date().toISOString(),
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    planId: DEMO_PLAN_ID,
    settings: { ...DEFAULT_ACCOUNT_SETTINGS },
  };
  const next = [demoAccount, ...existing];
  writeJSON(ACCOUNTS_KEY, next);
  return next;
}

export function saveAccounts(accounts: Account[]): void {
  if (typeof window === "undefined") return;
  writeJSON(ACCOUNTS_KEY, accounts);
}

export function createAccount(input: {
  name: string;
  ownerEmail?: string;
  mode: AccountMode;
  planId?: string;
}): Account {
  const now = new Date().toISOString();
  const account: Account = {
    id: `acct-${Date.now()}`,
    name: input.name,
    ownerEmail: input.ownerEmail,
    mode: input.mode,
    lifecycle: input.mode === "demo" ? "trial" : "trial",
    createdAt: now,
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    planId: input.planId ?? (input.mode === "demo" ? DEMO_PLAN_ID : LIVE_STARTER_PLAN_ID),
    settings: { ...DEFAULT_ACCOUNT_SETTINGS },
  };
  const accounts = getAccounts();
  saveAccounts([account, ...accounts]);
  return account;
}

export function updateAccount(accountId: string, patch: Partial<Account>): Account | null {
  const accounts = getAccounts();
  const idx = accounts.findIndex(a => a.id === accountId);
  if (idx === -1) return null;
  const next = { ...accounts[idx], ...patch };
  const updated = [...accounts];
  updated[idx] = next;
  saveAccounts(updated);
  return next;
}

export function deleteAccount(accountId: string): void {
  const accounts = getAccounts().filter(a => a.id !== accountId);
  saveAccounts(accounts);
  const active = getActiveAccountId();
  if (active === accountId) setActiveAccountId(DEMO_ACCOUNT_ID);
}

export function getPlan(planId: string): Plan | undefined {
  return PLANS.find(p => p.id === planId);
}

export function getActiveAccount(): Account | null {
  const id = getActiveAccountId();
  return getAccounts().find(a => a.id === id) ?? null;
}

export function hasFeature(feature: PlanFeatureKey, account?: Account | null): boolean {
  const a = account ?? getActiveAccount();
  if (!a) return false;
  const plan = getPlan(a.planId);
  return !!plan?.features?.[feature];
}

export function getUsageLimit(metric: UsageMetricKey, account?: Account | null): number | null {
  const a = account ?? getActiveAccount();
  if (!a) return null;
  const plan = getPlan(a.planId);
  const limit = plan?.limits?.[metric];
  return typeof limit === "number" ? limit : null;
}

export function isDemoAccount(account?: Account | null): boolean {
  const a = account ?? getActiveAccount();
  return a?.mode === "demo";
}
