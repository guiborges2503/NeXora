import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, TrendingUp, Users, DollarSign, Package, Star, Sparkles } from "lucide-react";
import { DashboardListCard } from "@/components/dashboards/DashboardListCard";
import { apiDelete, apiGet, apiPost } from "@/config/api";
import { fetchAiReports, type AiReportListItem } from "@/config/aiReportsApi";
import { getCurrentUserId, listFavoriteDashboardIds } from "@/config/favorites";
import { getStoredUser } from "@/config/currentUser";

type DashboardItem = {
  id: number;
  name: string;
  description: string;
  category: "commercial" | "marketing" | "finance" | "hr" | "operations" | "other";
  embed_url?: string;
  allowed_roles?: string[];
  is_public?: number;
  owner_id?: number;
  updated_at: string;
  views_count: number;
  report_type?: "powerbi" | "ai_report";
  chart_type?: string;
};

export function HomePage() {
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState<DashboardItem[]>([]);
  const [favoriteDashboardIds, setFavoriteDashboardIds] = useState<number[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadDashboards() {
    setErrorMessage("");
    try {
      const [dashboardData, aiReportData] = await Promise.all([
        apiGet<Omit<DashboardItem, "report_type">[]>("/dashboards.php"),
        fetchAiReports().catch(() => [] as AiReportListItem[]),
      ]);

      const powerBiItems: DashboardItem[] = dashboardData.map((item) => ({
        ...item,
        id: Number(item.id),
        report_type: "powerbi",
      }));

      const aiItems: DashboardItem[] = aiReportData.map((item) => ({
        id: Number(item.id),
        name: item.name,
        description: item.description,
        category: item.category as DashboardItem["category"],
        owner_id: item.owner_id,
        is_public: item.is_public,
        updated_at: item.updated_at,
        views_count: item.views_count,
        report_type: "ai_report",
        chart_type: item.chart_type,
      }));

      setDashboards([...powerBiItems, ...aiItems]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível carregar dashboards."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboards();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function loadFavorites() {
      const userId = getCurrentUserId();
      if (!userId) {
        setFavoriteDashboardIds([]);
        return;
      }

      try {
        const favorites = await listFavoriteDashboardIds(userId);
        setFavoriteDashboardIds(favorites);
      } catch {
        setFavoriteDashboardIds([]);
      }
    }

    void loadFavorites();
  }, []);

  const filteredDashboards = useMemo(() => {
    const favoritesSet = new Set(favoriteDashboardIds);
    const searchValue = search.trim().toLowerCase();
    const items = dashboards.filter((dashboard) => {
      const matchesCategory =
        categoryFilter === "all" || dashboard.category === categoryFilter;
      const matchesSearch =
        searchValue === "" ||
        dashboard.name.toLowerCase().includes(searchValue) ||
        dashboard.description.toLowerCase().includes(searchValue);
      const matchesFavorites = !showFavoritesOnly || favoritesSet.has(dashboard.id);
      return matchesCategory && matchesSearch && matchesFavorites;
    });

    const sorted = [...items];

    if (sortBy === "views") {
      sorted.sort((a, b) => b.views_count - a.views_count);
    } else if (sortBy === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }

    sorted.sort((a, b) => Number(favoritesSet.has(b.id)) - Number(favoritesSet.has(a.id)));

    return sorted;
  }, [dashboards, search, categoryFilter, sortBy, favoriteDashboardIds, showFavoritesOnly]);

  function getCategoryLabel(category: DashboardItem["category"]): string {
    const labels: Record<DashboardItem["category"], string> = {
      commercial: "Comercial",
      marketing: "Marketing",
      finance: "Financeiro",
      hr: "RH",
      operations: "Operações",
      other: "Outro",
    };
    return labels[category];
  }

  function getDashboardIcon(category: DashboardItem["category"]) {
    const mapping = {
      commercial: DollarSign,
      marketing: TrendingUp,
      finance: DollarSign,
      hr: Users,
      operations: Package,
      other: TrendingUp,
    } as const;
    return mapping[category];
  }

  function getDashboardColor(category: DashboardItem["category"]) {
    const mapping = {
      commercial: "text-emerald-600 dark:text-emerald-400",
      marketing: "text-sky-600 dark:text-sky-400",
      finance: "text-teal-600 dark:text-teal-400",
      hr: "text-violet-600 dark:text-violet-400",
      operations: "text-orange-600 dark:text-orange-400",
      other: "text-slate-600 dark:text-slate-400",
    } as const;
    return mapping[category];
  }

  function getCategoryPreviewGradient(category: DashboardItem["category"]) {
    const mapping = {
      commercial: "from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30",
      marketing: "from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/30",
      finance: "from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/30",
      hr: "from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/30",
      operations: "from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30",
      other: "from-slate-50 to-slate-100 dark:from-slate-900/60 dark:to-slate-950/40",
    } as const;
    return mapping[category];
  }

  function formatRelativeDate(value: string): string {
    const date = new Date(value.replace(" ", "T"));
    const diffHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return "Agora mesmo";
    if (diffHours < 24) return `Há ${diffHours}h`;
    const days = Math.floor(diffHours / 24);
    return `Há ${days}d`;
  }

  function buildPreviewEmbedUrl(rawUrl?: string): string {
    if (!rawUrl) return "";
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
        url.searchParams.set("pageView", "fitToWidth");
      }
      return url.toString();
    } catch {
      return rawUrl;
    }
  }

  async function handleDeleteDashboard(id: number, reportType: DashboardItem["report_type"]) {
    const confirmed = window.confirm("Deseja excluir este item?");
    if (!confirmed) return;

    try {
      if (reportType === "ai_report") {
        await apiDelete<{ message?: string }>(`/ai_reports.php?id=${id}`);
      } else {
        await apiDelete<{ message?: string }>(`/dashboards.php?id=${id}`);
      }
      setSuccessMessage(
        reportType === "ai_report" ? "Relatório excluído com sucesso." : "Dashboard excluído com sucesso."
      );
      await loadDashboards();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível excluir o item.");
    }
  }

  function handleShareDashboard(id: number, reportType: DashboardItem["report_type"]) {
    const path = reportType === "ai_report" ? `/reports/${id}` : `/dashboards/${id}`;
    const url = `${window.location.origin}${path}`;
    void navigator.clipboard.writeText(url).then(
      () => setSuccessMessage("Link copiado para a área de transferência."),
      () => setErrorMessage("Não foi possível copiar o link automaticamente.")
    );
  }

  function handleEditDashboard(id: number, reportType: DashboardItem["report_type"], ownerId?: number) {
    if (reportType === "ai_report") {
      const currentUserId = getCurrentUserId();
      const currentRole = getStoredUser()?.role ?? "viewer";
      const canEdit = ownerId === currentUserId || currentRole === "admin";
      navigate(canEdit ? `/reports/${id}/edit` : `/reports/${id}`);
      return;
    }
    navigate(`/dashboards/create?id=${id}`);
  }

  function canEditAiReport(ownerId?: number): boolean {
    const currentUserId = getCurrentUserId();
    const currentRole = getStoredUser()?.role ?? "viewer";
    return ownerId === currentUserId || currentRole === "admin";
  }

  async function handleDuplicateDashboard(id: number) {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const source = await apiGet<DashboardItem & { allowed_roles: string[] }>(
        `/dashboards.php?id=${id}`
      );

      const duplicated = await apiPost<
        DashboardItem,
        {
          name: string;
          description: string;
          embed_url: string;
          category: string;
          is_public: boolean;
          allowed_roles: string[];
          owner_id: number;
        }
      >("/dashboards.php", {
        name: `${source.name} (Cópia)`,
        description: source.description ?? "",
        embed_url: source.embed_url ?? "https://example.com",
        category: source.category,
        is_public: Boolean(source.is_public),
        allowed_roles: source.allowed_roles ?? ["admin", "manager", "viewer"],
        owner_id: Number(source.owner_id ?? 0),
      });

      setSuccessMessage("Dashboard duplicado com sucesso.");
      await loadDashboards();
      navigate(`/dashboards/${duplicated.id}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível duplicar o dashboard."
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={showFavoritesOnly ? "default" : "outline"}
            size="lg"
            onClick={() => setShowFavoritesOnly((current) => !current)}
          >
            <Star className={`w-4 h-4 mr-2 ${showFavoritesOnly ? "fill-current" : ""}`} />
            Favoritos
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/reports/create">
              <Sparkles className="w-4 h-4 mr-2" />
              Relatório IA
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link to="/dashboards/create">
              <Plus className="w-4 h-4 mr-2" />
              Novo Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar dashboards..."
                className="pl-10 bg-background border-border"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48 bg-background border-border">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="commercial">Comercial</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="finance">Financeiro</SelectItem>
                <SelectItem value="hr">RH</SelectItem>
                <SelectItem value="operations">Operações</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 bg-background border-border">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="views">Mais visualizados</SelectItem>
                <SelectItem value="name">Nome A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Grid */}
      {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? <p className="text-muted-foreground">Carregando dashboards...</p> : null}
        {!isLoading && errorMessage ? <p className="text-destructive">{errorMessage}</p> : null}
        {!isLoading && !errorMessage && filteredDashboards.length === 0 ? (
          <p className="text-muted-foreground">
            {showFavoritesOnly
              ? "Nenhum dashboard favoritado encontrado."
              : "Nenhum dashboard encontrado."}
          </p>
        ) : null}

        {filteredDashboards.map((dashboard) => {
          const Icon = getDashboardIcon(dashboard.category);
          const iconColor = getDashboardColor(dashboard.category);
          const previewGradient = getCategoryPreviewGradient(dashboard.category);
          const isAiReport = dashboard.report_type === "ai_report";
          const previewUrl = isAiReport ? "" : buildPreviewEmbedUrl(dashboard.embed_url);
          const isPowerBiPreview = Boolean(!isAiReport && dashboard.embed_url?.includes("powerbi.com"));
          const isFavorite = favoriteDashboardIds.includes(dashboard.id);
          const viewPath = isAiReport ? `/reports/${dashboard.id}` : `/dashboards/${dashboard.id}`;

          return (
            <DashboardListCard
              key={`${dashboard.report_type ?? "powerbi"}-${dashboard.id}`}
              dashboard={dashboard}
              categoryLabel={getCategoryLabel(dashboard.category)}
              categoryIcon={Icon}
              categoryIconColor={iconColor}
              categoryPreviewGradient={previewGradient}
              previewUrl={previewUrl}
              isPowerBiPreview={isPowerBiPreview}
              isFavorite={isFavorite}
              viewPath={viewPath}
              canEditAiReport={canEditAiReport(dashboard.owner_id)}
              relativeDate={formatRelativeDate(dashboard.updated_at)}
              onEdit={() => handleEditDashboard(dashboard.id, dashboard.report_type, dashboard.owner_id)}
              onShare={() => handleShareDashboard(dashboard.id, dashboard.report_type)}
              onDuplicate={!isAiReport ? () => void handleDuplicateDashboard(dashboard.id) : undefined}
              onDelete={() => void handleDeleteDashboard(dashboard.id, dashboard.report_type)}
            />
          );
        })}
      </div>
    </div>
  );
}
