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

export const DEMO_CREDENTIALS: DemoCredentials = {
  email: "demo@vetcare.demo",
  password: "demo123",
};
