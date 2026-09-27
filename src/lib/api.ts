export interface PolicyPlan { headline: string; explanation: string; disclosures: string[]; }
export interface PublicMetrics { finalized_receipts: number; unique_windows: number; }
export interface ServiceStatus { status: "ok"; storage: string; release: string; }
export const apiBase = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:8000" : "");
const timeoutMs = 8_000;

export class PublicApiError extends Error {
  constructor(message: string, readonly requestId?: string) { super(message); }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${apiBase}${path}`, { ...init, signal: controller.signal, headers: { "Content-Type": "application/json", ...init.headers } });
    if (!response.ok) throw new PublicApiError("The public service is unavailable. Your private credential has not left this browser.", response.headers.get("X-Request-ID") ?? undefined);
    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof PublicApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new PublicApiError("The public service took too long to respond. Please try again.");
    throw new PublicApiError("The public service could not be reached. Your private credential has not left this browser.");
  } finally { window.clearTimeout(timeout); }
}

export async function getPolicyPlan(requirement: string): Promise<PolicyPlan> {
  return request<PolicyPlan>("/api/v1/public-policy-plan", { method: "POST", body: JSON.stringify({ requirement }) });
}
export async function recordReceipt(receipt: { transaction_id: string; network: string; window_id: string; disclosure_scope: string[] }): Promise<void> {
  await request<{ accepted: boolean }>("/api/v1/proof-receipts", { method: "POST", body: JSON.stringify(receipt) });
}

export async function getPublicSnapshot(): Promise<{ metrics: PublicMetrics; service: ServiceStatus }> {
  const [metrics, service] = await Promise.all([request<PublicMetrics>("/api/v1/metrics"), request<ServiceStatus>("/health")]);
  return { metrics, service };
}
