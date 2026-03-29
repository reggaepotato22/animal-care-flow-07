export interface DemoCredentials {
  email: string;
  password: string;
}

export interface DemoUser {
  id: string;
  email: string;
  name: string;
}

export const DEMO_USER: DemoUser = {
  id: "demo-1",
  email: "demo@vetcare.demo",
  name: "Demo User",
};

export const DEFAULT_DEMO_CREDENTIALS: DemoCredentials = {
  email: "demo@vetcare.demo",
  password: "demo123",
};

const DEMO_CREDENTIALS_KEY = "acf_demo_credentials";

export function getDemoCredentials(): DemoCredentials {
  try {
    const raw = localStorage.getItem(DEMO_CREDENTIALS_KEY);
    if (!raw) return DEFAULT_DEMO_CREDENTIALS;
    const parsed = JSON.parse(raw) as Partial<DemoCredentials>;
    if (typeof parsed.email !== "string" || typeof parsed.password !== "string") return DEFAULT_DEMO_CREDENTIALS;
    const email = parsed.email.trim().toLowerCase();
    const password = parsed.password;
    if (!email || !password) return DEFAULT_DEMO_CREDENTIALS;
    return { email, password };
  } catch {
    return DEFAULT_DEMO_CREDENTIALS;
  }
}

export function setDemoCredentials(creds: DemoCredentials): void {
  try {
    const email = creds.email.trim().toLowerCase();
    const password = creds.password;
    localStorage.setItem(DEMO_CREDENTIALS_KEY, JSON.stringify({ email, password }));
    window.dispatchEvent(new CustomEvent(DEMO_CREDENTIALS_KEY));
  } catch {}
}

export function resetDemoCredentials(): void {
  try {
    localStorage.removeItem(DEMO_CREDENTIALS_KEY);
    window.dispatchEvent(new CustomEvent(DEMO_CREDENTIALS_KEY));
  } catch {}
}

export function subscribeToDemoCredentials(cb: () => void): () => void {
  const onEvent = () => cb();
  window.addEventListener(DEMO_CREDENTIALS_KEY, onEvent);
  const onStorage = (e: StorageEvent) => {
    if (e.key === DEMO_CREDENTIALS_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(DEMO_CREDENTIALS_KEY, onEvent);
    window.removeEventListener("storage", onStorage);
  };
}
