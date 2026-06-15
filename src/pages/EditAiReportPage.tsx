import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Bot,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  Sparkles,
} from "lucide-react";
import { AiReportDashboard } from "@/components/reports/AiReportDashboard";
import {
  executeAiReportPreview,
  fetchAiReport,
  generateAiReportPreview,
  updateAiReport,
  type AiReportDashboardData,
  type AiReportDefinition,
  type AiReportWidgetDefinition,
} from "@/config/aiReportsApi";
import { getCurrentUserId } from "@/config/favorites";
import { getStoredUser } from "@/config/currentUser";
import { isOpenRouterConfigured } from "@/config/openRouter";
import { cn } from "@/components/ui/utils";

type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const CHART_COLORS = [
  { value: "#2563eb", label: "Azul" },
  { value: "#16a34a", label: "Verde" },
  { value: "#ea580c", label: "Laranja" },
  { value: "#9333ea", label: "Roxo" },
  { value: "#0891b2", label: "Ciano" },
  { value: "#dc2626", label: "Vermelho" },
];

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildDefinitionFromState(
  definition: AiReportDefinition,
  dashboard: AiReportDashboardData
): AiReportDefinition {
  const widgets = (definition.widgets ?? []).map((widget, index) => {
    const executed = dashboard.widgets[index];
    return {
      ...widget,
      sql: executed?.sql ?? widget.sql,
      x_key: executed?.x_key ?? widget.x_key,
      y_key: executed?.y_key ?? widget.y_key,
    };
  });

  return {
    ...definition,
    layout: "dashboard",
    widgets,
    widget_count: widgets.length,
  };
}

export function EditAiReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportId = Number(id ?? 0);

  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [definition, setDefinition] = useState<AiReportDefinition | null>(null);
  const [dashboard, setDashboard] = useState<AiReportDashboardData | null>(null);
  const [promptSummary, setPromptSummary] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [allowedRoles, setAllowedRoles] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const configured = isOpenRouterConfigured();
  const currentUserId = getCurrentUserId();
  const currentRole = getStoredUser()?.role ?? "viewer";

  const conversationForApi = useMemo(
    () =>
      messages
        .filter((m) => m.role === "user")
        .map((m) => ({ role: "user" as const, content: m.content })),
    [messages]
  );

  useEffect(() => {
    if (!reportId) {
      setErrorMessage("Relatório inválido.");
      setIsLoading(false);
      return;
    }

    let mounted = true;

    async function loadReport() {
      try {
        const data = await fetchAiReport(reportId);
        if (!mounted) return;

        const report = data.report;
        const canEdit = report.owner_id === currentUserId || currentRole === "admin";
        if (!canEdit) {
          navigate(`/reports/${reportId}`, { replace: true });
          return;
        }

        const loadedDefinition = data.definition ?? {
          title: report.title,
          description: report.description,
          category: report.category,
          layout: "dashboard",
          widgets: data.dashboard.widgets.map((widget) => ({
            id: widget.id,
            title: widget.title,
            description: widget.description,
            chart_type: widget.chart_type,
            sql: widget.sql,
            x_key: widget.x_key,
            y_key: widget.y_key,
            span: widget.span,
            color: widget.color,
          })),
        };

        setDefinition(loadedDefinition);
        setDashboard(data.dashboard);
        setPromptSummary(report.prompt_summary ?? loadedDefinition.business_rules ?? "");
        setIsPublic(Boolean(report.is_public));
        setAllowedRoles(report.allowed_roles ?? []);

        const initialMessages: ChatTurn[] = [
          {
            id: newId(),
            role: "assistant",
            content:
              "Edite título, tipo de gráfico, cores e layout de cada bloco. Você também pode pedir à IA para regenerar ou adicionar análises.",
          },
        ];

        if (report.prompt_summary) {
          initialMessages.push({
            id: newId(),
            role: "user",
            content: report.prompt_summary,
          });
        }

        setMessages(initialMessages);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar o relatório.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadReport();
    return () => {
      mounted = false;
    };
  }, [reportId, currentUserId, currentRole, navigate]);

  function toggleRole(roleId: string, checked: boolean) {
    setAllowedRoles((prev) => {
      if (checked) return Array.from(new Set([...prev, roleId]));
      return prev.filter((role) => role !== roleId);
    });
  }

  function updatePanelField(field: "title" | "description" | "business_rules", value: string) {
    setDefinition((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  function updateWidget(index: number, patch: Partial<AiReportWidgetDefinition>) {
    setDefinition((prev) => {
      if (!prev?.widgets) return prev;
      const widgets = [...prev.widgets];
      widgets[index] = { ...widgets[index], ...patch };
      return { ...prev, widgets };
    });
    setDashboard((prev) => {
      if (!prev) return prev;
      const widgets = [...prev.widgets];
      widgets[index] = { ...widgets[index], ...patch };
      return { ...prev, widgets };
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
    setPromptSummary((prev) => (prev ? `${prev}\n${prompt}` : prompt));

    try {
      const history = conversationForApi.filter((turn) => turn.content !== prompt);
      const result = await generateAiReportPreview(prompt, history);
      setDefinition(result.definition);
      setDashboard(result.dashboard);

      const widgetCount = result.dashboard.widgets.length;
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "assistant",
          content: `Painel atualizado: **${result.definition.title}** com ${widgetCount} visualização(ões).`,
        },
      ]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível regenerar o painel.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRefreshPreview() {
    if (!definition) return;

    setIsRefreshing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = buildDefinitionFromState(definition, dashboard ?? { kpis: [], widgets: [] });
      const result = await executeAiReportPreview({
        definition: payload,
        prompt_summary: promptSummary || definition.business_rules,
      });
      setDefinition(result.definition);
      setDashboard(result.dashboard);
      setSuccessMessage("Prévia atualizada com os dados atuais.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível atualizar a prévia.");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleSave() {
    if (!definition || !dashboard) {
      setErrorMessage("Carregue o painel antes de salvar.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = buildDefinitionFromState(definition, dashboard);
      await updateAiReport(reportId, {
        definition: payload,
        prompt_summary: promptSummary || payload.business_rules,
        is_public: isPublic,
        allowed_roles: allowedRoles,
      });
      setSuccessMessage("Relatório atualizado com sucesso.");
      navigate(`/reports/${reportId}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível salvar as alterações.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando editor...</p>;
  }

  if (errorMessage && !definition) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{errorMessage}</p>
        <Button asChild variant="outline">
          <Link to="/dashboards">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button asChild variant="outline">
          <Link to={`/reports/${reportId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao painel
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Pencil className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-semibold">Editar relatório</h1>
        </div>
      </div>

      {!configured ? (
        <Alert variant="destructive">
          <AlertTitle>OpenRouter não configurado</AlertTitle>
          <AlertDescription>
            Você ainda pode editar título, tipo e cores. Para regenerar com IA, configure em{" "}
            <Link to="/settings/openrouter" className="underline">
              Configurações &gt; OpenRouter
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Painel</CardTitle>
              <CardDescription>Título e descrição exibidos no cabeçalho do relatório.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="panel-title">Título</Label>
                <Input
                  id="panel-title"
                  value={definition?.title ?? ""}
                  onChange={(e) => updatePanelField("title", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panel-description">Descrição</Label>
                <Textarea
                  id="panel-description"
                  value={definition?.description ?? ""}
                  onChange={(e) => updatePanelField("description", e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visualizações</CardTitle>
              <CardDescription>
                Personalize cada gráfico ou tabela. Alterações de tipo e cor aparecem na prévia ao lado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {definition?.widgets?.map((widget, index) => (
                <div key={widget.id} className="rounded-lg border p-4 space-y-3 bg-muted/10">
                  <p className="text-sm font-medium">Bloco {index + 1}</p>
                  <div className="space-y-2">
                    <Label htmlFor={`widget-title-${widget.id}`}>Título</Label>
                    <Input
                      id={`widget-title-${widget.id}`}
                      value={widget.title}
                      onChange={(e) => updateWidget(index, { title: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={widget.chart_type}
                        onValueChange={(value) =>
                          updateWidget(index, { chart_type: value as AiReportWidgetDefinition["chart_type"] })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bar">Barras</SelectItem>
                          <SelectItem value="line">Linha</SelectItem>
                          <SelectItem value="pie">Pizza</SelectItem>
                          <SelectItem value="table">Tabela</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Largura</Label>
                      <Select
                        value={widget.span ?? "half"}
                        onValueChange={(value) =>
                          updateWidget(index, { span: value as "half" | "full" })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="half">Metade</SelectItem>
                          <SelectItem value="full">Largura total</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {widget.chart_type !== "table" ? (
                    <div className="space-y-2">
                      <Label>Cor principal</Label>
                      <Select
                        value={widget.color ?? CHART_COLORS[0].value}
                        onValueChange={(value) => updateWidget(index, { color: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHART_COLORS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className="inline-flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full border"
                                  style={{ backgroundColor: option.value }}
                                />
                                {option.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="flex flex-col min-h-[420px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Regenerar com IA
              </CardTitle>
              <CardDescription>
                Peça ajustes ou novas análises. A IA substitui o painel atual pela nova versão.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <ScrollArea className="flex-1 min-h-[180px] rounded-lg border p-4">
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
                  placeholder="Ex.: Troque o gráfico de região para pizza e adicione ticket médio por vendedor"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[72px]"
                  disabled={!configured}
                />
                <Button
                  type="button"
                  className="self-end"
                  disabled={isGenerating || !message.trim() || !configured}
                  onClick={() => void handleGenerate()}
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Prévia do painel</CardTitle>
                  <CardDescription>
                    {dashboard
                      ? `${dashboard.widgets.length} visualização(ões) e ${dashboard.kpis.length} KPI(s).`
                      : "A prévia aparece aqui."}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!definition || isRefreshing}
                  onClick={() => void handleRefreshPreview()}
                >
                  {isRefreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>
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
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compartilhamento</CardTitle>
              <CardDescription>Quem pode visualizar este painel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-is-public"
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked === true)}
                />
                <Label htmlFor="edit-is-public">Público para todos os usuários autenticados</Label>
              </div>
              <div className="space-y-2">
                {[
                  { id: "admin", label: "Administradores" },
                  { id: "manager", label: "Gestores" },
                  { id: "viewer", label: "Colaboradores" },
                ].map((role) => (
                  <div key={role.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`edit-role-${role.id}`}
                      checked={allowedRoles.includes(role.id)}
                      onCheckedChange={(checked) => toggleRole(role.id, checked === true)}
                    />
                    <Label htmlFor={`edit-role-${role.id}`}>{role.label}</Label>
                  </div>
                ))}
              </div>
              <Button type="button" className="w-full" disabled={!definition || isSaving} onClick={() => void handleSave()}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar alterações
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
