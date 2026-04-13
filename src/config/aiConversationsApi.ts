import { apiGet, apiPatch, apiPost } from "@/config/api";

export type ApiChatTurn = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timeLabel: string;
};

export type ApiAiConversation = {
  id: number;
  user_id: number;
  title: string;
  messages: ApiChatTurn[];
  created_at: string;
  updated_at: string;
};

export async function fetchAiConversations(userId: number): Promise<ApiAiConversation[]> {
  const rows = await apiGet<ApiAiConversation[]>(
    `/ai_conversations.php?user_id=${encodeURIComponent(String(userId))}`
  );
  return Array.isArray(rows) ? rows : [];
}

export async function fetchAiConversation(userId: number, id: number): Promise<ApiAiConversation> {
  return apiGet<ApiAiConversation>(
    `/ai_conversations.php?id=${encodeURIComponent(String(id))}&user_id=${encodeURIComponent(String(userId))}`
  );
}

export async function createAiConversation(
  userId: number,
  title: string,
  messages: ApiChatTurn[]
): Promise<ApiAiConversation> {
  return apiPost<ApiAiConversation, { user_id: number; title: string; messages: ApiChatTurn[] }>(
    "/ai_conversations.php",
    { user_id: userId, title, messages }
  );
}

export async function updateAiConversation(
  id: number,
  userId: number,
  payload: { title?: string; messages?: ApiChatTurn[] }
): Promise<ApiAiConversation> {
  return apiPatch<ApiAiConversation, { user_id: number; title?: string; messages?: ApiChatTurn[] }>(
    `/ai_conversations.php?id=${encodeURIComponent(String(id))}`,
    { user_id: userId, ...payload }
  );
}
