export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

async function apiRequest<T>(
  endpoint: string,
  init?: RequestInit,
  options?: { requireData?: boolean }
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    cache: "no-store",
    referrerPolicy: "no-referrer",
    ...init,
  });
  const payload = (await response.json()) as { success: boolean; message?: string; data?: T };
  const requireData = options?.requireData ?? true;

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
