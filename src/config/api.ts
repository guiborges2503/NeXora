import { clearAuthSession, getAuthToken } from "@/config/auth";

/**
 * API no mesmo domínio do site.
 * Produção: https://nexora.conectaxcon.com.br/api/...
 * Dev local: Vite faz proxy de /api → PHP (npm run dev:api) — só para desenvolvimento.
 */
export const API_BASE_URL = "/api";

async function apiRequest<T>(
  endpoint: string,
  init?: RequestInit,
  options?: { requireData?: boolean }
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    cache: "no-store",
    referrerPolicy: "no-referrer",
    ...init,
    headers,
  });
  const payload = (await response.json()) as { success: boolean; message?: string; data?: T };
  const requireData = options?.requireData ?? true;

  if (response.status === 401) {
    clearAuthSession();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth/")) {
      window.location.assign("/auth/session-expired");
    }
    throw new Error(payload.message ?? "Sessão expirada");
  }

  if (!response.ok || !payload.success || (requireData && payload.data === undefined)) {
    throw new Error(payload.message ?? "Falha na requisição da API");
  }

  return payload.data as T;
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: "GET" }, { requireData: true });
}

export async function apiPost<TResponse, TBody>(
  endpoint: string,
  body: TBody
): Promise<TResponse> {
  return apiRequest<TResponse>(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, { requireData: true });
}

export async function apiPut<TResponse, TBody>(
  endpoint: string,
  body: TBody
): Promise<TResponse> {
  return apiRequest<TResponse>(endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, { requireData: true });
}

export async function apiPatch<TResponse, TBody>(
  endpoint: string,
  body: TBody
): Promise<TResponse> {
  return apiRequest<TResponse>(endpoint, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, { requireData: true });
}

export async function apiDelete<TResponse>(endpoint: string): Promise<TResponse> {
  return apiRequest<TResponse>(endpoint, { method: "DELETE" }, { requireData: false });
}
