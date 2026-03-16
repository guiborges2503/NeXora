import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, TrendingUp, Users, DollarSign, Package, MoreVertical, Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiDelete, apiGet, apiPost } from "@/config/api";
import { getCurrentUserId, listFavoriteDashboardIds } from "@/config/favorites";

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
};

export function HomePage() {
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState<DashboardItem[]>([]);
  const [favoriteDashboardIds, setFavoriteDashboardIds] = useState<number[]>([]);
  const [showAllDashboards, setShowAllDashboards] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadDashboards() {
    setErrorMessage("");
    try {
      const data = await apiGet<DashboardItem[]>("/dashboards.php");
      setDashboards(data.map((item) => ({ ...item, id: Number(item.id) })));
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
      const matchesFavorites = showAllDashboards || favoritesSet.has(dashboard.id);
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
  }, [dashboards, search, categoryFilter, sortBy, favoriteDashboardIds, showAllDashboards]);

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
      commercial: "text-green-600 bg-green-50",
      marketing: "text-blue-600 bg-blue-50",
      finance: "text-emerald-600 bg-emerald-50",
      hr: "text-purple-600 bg-purple-50",
      operations: "text-orange-600 bg-orange-50",
      other: "text-gray-600 bg-gray-50",
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

  async function handleDeleteDashboard(id: number) {
    const confirmed = window.confirm("Deseja excluir este dashboard?");
    if (!confirmed) return;

    try {
      await apiDelete<{ message?: string }>(`/dashboards.php?id=${id}`);
      setSuccessMessage("Dashboard excluído com sucesso.");
      await loadDashboards();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível excluir o dashboard."
      );
    }
  }

  async function handleShareDashboard(id: number) {
    const url = `${window.location.origin}/dashboards/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setSuccessMessage("Link do dashboard copiado para a área de transferência.");
    } catch {
      setErrorMessage("Não foi possível copiar o link automaticamente.");
    }
  }

  function handleEditDashboard(id: number) {
    navigate(`/dashboards/create?id=${id}`);
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
            variant={showAllDashboards ? "default" : "outline"}
            size="lg"
            onClick={() => setShowAllDashboards((current) => !current)}
          >
            Todos os Painéis
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
            {showAllDashboards
              ? "Nenhum dashboard encontrado."
              : "Nenhum dashboard favoritado encontrado."}
          </p>
        ) : null}

        {filteredDashboards.map((dashboard) => {
          const Icon = getDashboardIcon(dashboard.category);
          const color = getDashboardColor(dashboard.category);
          const previewUrl = buildPreviewEmbedUrl(dashboard.embed_url);
          const isPowerBiPreview = Boolean(dashboard.embed_url?.includes("powerbi.com"));
          const isFavorite = favoriteDashboardIds.includes(dashboard.id);
          return (
            <Card
              key={dashboard.id}
              className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            >
              {previewUrl ? (
                <>
                  <iframe
                    src={previewUrl}
                    title={`Prévia ${dashboard.name}`}
                    className={`absolute left-0 top-0 w-full border-0 pointer-events-none ${isPowerBiPreview ? "h-[calc(100%+96px)]" : "h-full"}`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    tabIndex={-1}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/45 to-black/75 backdrop-blur-[1px]" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
              )}

              <CardHeader className="relative z-10 pb-3 text-white">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-sm ring-1 ring-white/30 ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded border border-white/25 bg-black/35 text-white opacity-80 hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => handleEditDashboard(dashboard.id)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          void handleShareDashboard(dashboard.id);
                        }}
                      >
                        Compartilhar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          void handleDuplicateDashboard(dashboard.id);
                        }}
                      >
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => void handleDeleteDashboard(dashboard.id)}>
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 space-y-3 text-white">
                <div>
                  <h3 className="font-semibold mb-1 text-white">{dashboard.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs bg-white/20 text-white border border-white/25">
                      {getCategoryLabel(dashboard.category)}
                    </Badge>
                    {isFavorite ? (
                      <Badge variant="secondary" className="text-xs bg-amber-500/90 text-white border border-amber-300/60">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Favorito
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md bg-black/30 px-2 py-1 text-sm text-white/90">
                  <span>{formatRelativeDate(dashboard.updated_at)}</span>
                  <span>{dashboard.views_count} views</span>
                </div>
              </CardContent>
              <CardFooter className="relative z-10 pt-0">
                <Button asChild className="w-full bg-white text-slate-900 hover:bg-white/90" size="sm">
                  <Link to={`/dashboards/${dashboard.id}`}>Visualizar</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
