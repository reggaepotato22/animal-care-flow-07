export type TokenPlan = "demo" | "starter" | "professional" | "clinic-chain";

export interface AccessToken {
  code: string;
  plan: TokenPlan;
  clinicName: string;
  maxUsers: number | "unlimited";
  features: string[];
  createdAt: string;
  expiresAt: string | null;
  isDemo: boolean;
}

export const DEMO_TOKEN_CODE = "DEMO-INNOVETPRO-2024";

const TOKENS_KEY = "acf_access_tokens";
const ACTIVE_TOKEN_KEY = "acf_active_token";

export const PLAN_MAX_USERS: Record<TokenPlan, number | "unlimited"> = {
  demo: "unlimited",
  starter: 2,
  professional: 10,
  "clinic-chain": "unlimited",
};

export const PLAN_FEATURES: Record<TokenPlan, string[]> = {
  demo: ["all"],
  starter: ["patients", "appointments", "billing", "basic_records"],
  professional: ["patients", "appointments", "billing", "records", "inventory", "labs", "reminders", "reporting"],
  "clinic-chain": ["all"],
};

export const PLAN_LABELS: Record<TokenPlan, string> = {
  demo: "Demo – Full Access",
  starter: "Starter",
  professional: "Professional",
  "clinic-chain": "Clinic Chain",
};

const DEMO_TOKEN: AccessToken = {
  code: DEMO_TOKEN_CODE,
  plan: "demo",
  clinicName: "InnoVetPro Demo Clinic",
  maxUsers: "unlimited",
  features: ["all"],
  createdAt: new Date().toISOString(),
  expiresAt: null,
  isDemo: true,
};

function loadStoredTokens(): AccessToken[] {
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as AccessToken[]) : [];
  } catch { return []; }
}

function saveTokens(tokens: AccessToken[]): void {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

function generateCode(plan: TokenPlan): string {
  const prefix = plan === "starter" ? "STR" : plan === "professional" ? "PRO" : plan === "clinic-chain" ? "ENT" : "DEMO";
  const part = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${part()}-${part()}`;
}

export function generateToken(
  plan: Exclude<TokenPlan, "demo">,
  clinicName: string,
  expiryDays?: number
): AccessToken {
  const token: AccessToken = {
    code: generateCode(plan),
    plan,
    clinicName: clinicName.trim() || `${PLAN_LABELS[plan]} Clinic`,
    maxUsers: PLAN_MAX_USERS[plan],
    features: PLAN_FEATURES[plan],
    createdAt: new Date().toISOString(),
    expiresAt: expiryDays ? new Date(Date.now() + expiryDays * 86_400_000).toISOString() : null,
    isDemo: false,
  };
  saveTokens([...loadStoredTokens(), token]);
  return token;
}

export function validateToken(code: string): AccessToken | null {
  const norm = code.trim().toUpperCase();
  if (norm === DEMO_TOKEN_CODE.toUpperCase()) return DEMO_TOKEN;
  const token = loadStoredTokens().find(t => t.code.toUpperCase() === norm);
  if (!token) return null;
  if (token.expiresAt && new Date(token.expiresAt) < new Date()) return null;
  return token;
}

export function setActiveToken(token: AccessToken | null): void {
  if (token) localStorage.setItem(ACTIVE_TOKEN_KEY, JSON.stringify(token));
  else localStorage.removeItem(ACTIVE_TOKEN_KEY);
}

export function getActiveToken(): AccessToken | null {
  try {
    const raw = localStorage.getItem(ACTIVE_TOKEN_KEY);
    return raw ? (JSON.parse(raw) as AccessToken) : null;
  } catch { return null; }
}

export function loadAllTokens(): AccessToken[] {
  return loadStoredTokens();
}

export function revokeToken(code: string): void {
  saveTokens(loadStoredTokens().filter(t => t.code !== code));
}
