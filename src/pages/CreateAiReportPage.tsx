import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Loader2, Save, Sparkles, ArrowLeft } from "lucide-react";
import { AiReportDashboard } from "@/components/reports/AiReportDashboard";
import {
  generateAiReportPreview,
  saveAiReport,
  type AiReportDashboardData,
  type AiReportDefinition,
} from "@/config/aiReportsApi";
import { isOpenRouterConfigured } from "@/config/openRouter";
import { cn } from "@/components/ui/utils";

type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function CreateAiReportPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      id: newId(),
      role: "assistant",
      content:
        "Descreva o painel que você precisa. Você pode pedir várias análises de uma vez, por exemplo:\n• Vendas totais por região (barras)\n• Ranking de vendedores nos últimos 3 meses\n• Faturamento por produto (tabela)",
    },
  ]);
  const [definition, setDefinition] = useState<AiReportDefinition | null>(null);
  const [dashboard, setDashboard] = useState<AiReportDashboardData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [allowedRoles, setAllowedRoles] = useState<string[]>(["admin", "manager", "viewer"]);

  const configured = isOpenRouterConfigured();

  const conversationForApi = useMemo(
    () =>
      messages
        .filter((m) => m.role === "user")
        .map((m) => ({ role: "user" as const, content: m.content })),
    [messages]
  );

  function toggleRole(roleId: string, checked: boolean) {
    setAllowedRoles((prev) => {
      if (checked) return Array.from(new Set([...prev, roleId]));
      return prev.filter((role) => role !== roleId);
    });
  }

  async function handleGenerate() {
    const prompt = message.trim();
    if (!prompt) return;
    if (!configured) {
      setErrorMessage("Configure a chave OpenRouter em Configurações > OpenRouter.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsGenerating(true);

    const userTurn: ChatTurn = { id: newId(), role: "user", content: prompt };
    setMessages((prev) => [...prev, userTurn]);
    setMessage("");

    try {
      const history = conversationForApi.filter((turn) => turn.content !== prompt);
      const result = await generateAiReportPreview(prompt, history);
      setDefinition(result.definition);
      setDashboard(result.dashboard);

      const widgetCount = result.dashboard.widgets.length;
      const assistantText = `Painel pronto: **${result.definition.title}** com ${widgetCount} visualização(ões).\n\n${result.definition.description}`;
      setMessages((prev) => [...prev, { id: newId(), role: "assistant", content: assistantText }]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível gerar o relatório.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSave() {
    if (!definition) {
      setErrorMessage("Gere uma prévia antes de salvar.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const promptSummary = messages
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .join("\n");

      const saved = await saveAiReport({
        definition,
        prompt_summary: promptSummary || definition.business_rules,
        is_public: isPublic,
        allowed_roles: allowedRoles,
      });
      setSuccessMessage("Relatório salvo com sucesso.");
      navigate(`/reports/${saved.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível salvar o relatório.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button asChild variant="outline">
          <Link to="/dashboards">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-semibold">Criar relatório com IA</h1>
        </div>
      </div>

      {!configured ? (
        <Alert variant="destructive">
          <AlertTitle>OpenRouter não configurado</AlertTitle>
          <AlertDescription>
            Configure sua chave em{" "}
            <Link to="/settings/openrouter" className="underline">
              Configurações &gt; OpenRouter
            </Link>{" "}
            para gerar relatórios.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="flex flex-col min-h-[560px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Conversa
            </CardTitle>
            <CardDescription>
              Explique o indicador, filtros e regras de negócio. A IA consulta vendas, produtos, clientes e regiões.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <ScrollArea className="flex-1 min-h-[320px] rounded-lg border p-4">
              <div className="space-y-4">
                {messages.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                      chat.role === "user" ? "bg-primary text-primary-foreground ml-8" : "bg-muted mr-8"
                    )}
                  >
                    {chat.content}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Textarea
                placeholder="Ex.: Vendas totais por região em barras, ranking de vendedores nos últimos 3 meses, faturamento por produto em tabela"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[80px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleGenerate();
                  }
                }}
              />
              <Button
                type="button"
                className="self-end"
                disabled={isGenerating || !message.trim()}
                onClick={() => void handleGenerate()}
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prévia do painel</CardTitle>
              <CardDescription>
                {dashboard
                  ? `${dashboard.widgets.length} visualização(ões) e ${dashboard.kpis.length} KPI(s).`
                  : "Cada pedido vira um bloco do painel — gráficos, tabelas e KPIs no topo."}
              </CardDescription>
          </CardHeader>
          <CardContent>
            {definition && dashboard ? (
              <AiReportDashboard
                title={definition.title}
                description={definition.description}
                businessRules={definition.business_rules}
                dashboard={dashboard}
                compact
              />
            ) : (
                <p className="text-sm text-muted-foreground">
                  A prévia aparecerá aqui depois que você descrever o relatório.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compartilhamento</CardTitle>
              <CardDescription>Defina quem poderá visualizar este relatório na plataforma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is-public"
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked === true)}
                />
                <Label htmlFor="is-public">Tornar público para todos os usuários autenticados</Label>
              </div>

              <div className="space-y-2">
                <Label>Perfis com acesso</Label>
                {[
                  { id: "admin", label: "Administradores" },
                  { id: "manager", label: "Gestores" },
                  { id: "viewer", label: "Colaboradores" },
                ].map((role) => (
                  <div key={role.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={allowedRoles.includes(role.id)}
                      onCheckedChange={(checked) => toggleRole(role.id, checked === true)}
                    />
                    <Label htmlFor={`role-${role.id}`}>{role.label}</Label>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                className="w-full"
                disabled={!definition || isSaving}
                onClick={() => void handleSave()}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar relatório
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {errorMessage ? <p className="text-destructive text-sm">{errorMessage}</p> : null}
      {successMessage ? <p className="text-emerald-600 text-sm">{successMessage}</p> : null}
    </div>
  );
}
