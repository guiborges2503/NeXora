import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Maximize2, Bot, TrendingUp, AlertTriangle, Info, ArrowLeft, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useParams } from "react-router";
import { apiGet, apiPatch } from "@/config/api";
import {
  addDashboardFavorite,
  getCurrentUserId,
  listFavoriteDashboardIds,
  removeDashboardFavorite,
} from "@/config/favorites";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DashboardDetail = {
  id: number;
  name: string;
  description: string;
  category: "commercial" | "marketing" | "finance" | "hr" | "operations" | "other";
  embed_url: string;
  owner_name: string;
  created_at: string;
  views_count: number;
};

export function ViewDashboardPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [dashboard, setDashboard] = useState<DashboardDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      if (!id) return;
      try {
        const data = await apiGet<DashboardDetail>(`/dashboards.php?id=${id}`);
        if (mounted) {
          setDashboard({ ...data, id: Number(data.id) });
        }

        await apiPatch<DashboardDetail, { action: "increment_view" }>(
          `/dashboards.php?id=${id}`,
          { action: "increment_view" }
        );
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Não foi possível carregar o dashboard."
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;

    async function loadFavoriteState() {
      if (!id) return;

      const userId = getCurrentUserId();
      if (!userId) {
        if (mounted) setIsFavorite(false);
        return;
      }

      try {
        const favorites = await listFavoriteDashboardIds(userId);
        if (mounted) {
          setIsFavorite(favorites.includes(Number(id)));
        }
      } catch {
        if (mounted) {
          setIsFavorite(false);
        }
      }
    }

    void loadFavoriteState();

    return () => {
      mounted = false;
    };
  }, [id]);

  const insights = [
    {
      type: "positive",
      title: "Crescimento nas vendas",
      description: "Aumento de 23% em relação ao mês anterior",
      icon: TrendingUp,
      color: "text-green-600 bg-green-50",
    },
    {
      type: "warning",
      title: "Alerta de estoque",
      description: "5 produtos com baixo estoque",
      icon: AlertTriangle,
      color: "text-orange-600 bg-orange-50",
    },
    {
      type: "info",
      title: "Novo mercado",
      description: "Região Sul apresenta potencial de crescimento",
      icon: Info,
      color: "text-blue-600 bg-blue-50",
    },
  ];

  const embedUrl = useMemo(() => {
    if (!dashboard?.embed_url) return "";
    return buildEmbedUrl(dashboard.embed_url, false);
  }, [dashboard?.embed_url]);

  const fullscreenEmbedUrl = useMemo(() => {
    if (!dashboard?.embed_url) return "";
    return buildEmbedUrl(dashboard.embed_url, true);
  }, [dashboard?.embed_url]);
  const powerBiBottomCropClass = "h-[calc(100%+96px)]";

  const isPowerBiDashboard = useMemo(() => {
    if (!dashboard?.embed_url) return false;
    try {
      const url = new URL(dashboard.embed_url);
      return url.hostname.includes("powerbi.com");
    } catch {
      return false;
    }
  }, [dashboard?.embed_url]);

  function categoryLabel(category: DashboardDetail["category"]): string {
    const map: Record<DashboardDetail["category"], string> = {
      commercial: "Comercial",
      marketing: "Marketing",
      finance: "Financeiro",
      hr: "RH",
      operations: "Operações",
      other: "Outro",
    };
    return map[category];
  }

  function handleGenerateAiExplanation() {
    if (!dashboard) return;

    const summary = [
      `Dashboard: ${dashboard.name}`,
      `Categoria: ${categoryLabel(dashboard.category)}`,
      `Visualizações: ${dashboard.views_count}`,
      "",
      "Principais pontos sugeridos pela IA:",
      ...insights.map((insight) => `- ${insight.title}: ${insight.description}`),
      "",
      "Recomendação:",
      "Priorize acompanhamento diário dos indicadores críticos e configure alertas para desvios acima de 10%.",
    ].join("\n");

    setAiExplanation(summary);
    setIsAiModalOpen(true);
  }

  async function handleToggleFavorite() {
    if (!dashboard) return;
    const userId = getCurrentUserId();
    if (!userId) {
      setErrorMessage("Não foi possível identificar o usuário atual para favoritar.");
      return;
    }

    setIsFavoriteLoading(true);
    setErrorMessage("");

    try {
      if (isFavorite) {
        await removeDashboardFavorite(userId, dashboard.id);
      } else {
        await addDashboardFavorite(userId, dashboard.id);
      }
      setIsFavorite((current) => !current);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o favorito no momento."
      );
    } finally {
      setIsFavoriteLoading(false);
    }
  }

  function buildEmbedUrl(rawUrl: string, isFullscreenMode: boolean): string {
    try {
      const url = new URL(rawUrl);
      const isPowerBi = url.hostname.includes("powerbi.com");

      if (isPowerBi) {
        url.searchParams.set("navContentPaneEnabled", "false");
        url.searchParams.set("filterPaneEnabled", "false");
        url.searchParams.set("chromeless", "true");
        url.searchParams.set("disableSensitivityBanner", "true");
        url.searchParams.set("actionBarEnabled", "false");
        url.searchParams.set("statusBarEnabled", "false");
        url.searchParams.set("toolbarHidden", "true");
        if (isFullscreenMode) {
          url.searchParams.set("pageView", "fitToWidth");
        }
      }

      return url.toString();
    } catch {
      return rawUrl;
    }
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando dashboard...</p>;
  }

  if (errorMessage || !dashboard) {
    return <p className="text-destructive">{errorMessage || "Dashboard não encontrado."}</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 w-fit px-2"
            onClick={() => navigate("/dashboards")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant={isFavorite ? "default" : "outline"}
            size="lg"
            className="w-full sm:w-auto"
            onClick={handleToggleFavorite}
            disabled={isFavoriteLoading}
          >
            <Star className={`w-4 h-4 mr-2 ${isFavorite ? "fill-current" : ""}`} />
            {isFavoriteLoading
              ? "Atualizando..."
              : isFavorite
                ? "Favorito"
                : "Adicionar aos Favoritos"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => setIsFullscreenModalOpen(true)}
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            Tela Cheia
          </Button>
          <Button size="lg" className="w-full sm:w-auto" onClick={handleGenerateAiExplanation}>
            <Bot className="w-4 h-4 mr-2" />
            Gerar Explicação com IA
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dashboard Embed */}
        <div className="lg:col-span-2">
          <Card className="h-[420px] sm:h-[520px] lg:h-[600px]">
            <CardContent className="p-0 h-full">
              {embedUrl ? (
                <div className="w-full h-full rounded-lg overflow-hidden">
                  <iframe
                    src={embedUrl}
                    title={dashboard.name}
                    className={`w-full border-0 ${isPowerBiDashboard ? powerBiBottomCropClass : "h-full"}`}
                    referrerPolicy="no-referrer"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">URL do dashboard não configurada.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Insights Sidebar */}
        <div>
          <Card className="min-h-[420px] sm:min-h-[520px] lg:h-[600px] flex flex-col">
            <CardHeader className="pb-4">
              <Tabs defaultValue="insights" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="insights">Insights IA</TabsTrigger>
                  <TabsTrigger value="details">Detalhes</TabsTrigger>
                </TabsList>
                <TabsContent value="insights" className="mt-4 space-y-3">
                  <CardTitle className="text-lg">Insights Automáticos</CardTitle>
                  <div className="space-y-3">
                    {insights.map((insight, index) => {
                      const Icon = insight.icon;
                      return (
                        <div
                          key={index}
                          className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${insight.color}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium text-sm">{insight.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {insight.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => setIsInsightsModalOpen(true)}
                  >
                    Ver Todos os Insights
                  </Button>
                </TabsContent>
                <TabsContent value="details" className="mt-4 space-y-3">
                  <CardTitle className="text-lg">Informações</CardTitle>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Categoria</p>
                      <p className="font-medium">{categoryLabel(dashboard.category)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Criado por</p>
                      <p className="font-medium">{dashboard.owner_name || "Sistema"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Data de criação</p>
                      <p className="font-medium">
                        {new Date(dashboard.created_at.replace(" ", "T")).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Total de visualizações</p>
                      <p className="font-medium">{dashboard.views_count}</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </div>

      <Dialog open={isInsightsModalOpen} onOpenChange={setIsInsightsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Todos os Insights do Dashboard</DialogTitle>
            <DialogDescription>
              Resumo consolidado dos principais sinais detectados no painel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <div key={index} className="p-3 rounded-lg border bg-card">
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${insight.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{insight.title}</p>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isFullscreenModalOpen} onOpenChange={setIsFullscreenModalOpen}>
        <DialogContent className="!top-2 sm:!top-4 !left-1/2 !-translate-x-1/2 !translate-y-0 w-[calc(100vw-1rem)] h-[calc(100vh-1rem)] sm:w-[calc(100vw-2rem)] sm:h-[calc(100vh-2rem)] lg:w-[calc(100vw-6rem)] lg:h-[calc(100vh-4rem)] max-w-none sm:max-w-none rounded-xl border p-0 gap-0 overflow-hidden flex flex-col [&>button]:hidden">
          <div className="min-h-14 border-b px-3 sm:px-4 py-2 flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-sm sm:text-base">{dashboard.name}</p>
              <p className="text-xs text-muted-foreground">{categoryLabel(dashboard.category)}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsFullscreenModalOpen(false)}>
              Fechar
            </Button>
          </div>
          <div className="flex-1 min-h-0 bg-background overflow-hidden rounded-b-xl">
            {fullscreenEmbedUrl ? (
              <div className="w-full h-full overflow-hidden">
                <iframe
                  src={fullscreenEmbedUrl}
                  title={`${dashboard.name} fullscreen`}
                  className={`w-full border-0 ${isPowerBiDashboard ? powerBiBottomCropClass : "h-full"}`}
                  referrerPolicy="no-referrer"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-background">
                URL do dashboard não configurada.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Explicação Gerada com IA</DialogTitle>
            <DialogDescription>
              Sumário automático baseado no dashboard aberto.
            </DialogDescription>
          </DialogHeader>

          <pre className="text-sm whitespace-pre-wrap bg-muted/40 border rounded-md p-3">
            {aiExplanation}
          </pre>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAiModalOpen(false)}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                setIsAiModalOpen(false);
                navigate("/ai-assistant");
              }}
            >
              Abrir Assistente IA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
