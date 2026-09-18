import { openRouterChatCompletion } from "@/config/openRouter";

export type TitleMessage = { role: string; content: string };

const TITLE_MAX_CHARS = 36;
const TITLE_MAX_WORDS = 5;

/** Mantém o título curto o bastante para a sidebar. */
export function shortenConversationTitle(title: string): string {
  const line = title.replace(/\s+/g, " ").trim();
  if (!line) return "Nova conversa";

  const words = line.split(" ");
  let short =
    words.length > TITLE_MAX_WORDS ? words.slice(0, TITLE_MAX_WORDS).join(" ") : line;

  if (short.length > TITLE_MAX_CHARS) {
    const clipped = short.slice(0, TITLE_MAX_CHARS - 1);
    const lastSpace = clipped.lastIndexOf(" ");
    short = (lastSpace > 12 ? clipped.slice(0, lastSpace) : clipped).trimEnd();
  }

  if (short.length < line.length) {
    return `${short}…`;
  }
  return short;
}

/** Título provisório a partir da primeira mensagem do usuário. */
export function fallbackTitleFromMessages(messages: TitleMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "Nova conversa";
  return shortenConversationTitle(first.content);
}

/**
 * Título curto em PT-BR via OpenRouter (resumo do tema da conversa).
 */
export async function generateSmartConversationTitle(messages: TitleMessage[]): Promise<string> {
  if (messages.length === 0) return "Nova conversa";
  const snippet = messages
    .slice(0, 10)
    .map((m) => `${m.role}: ${m.content.slice(0, 450)}`)
    .join("\n\n");

  const raw = await openRouterChatCompletion(
    [
      {
        role: "system",
        content:
          "Gere apenas um título bem curto em português do Brasil (máximo 5 palavras) que resuma o tema da conversa. Ex.: \"Vendas do mês\", \"Ticket médio\". Sem aspas. Sem emojis. Uma única linha.",
      },
      { role: "user", content: snippet },
    ],
    { maxTokens: 32, temperature: 0.25 }
  );

  const cleaned = raw
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/^[^:]+:\s*/, "")
    .trim()
    .split("\n")[0]
    .trim();

  if (cleaned.length < 3) {
    return fallbackTitleFromMessages(messages);
  }
  return shortenConversationTitle(cleaned);
}
