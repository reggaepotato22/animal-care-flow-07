export interface AccessRequest {
  id: string;
  clinicName: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  hasToken: boolean;
  tokenCode: string;
  tokenPlan: string;
  tokenIsDemo: boolean;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

const KEY = "acf_access_requests";

export function getAccessRequests(): AccessRequest[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function submitAccessRequest(
  data: Omit<AccessRequest, "id" | "submittedAt" | "status">
): AccessRequest {
  const req: AccessRequest = {
    ...data,
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    submittedAt: new Date().toISOString(),
    status: "pending",
  };
  localStorage.setItem(KEY, JSON.stringify([req, ...getAccessRequests()]));
  return req;
}

export function updateRequestStatus(
  id: string,
  status: "pending" | "approved" | "rejected"
): void {
  const all = getAccessRequests().map((r) =>
    r.id === id ? { ...r, status } : r
  );
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteAccessRequest(id: string): void {
  localStorage.setItem(
    KEY,
    JSON.stringify(getAccessRequests().filter((r) => r.id !== id))
  );
}
