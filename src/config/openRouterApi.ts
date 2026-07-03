import { apiDelete, apiGet, apiPost, apiPut } from "@/config/api";

export type OpenRouterSettingsResponse = {
  api_key: string;
  default_model: string;
  has_api_key: boolean;
  api_key_masked: string;
  source: "database" | "env" | "none";
  updated_at: string | null;
  updated_by: number | null;
};

export type OpenRouterTestResponse = {
  model_count: number;
};

export async function fetchOpenRouterSettings(): Promise<OpenRouterSettingsResponse> {
  return apiGet<OpenRouterSettingsResponse>("/openrouter_settings.php");
}

export async function saveOpenRouterSettings(payload: {
  api_key: string;
  default_model: string;
}): Promise<OpenRouterSettingsResponse> {
  return apiPut<OpenRouterSettingsResponse, typeof payload>("/openrouter_settings.php", payload);
}

export async function clearOpenRouterSettings(): Promise<OpenRouterSettingsResponse> {
  return apiDelete<OpenRouterSettingsResponse>("/openrouter_settings.php");
}

export async function testOpenRouterSettings(payload?: {
  api_key?: string;
}): Promise<OpenRouterTestResponse> {
  return apiPost<OpenRouterTestResponse, { api_key?: string }>(
    "/openrouter_settings.php?action=test",
    payload ?? {}
  );
}
