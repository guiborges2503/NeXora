import { openRouterChatCompletion } from "@/config/openRouter";

export type TitleMessage = { role: string; content: string };

/** Título provisório a partir da primeira mensagem do usuário. */
export function fallbackTitleFromMessages(messages: TitleMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "Nova conversa";
  const line = first.content.replace(/\s+/g, " ").trim();
  if (line.length <= 58) return line;
  return `${line.slice(0, 55)}…`;
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
          "Gere apenas um título curto em português do Brasil (máximo 10 palavras) que resuma o tema principal da conversa. Sem aspas. Sem emojis. Uma única linha.",
      },
      { role: "user", content: snippet },
    ],
    { maxTokens: 48, temperature: 0.25 }
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
  return cleaned.slice(0, 120);
}
