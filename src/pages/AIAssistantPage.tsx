import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, Sparkles, Loader2, MessageSquarePlus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/components/ui/utils";
import { isPwaMode } from "@/config/pwa";
import { getUserInitials, getStoredUser } from "@/config/currentUser";
import { getCurrentUserId } from "@/config/favorites";
import { API_BASE_URL } from "@/config/api";
import {
  getOpenRouterSettings,
  isOpenRouterConfigured,
  openRouterChatCompletion,
  OpenRouterConfigurationError,
  type OpenRouterChatMessage,
} from "@/config/openRouter";
import {
  createAiConversation,
  fetchAiConversation,
  fetchAiConversations,
  updateAiConversation,
  type ApiAiConversation,
  type ApiChatTurn,
} from "@/config/aiConversationsApi";
import { fallbackTitleFromMessages, generateSmartConversationTitle } from "@/config/aiConversationTitle";

const SYSTEM_PROMPT = `Você é o assistente de Business Intelligence da plataforma NeXora.
Responda sempre em português do Brasil, de forma clara e objetiva.
Quando não houver dados concretos no contexto, diga isso e sugira quais indicadores ou painéis o usuário poderia consultar.
Use markdown leve quando ajudar (títulos ##, listas, **negrito**).`;

type ChatTurn = ApiChatTurn;

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTimeLabel(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function hasUserMessage(msgs: ChatTurn[]): boolean {
  return msgs.some((m) => m.role === "user");
}

function shouldOfferSmartTitle(msgs: ChatTurn[]): boolean {
  return msgs.some((m) => m.role === "assistant");
}

export function AIAssistantPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [activeDbId, setActiveDbId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<ApiAiConversation[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [modelLabel, setModelLabel] = useState(() => getOpenRouterSettings().defaultModel);
  const [configured, setConfigured] = useState(() => isOpenRouterConfigured());
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatTurn[]>([]);
  const activeDbIdRef = useRef<number | null>(null);
  const pwaMode = isPwaMode();
  const user = getStoredUser();
  const userInitials = getUserInitials(user?.name);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    activeDbIdRef.current = activeDbId;
  }, [activeDbId]);

  const syncSettings = useCallback(() => {
    setModelLabel(getOpenRouterSettings().defaultModel);
    setConfigured(isOpenRouterConfigured());
  }, []);

  const refreshConversationList = useCallback(async () => {
    const uid = getCurrentUserId();
    if (!uid) {
      setConversations([]);
      return;
    }
    try {
      const list = await fetchAiConversations(uid);
      setConversations(list);
      setListError(null);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Não foi possível carregar conversas.");
    }
  }, []);

  useEffect(() => {
    syncSettings();
    void refreshConversationList();
    function onUpdate() {
      syncSettings();
    }
    window.addEventListener("nexora-openrouter-updated", onUpdate);
    return () => window.removeEventListener("nexora-openrouter-updated", onUpdate);
  }, [syncSettings, refreshConversationList]);

  const refineTitleInBackground = useCallback((conversationId: number, userId: number, msgs: ChatTurn[]) => {
    if (!shouldOfferSmartTitle(msgs)) return;
    void (async () => {
      try {
        const smart = await generateSmartConversationTitle(msgs);
        await updateAiConversation(conversationId, userId, { title: smart });
        await refreshConversationList();
      } catch {
        /* ignora falha de título */
      }
    })();
  }, [refreshConversationList]);

  const persistThread = useCallback(
    async (msgs: ChatTurn[], dbId: number | null): Promise<number | null> => {
      const uid = getCurrentUserId();
      if (!uid || msgs.length === 0 || !hasUserMessage(msgs)) {
        return dbId;
      }
      try {
        if (dbId === null) {
          const created = await createAiConversation(
            uid,
            fallbackTitleFromMessages(msgs),
            msgs
          );
          refineTitleInBackground(created.id, uid, msgs);
          await refreshConversationList();
          return created.id;
        }
        await updateAiConversation(dbId, uid, { messages: msgs });
        refineTitleInBackground(dbId, uid, msgs);
        await refreshConversationList();
        return dbId;
      } catch {
        return dbId;
      }
    },
    [refineTitleInBackground, refreshConversationList]
  );

  const flushDraftToServer = useCallback(async () => {
    await persistThread(messagesRef.current, activeDbIdRef.current);
  }, [persistThread]);

  const startNewConversation = useCallback(async () => {
    abortRef.current?.abort();
    await flushDraftToServer();
    setActiveDbId(null);
    setMessages([]);
    setMessage("");
    setSendError(null);
    setIsSending(false);
  }, [flushDraftToServer]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('[data-slot="dialog-content"]')) {
        return;
      }
      e.preventDefault();
      void startNewConversation();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [startNewConversation]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void flushDraftToServer();
      }
    };
    const onPageHide = () => {
      void flushDraftToServer();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [flushDraftToServer]);

  useEffect(() => {
    const onBeforeUnload = () => {
      const uid = getCurrentUserId();
      if (!uid) return;
      const msgs = messagesRef.current;
      const dbId = activeDbIdRef.current;
      if (msgs.length === 0 || !hasUserMessage(msgs)) return;
      const title = fallbackTitleFromMessages(msgs);
      const body = dbId
        ? JSON.stringify({ user_id: uid, messages: msgs })
        : JSON.stringify({ user_id: uid, title, messages: msgs });
      const url = dbId
        ? `${API_BASE_URL}/ai_conversations.php?id=${encodeURIComponent(String(dbId))}`
        : `${API_BASE_URL}/ai_conversations.php`;
      const method = dbId ? "PATCH" : "POST";
      fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  const conversationStarters = [
    "Analise o desempenho de vendas do mês",
    "Quais são os principais indicadores de alerta?",
    "Compare este trimestre com o anterior",
    "Identifique oportunidades de crescimento",
  ];

  async function openConversation(convId: number) {
    abortRef.current?.abort();
    await flushDraftToServer();
    const uid = getCurrentUserId();
    if (!uid) return;
    try {
      const row =
        conversations.find((c) => c.id === convId) ?? (await fetchAiConversation(uid, convId));
      setActiveDbId(convId);
      setMessages(row.messages.map((m) => ({ ...m })));
      setMessage("");
      setSendError(null);
      setIsSending(false);
    } catch {
      setSendError("Não foi possível abrir esta conversa.");
    }
  }

  const sendUserText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      setSendError(null);
      if (!isOpenRouterConfigured()) {
        setSendError("Configure a chave OpenRouter antes de enviar mensagens.");
        return;
      }

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      const priorMessages = messages;
      const wasEmptyThread = priorMessages.length === 0;
      let dbId = activeDbId;

      const userTurn: ChatTurn = {
        id: newId(),
        role: "user",
        content: trimmed,
        timeLabel: formatTimeLabel(new Date()),
      };

      const nextAfterUser = [...priorMessages, userTurn];
      setMessages(nextAfterUser);
      setMessage("");
      setIsSending(true);

      const historyForApi: OpenRouterChatMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...nextAfterUser.map((m) => ({ role: m.role, content: m.content }) as OpenRouterChatMessage),
      ];

      try {
        const reply = await openRouterChatCompletion(historyForApi, { signal: ac.signal });
        const assistantTurn: ChatTurn = {
          id: newId(),
          role: "assistant",
          content: reply.trim(),
          timeLabel: formatTimeLabel(new Date()),
        };
        const finalMessages = [...nextAfterUser, assistantTurn];
        setMessages(finalMessages);

        const uid = getCurrentUserId();
        if (uid) {
          const savedId = await persistThread(finalMessages, dbId);
          if (savedId !== null) {
            setActiveDbId(savedId);
          }
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (e instanceof OpenRouterConfigurationError) {
          setSendError(e.message);
          setConfigured(false);
        } else {
          setSendError(e instanceof Error ? e.message : "Não foi possível obter resposta da IA.");
        }
        setMessages((prev) => prev.filter((m) => m.id !== userTurn.id));
        setMessage(trimmed);
        if (wasEmptyThread) {
          setActiveDbId(null);
        }
      } finally {
        setIsSending(false);
        abortRef.current = null;
      }
    },
    [activeDbId, isSending, messages, persistThread]
  );

  function handleSubmit() {
    void sendUserText(message);
  }

  const uid = getCurrentUserId();

  function formatUpdated(iso: string): string {
    try {
      const d = new Date(iso.replace(" ", "T"));
      return d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-6 min-h-0",
        pwaMode
          ? "h-[calc(100dvh-10.5rem)] max-h-[calc(100dvh-10.5rem)]"
          : "h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)]",
      )}
    >
      <div
        className={cn(
          "grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0 lg:items-stretch",
          pwaMode && "gap-3",
        )}
      >
        <Card
          className={cn(
            "flex flex-col min-h-0 h-full max-h-full overflow-hidden",
            pwaMode && "hidden lg:flex",
          )}
        >
          <CardHeader className="flex-shrink-0 pb-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg">Conversas Recentes</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1"
                onClick={() => void startNewConversation()}
                title="Nova conversa (Esc)"
              >
                <MessageSquarePlus className="w-4 h-4" />
                Nova
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Conversas salvas no servidor ao sair (Esc, trocar de conversa ou fechar a aba).{" "}
              <span className="whitespace-nowrap">Esc</span> inicia conversa nova.
            </p>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
            <ScrollArea className="h-full min-h-[12rem] flex-1">
              <div className="space-y-1 px-4 pb-4">
                {!uid ? (
                  <p className="p-3 text-sm text-muted-foreground rounded-lg border bg-muted/30">
                    Faça login para sincronizar conversas.
                  </p>
                ) : null}
                {listError ? (
                  <p className="p-3 text-sm text-destructive rounded-lg border">{listError}</p>
                ) : null}
                {uid && !listError && conversations.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground rounded-lg border bg-muted/30">
                    Nenhuma conversa ainda. Envie uma mensagem para criar a primeira.
                  </p>
                ) : null}
                {conversations.map((c) => {
                  const isActive = c.id === activeDbId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => void openConversation(c.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-colors text-sm border",
                        isActive
                          ? "bg-primary/10 border-primary/30"
                          : "border-transparent hover:bg-accent hover:border-border",
                      )}
                    >
                      <p className="font-medium truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{formatUpdated(c.updated_at)}</p>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 flex flex-col min-h-0 h-full">
          <Card className="flex flex-1 flex-col min-h-0 h-full max-h-full overflow-hidden">
            <CardHeader className="border-b flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg">Assistente Inteligente</CardTitle>
                  <p className="text-sm text-muted-foreground truncate">
                    {configured ? (
                      <>
                        OpenRouter • <span className="font-mono text-xs">{modelLabel}</span>
                      </>
                    ) : (
                      <>
                        Configure a API em{" "}
                        <Link to="/settings/openrouter" className="text-primary underline-offset-2 hover:underline">
                          OpenRouter
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col min-h-0">
              {!configured ? (
                <div className="p-6 flex-shrink-0">
                  <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertTitle>API não configurada</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>Adicione sua chave e modelo em Configurações para conversar com a IA.</p>
                      <Button asChild variant="default" size="sm" className="mt-1">
                        <Link to="/settings/openrouter">Abrir configuração OpenRouter</Link>
                      </Button>
                    </AlertDescription>
                  </Alert>
                </div>
              ) : null}

              {sendError ? (
                <div className="px-6 pt-4 flex-shrink-0">
                  <Alert variant="destructive">
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{sendError}</AlertDescription>
                  </Alert>
                </div>
              ) : null}

              <div
                ref={messagesScrollRef}
                className={cn(
                  "flex-1 min-h-0 overflow-y-auto overscroll-contain",
                  configured ? "p-6" : "",
                  pwaMode && configured && "p-3",
                )}
              >
                <div className="space-y-6">
                  {messages.map((chat) => (
                    <div
                      key={chat.id}
                      className={cn(
                        "flex gap-3",
                        chat.role === "user" ? "justify-end" : "justify-start",
                      )}
                    >
                      {chat.role === "assistant" && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-primary/10">
                            <Bot className="w-4 h-4 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] space-y-2",
                          chat.role === "user" ? "items-end" : "items-start",
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3",
                            chat.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted",
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{chat.content}</p>
                        </div>
                        <span className="text-xs text-muted-foreground px-1">{chat.timeLabel}</span>
                      </div>
                      {chat.role === "user" && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {isSending ? (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10">
                          <Bot className="w-4 h-4 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="rounded-2xl px-4 py-3 bg-muted flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Gerando resposta…
                      </div>
                    </div>
                  ) : null}

                  {messages.length === 0 && configured ? (
                    <div className="pt-2 pb-4">
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="font-semibold mb-1">Como posso ajudar?</h3>
                        <p className="text-sm text-muted-foreground">Experimente estas perguntas:</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {conversationStarters.map((starter, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="h-auto py-3 px-4 text-left justify-start"
                            disabled={isSending}
                            onClick={() => void sendUserText(starter)}
                          >
                            <span className="text-sm line-clamp-2">{starter}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div
                className={cn(
                  "flex-shrink-0 border-t p-4",
                  pwaMode &&
                    "bg-card p-3 mb-[calc(4.5rem+env(safe-area-inset-bottom))] pb-[max(env(safe-area-inset-bottom),0.5rem)]",
                )}
              >
                <div className="flex gap-2">
                  <Input
                    placeholder={
                      configured ? "Digite sua pergunta..." : "Configure a API OpenRouter para começar"
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 bg-background"
                    disabled={!configured || isSending}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />
                  <Button size="lg" disabled={!configured || isSending || !message.trim()} onClick={handleSubmit}>
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
