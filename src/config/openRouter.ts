const STORAGE_KEY = "nexora_openrouter_settings";

export type OpenRouterSettings = {
  apiKey: string;
  defaultModel: string;
};

const defaults: OpenRouterSettings = {
  apiKey: "",
  defaultModel: "openai/gpt-4o-mini",
};

export function getOpenRouterSettings(): OpenRouterSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as Partial<OpenRouterSettings>;
    return {
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
      defaultModel:
        typeof parsed.defaultModel === "string" && parsed.defaultModel.trim()
          ? parsed.defaultModel.trim()
          : defaults.defaultModel,
    };
  } catch {
    return { ...defaults };
  }
}

export function saveOpenRouterSettings(settings: OpenRouterSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent("nexora-openrouter-updated"));
}

export function clearOpenRouterSettings(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("nexora-openrouter-updated"));
}

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

export type OpenRouterTestResult =
  | { ok: true; modelCount: number }
  | { ok: false; message: string };

/** Valida a chave com GET /models (sem consumo de tokens). */
export async function testOpenRouterConnection(apiKey: string): Promise<OpenRouterTestResult> {
  const key = apiKey.trim();
  if (!key) {
    return { ok: false, message: "Informe a chave da API antes de testar." };
  }

  try {
    const res = await fetch(OPENROUTER_MODELS_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
        "X-Title": "NeXora",
      },
    });

    const raw = await res.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as { data?: unknown[]; error?: { message?: string } };
    } catch {
      parsed = null;
    }

    if (!res.ok) {
      const apiMsg =
        parsed && typeof parsed === "object" && parsed !== null && "error" in parsed
          ? (parsed as { error?: { message?: string } }).error?.message
          : undefined;
      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          message: apiMsg ?? "Chave inválida ou sem permissão para acessar a API.",
        };
      }
      return {
        ok: false,
        message: apiMsg ?? `A API retornou o status ${res.status}.`,
      };
    }

    const list =
      parsed && typeof parsed === "object" && parsed !== null && "data" in parsed
        ? (parsed as { data?: unknown[] }).data
        : undefined;
    const modelCount = Array.isArray(list) ? list.length : 0;

    return { ok: true, modelCount };
  } catch (e) {
    const hint =
      e instanceof TypeError
        ? " Não foi possível conectar (rede, CORS ou bloqueio do navegador)."
        : "";
    return {
      ok: false,
      message: `${e instanceof Error ? e.message : "Falha desconhecida"}.${hint}`,
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
