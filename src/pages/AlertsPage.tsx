import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  TrendingDown,
  Users,
  Package,
  CheckCircle2,
  Clock,
  Loader2,
  Save,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet, apiPatch, apiPut } from "@/config/api";
import { isPwaMode } from "@/config/pwa";
import { useIsCompactLayout } from "@/components/ui/use-mobile";
import { cn } from "@/components/ui/utils";
import { getStoredUser, refreshSessionUser } from "@/config/currentUser";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AlertItem = {
  id: number;
  title: string;
  description: string;
  severity: "high" | "medium" | "low" | "info";
  status: "active" | "resolved";
  category: string;
  timestamp: string;
};

type AlertsResponse = {
  items: AlertItem[];
  stats: {
    total: number;
    high: number;
    active: number;
    resolved: number;
  };
};

type AlertSettings = {
  notify_email: boolean;
  notify_in_app: boolean;
  sales_drop_enabled: boolean;
  sales_drop_percent: number;
  stock_low_enabled: boolean;
  stock_low_qty: number;
  inactive_customers_enabled: boolean;
  inactive_days: number;
  finance_goal_enabled: boolean;
  finance_goal_percent: number;
};

const defaultSettings: AlertSettings = {
  notify_email: true,
  notify_in_app: true,
  sales_drop_enabled: true,
  sales_drop_percent: 15,
  stock_low_enabled: true,
  stock_low_qty: 10,
  inactive_customers_enabled: true,
  inactive_days: 30,
  finance_goal_enabled: false,
  finance_goal_percent: 80,
};

export function AlertsPage() {
  const pwaMode = isPwaMode() || useIsCompactLayout();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [stats, setStats] = useState<AlertsResponse["stats"]>({
    total: 0,
    high: 0,
    active: 0,
    resolved: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [canEdit, setCanEdit] = useState(() => getStoredUser()?.role === "admin");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AlertSettings>(defaultSettings);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  async function loadAlerts() {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await apiGet<AlertsResponse>("/alerts.php");
      setAlerts(Array.isArray(data.items) ? data.items : []);
      setStats(data.stats);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar alertas.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAlerts();
    void refreshSessionUser().then((user) => setCanEdit(user?.role === "admin"));
  }, []);

  async function openSettings() {
    setSettingsOpen(true);
    setSettingsError(null);
    setSettingsSaved(false);
    setSettingsLoading(true);
    try {
      const data = await apiGet<AlertSettings>("/alerts.php?action=settings");
      setSettings({ ...defaultSettings, ...data });
    } catch (error) {
      setSettingsError(
        error instanceof Error ? error.message : "Não foi possível carregar a configuração."
      );
    } finally {
      setSettingsLoading(false);
    }
  }

  async function saveSettings() {
    if (!canEdit) {
      setSettingsError("Apenas administradores podem alterar as regras de alerta.");
      return;
    }
    setSettingsSaving(true);
    setSettingsError(null);
    setSettingsSaved(false);
    try {
      const saved = await apiPut<AlertSettings, AlertSettings>("/alerts.php", settings);
      setSettings({ ...defaultSettings, ...saved });
      setSettingsSaved(true);
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : "Falha ao salvar configuração.");
    } finally {
      setSettingsSaving(false);
    }
  }

  async function resolveAlert(id: number) {
    setResolvingId(id);
    try {
      await apiPatch<{ id: number }, Record<string, never>>(`/alerts.php?action=resolve&id=${id}`, {});
      await loadAlerts();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível resolver o alerta.");
    } finally {
      setResolvingId(null);
    }
  }

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const severityOk = severityFilter === "all" || alert.severity === severityFilter;
      const categoryOk = categoryFilter === "all" || alert.category.toLowerCase() === categoryFilter;
      return severityOk && categoryOk;
    });
  }, [alerts, severityFilter, categoryFilter]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "low":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "high":
        return "Alta";
      case "medium":
        return "Média";
      case "low":
        return "Baixa";
      default:
        return severity;
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return TrendingDown;
      case "medium":
        return Users;
      case "low":
        return CheckCircle2;
      default:
        return Package;
    }
  };

  function emptyState(message: string) {
    return (
      <Card>
        <CardHeader>
          <p className="text-muted-foreground">{message}</p>
        </CardHeader>
      </Card>
    );
  }

  function renderAlertCard(alert: AlertItem, resolvedLook: boolean) {
    const Icon = getAlertIcon(alert.severity);
    return (
      <Card
        key={alert.id}
        className={cn("hover:shadow-md transition-shadow", resolvedLook && "opacity-60")}
      >
        <CardHeader>
          <div
            className={cn(
              "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
              pwaMode && "flex-col items-stretch",
            )}
          >
            <div className={cn("flex gap-4 min-w-0", pwaMode && "gap-3")}>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  resolvedLook ? "bg-green-100 text-green-700" : getSeverityColor(alert.severity)
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className={cn("space-y-2 min-w-0", pwaMode && "w-full")}>
                <div className={cn("flex items-center gap-2", pwaMode && "flex-wrap")}>
                  <h3 className={cn("font-semibold text-lg", pwaMode && "text-base leading-tight")}>
                    {alert.title}
                  </h3>
                  <Badge
                    variant="outline"
                    className={resolvedLook ? "bg-green-100 text-green-700" : getSeverityColor(alert.severity)}
                  >
                    {resolvedLook ? "Resolvido" : getSeverityLabel(alert.severity)}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{alert.description}</p>
                <div className={cn("flex items-center gap-4 text-sm", pwaMode && "flex-wrap gap-2")}>
                  <Badge variant="secondary">{alert.category}</Badge>
                  <span className="text-muted-foreground">{alert.timestamp}</span>
                </div>
              </div>
            </div>
            {alert.status === "active" ? (
              <div className={cn("flex w-full gap-2 sm:w-auto sm:justify-end", pwaMode && "w-full")}>
                <Button
                  size="sm"
                  className={cn(pwaMode && "flex-1")}
                  disabled={resolvingId === alert.id}
                  onClick={() => void resolveAlert(alert.id)}
                >
                  {resolvingId === alert.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Resolver
                </Button>
              </div>
            ) : null}
          </div>
        </CardHeader>
      </Card>
    );
  }

  const activeAlerts = filteredAlerts.filter((alert) => alert.status === "active");
  const resolvedAlerts = filteredAlerts.filter((alert) => alert.status === "resolved");

  return (
    <div className={cn("space-y-6", pwaMode && "space-y-4")}>
      <div className={cn("flex items-center justify-end", pwaMode && "justify-stretch")}>
        <Button
          size={pwaMode ? "default" : "lg"}
          variant="outline"
          className={cn(pwaMode && "w-full")}
          onClick={() => void openSettings()}
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Configurar Alertas
        </Button>
      </div>

      <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-6", pwaMode && "grid-cols-2 gap-3")}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Alta Prioridade</p>
                <p className="text-2xl font-semibold text-red-600">{stats.high}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Ativos</p>
                <p className="text-2xl font-semibold text-orange-600">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Resolvidos</p>
                <p className="text-2xl font-semibold text-green-600">{stats.resolved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={cn("flex gap-4", pwaMode && "flex-col gap-2")}>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className={cn("w-48 bg-card border-border", pwaMode && "w-full")}>
            <SelectValue placeholder="Todas categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            <SelectItem value="geral">Geral</SelectItem>
            <SelectItem value="vendas">Vendas</SelectItem>
            <SelectItem value="clientes">Clientes</SelectItem>
            <SelectItem value="estoque">Estoque</SelectItem>
            <SelectItem value="financeiro">Financeiro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className={cn("w-48 bg-card border-border", pwaMode && "w-full")}>
            <SelectValue placeholder="Todas prioridades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas prioridades</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}

      <Tabs defaultValue="active" className="w-full">
        <TabsList className={cn(pwaMode && "w-full justify-start overflow-x-auto")}>
          <TabsTrigger value="active">Ativos</TabsTrigger>
          <TabsTrigger value="resolved">Resolvidos</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {isLoading
            ? emptyState("Carregando alertas...")
            : activeAlerts.length === 0
              ? emptyState("Nenhum alerta ativo. Use Configurar Alertas para definir as regras.")
              : activeAlerts.map((alert) => renderAlertCard(alert, false))}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4 mt-6">
          {isLoading
            ? emptyState("Carregando alertas...")
            : resolvedAlerts.length === 0
              ? emptyState("Nenhum alerta resolvido.")
              : resolvedAlerts.map((alert) => renderAlertCard(alert, true))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-6">
          {isLoading
            ? emptyState("Carregando alertas...")
            : filteredAlerts.length === 0
              ? emptyState("Nenhum alerta encontrado.")
              : filteredAlerts.map((alert) => renderAlertCard(alert, alert.status === "resolved"))}
        </TabsContent>
      </Tabs>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Configurar alertas</DialogTitle>
            <DialogDescription>
              Defina quando o NeXora deve avisar sobre vendas, estoque, clientes e metas.
            </DialogDescription>
          </DialogHeader>

          {settingsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando configuração...
            </div>
          ) : (
            <div className="space-y-5">
              {!canEdit ? (
                <p className="text-sm text-muted-foreground">
                  Somente administradores podem alterar estas regras.
                </p>
              ) : null}

              {settingsError ? <p className="text-sm text-destructive">{settingsError}</p> : null}
              {settingsSaved ? (
                <p className="text-sm text-emerald-600">Configuração salva.</p>
              ) : null}

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="notify-email">Notificar por e-mail</Label>
                    <p className="text-xs text-muted-foreground">Envia aviso quando um alerta disparar.</p>
                  </div>
                  <Switch
                    id="notify-email"
                    checked={settings.notify_email}
                    disabled={!canEdit}
                    onCheckedChange={(checked) => setSettings((s) => ({ ...s, notify_email: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="notify-app">Mostrar no painel</Label>
                    <p className="text-xs text-muted-foreground">Exibe o alerta nesta tela e no sino.</p>
                  </div>
                  <Switch
                    id="notify-app"
                    checked={settings.notify_in_app}
                    disabled={!canEdit}
                    onCheckedChange={(checked) => setSettings((s) => ({ ...s, notify_in_app: checked }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="rounded-lg border border-border p-3 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="sales-drop">Queda de vendas</Label>
                    <Switch
                      id="sales-drop"
                      checked={settings.sales_drop_enabled}
                      disabled={!canEdit}
                      onCheckedChange={(checked) =>
                        setSettings((s) => ({ ...s, sales_drop_enabled: checked }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sales-drop-pct">Disparar se cair mais de (%)</Label>
                    <Input
                      id="sales-drop-pct"
                      type="number"
                      min={1}
                      max={100}
                      disabled={!canEdit || !settings.sales_drop_enabled}
                      value={settings.sales_drop_percent}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, sales_drop_percent: Number(e.target.value) }))
                      }
                      className="bg-input-background"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-border p-3 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="stock-low">Estoque baixo</Label>
                    <Switch
                      id="stock-low"
                      checked={settings.stock_low_enabled}
                      disabled={!canEdit}
                      onCheckedChange={(checked) =>
                        setSettings((s) => ({ ...s, stock_low_enabled: checked }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock-qty">Disparar abaixo de (unidades)</Label>
                    <Input
                      id="stock-qty"
                      type="number"
                      min={0}
                      disabled={!canEdit || !settings.stock_low_enabled}
                      value={settings.stock_low_qty}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, stock_low_qty: Number(e.target.value) }))
                      }
                      className="bg-input-background"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-border p-3 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="inactive">Clientes inativos</Label>
                    <Switch
                      id="inactive"
                      checked={settings.inactive_customers_enabled}
                      disabled={!canEdit}
                      onCheckedChange={(checked) =>
                        setSettings((s) => ({ ...s, inactive_customers_enabled: checked }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inactive-days">Sem compra há (dias)</Label>
                    <Input
                      id="inactive-days"
                      type="number"
                      min={1}
                      disabled={!canEdit || !settings.inactive_customers_enabled}
                      value={settings.inactive_days}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, inactive_days: Number(e.target.value) }))
                      }
                      className="bg-input-background"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-border p-3 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="finance-goal">Atraso de meta financeira</Label>
                    <Switch
                      id="finance-goal"
                      checked={settings.finance_goal_enabled}
                      disabled={!canEdit}
                      onCheckedChange={(checked) =>
                        setSettings((s) => ({ ...s, finance_goal_enabled: checked }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="finance-pct">Alertar se a meta estiver abaixo de (%)</Label>
                    <Input
                      id="finance-pct"
                      type="number"
                      min={1}
                      max={100}
                      disabled={!canEdit || !settings.finance_goal_enabled}
                      value={settings.finance_goal_percent}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, finance_goal_percent: Number(e.target.value) }))
                      }
                      className="bg-input-background"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSettingsOpen(false)}>
              Fechar
            </Button>
            <Button type="button" onClick={() => void saveSettings()} disabled={!canEdit || settingsSaving || settingsLoading}>
              {settingsSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
