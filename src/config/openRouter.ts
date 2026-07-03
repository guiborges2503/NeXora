import {
  clearOpenRouterSettings as clearOpenRouterSettingsApi,
  fetchOpenRouterSettings,
  saveOpenRouterSettings as saveOpenRouterSettingsApi,
  testOpenRouterSettings,
} from "@/config/openRouterApi";

const STORAGE_KEY = "nexora_openrouter_settings";

export type OpenRouterSettings = {
  apiKey: string;
  defaultModel: string;
};

const defaults: OpenRouterSettings = {
  apiKey: "",
  defaultModel: "openai/gpt-4o-mini",
};

let serverCache: OpenRouterSettings | null = null;
let serverLoadPromise: Promise<OpenRouterSettings> | null = null;

function normalizeSettings(raw: Partial<OpenRouterSettings>): OpenRouterSettings {
  return {
    apiKey: typeof raw.apiKey === "string" ? raw.apiKey : "",
    defaultModel:
      typeof raw.defaultModel === "string" && raw.defaultModel.trim()
        ? raw.defaultModel.trim()
        : defaults.defaultModel,
  };
}

function readLocalSettings(): OpenRouterSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    return normalizeSettings(JSON.parse(raw) as Partial<OpenRouterSettings>);
  } catch {
    return { ...defaults };
  }
}

function writeLocalSettings(settings: OpenRouterSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent("nexora-openrouter-updated"));
}

export function getOpenRouterSettings(): OpenRouterSettings {
  if (serverCache) {
    return { ...serverCache };
  }
  return readLocalSettings();
}

export async function loadOpenRouterSettingsFromServer(): Promise<OpenRouterSettings> {
  if (serverLoadPromise) {
    return serverLoadPromise;
  }

  serverLoadPromise = (async () => {
    try {
      const data = await fetchOpenRouterSettings();
      const settings = normalizeSettings({
        apiKey: data.api_key,
        defaultModel: data.default_model,
      });
      serverCache = settings;
      writeLocalSettings(settings);
      return settings;
    } catch {
      return readLocalSettings();
    } finally {
      serverLoadPromise = null;
    }
  })();

  return serverLoadPromise;
}

export function saveOpenRouterSettings(settings: OpenRouterSettings): void {
  const normalized = normalizeSettings(settings);
  serverCache = normalized;
  writeLocalSettings(normalized);
}

export async function persistOpenRouterSettings(settings: OpenRouterSettings): Promise<OpenRouterSettings> {
  const normalized = normalizeSettings(settings);
  const saved = await saveOpenRouterSettingsApi({
    api_key: normalized.apiKey,
    default_model: normalized.defaultModel,
  });
  const merged = normalizeSettings({
    apiKey: saved.api_key,
    defaultModel: saved.default_model,
  });
  serverCache = merged;
  writeLocalSettings(merged);
  return merged;
}

export async function clearOpenRouterSettingsRemote(): Promise<void> {
  await clearOpenRouterSettingsApi();
  serverCache = { ...defaults };
  writeLocalSettings({ ...defaults });
}

export function clearOpenRouterSettings(): void {
  serverCache = { ...defaults };
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("nexora-openrouter-updated"));
}

export type OpenRouterTestResult =
  | { ok: true; modelCount: number }
  | { ok: false; message: string };

export async function testOpenRouterConnection(apiKey: string): Promise<OpenRouterTestResult> {
  const key = apiKey.trim();
  if (!key) {
    return { ok: false, message: "Informe a chave da API antes de testar." };
  }

  try {
    const result = await testOpenRouterSettings({ api_key: key });
    return {
      ok: true,
      modelCount: result.model_count ?? 0,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Falha ao testar conexão.",
    };
  }
}

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

export type OpenRouterChatRole = "system" | "user" | "assistant";

export type OpenRouterChatMessage = {
  role: OpenRouterChatRole;
  content: string;
};

export type OpenRouterChatOptions = {
  model?: string;
  apiKey?: string;
  signal?: AbortSignal;
  temperature?: number;
  maxTokens?: number;
};

export class OpenRouterConfigurationError extends Error {
  constructor() {
    super("Configure a chave da API OpenRouter em Configurações → OpenRouter.");
    this.name = "OpenRouterConfigurationError";
  }
}

export function isOpenRouterConfigured(): boolean {
  return getOpenRouterSettings().apiKey.trim().length > 0;
}

function extractChatContent(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0] as { message?: { content?: unknown } };
  const content = first?.message?.content;
  if (typeof content === "string" && content.trim()) return content;
  return null;
}

function extractChatErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const err = (data as { error?: { message?: unknown } }).error;
  const msg = err?.message;
  return typeof msg === "string" ? msg : null;
}

/**
 * Chat compatível com OpenAI via OpenRouter (POST /chat/completions).
 */
export async function openRouterChatCompletion(
  messages: OpenRouterChatMessage[],
  options?: OpenRouterChatOptions
): Promise<string> {
  const settings = getOpenRouterSettings();
  const apiKey = (options?.apiKey ?? settings.apiKey).trim();
  if (!apiKey) {
    throw new OpenRouterConfigurationError();
  }
  const model =
    (options?.model ?? settings.defaultModel).trim() || defaults.defaultModel;

  const res = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
      "X-Title": "NeXora",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
    }),
    signal: options?.signal,
  });

  const raw = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(raw) as unknown;
  } catch {
    throw new Error(
      res.ok
        ? "A API retornou um corpo inválido."
        : `Erro HTTP ${res.status}: resposta não é JSON.`
    );
  }

  if (!res.ok) {
    throw new Error(extractChatErrorMessage(data) ?? `Erro HTTP ${res.status}.`);
  }

  const content = extractChatContent(data);
  if (!content) {
    throw new Error("A resposta da IA não continha texto utilizável.");
  }
  return content;
}
