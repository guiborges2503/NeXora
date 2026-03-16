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
import { AlertTriangle, TrendingDown, Users, Package, CheckCircle2, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet } from "@/config/api";
import { isPwaMode } from "@/config/pwa";
import { cn } from "@/components/ui/utils";

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

export function AlertsPage() {
  const pwaMode = isPwaMode();
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

  useEffect(() => {
    let mounted = true;

    async function loadAlerts() {
      try {
        const data = await apiGet<AlertsResponse>("/alerts.php");
        if (mounted) {
          setAlerts(data.items);
          setStats(data.stats);
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Não foi possível carregar alertas."
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadAlerts();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredAlerts = useMemo(() => {
    if (severityFilter === "all") {
      return alerts;
    }
    return alerts.filter((alert) => alert.severity === severityFilter);
  }, [alerts, severityFilter]);

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

  return (
    <div className={cn("space-y-6", pwaMode && "space-y-4")}>
      {/* Header */}
      <div className={cn("flex items-center justify-end", pwaMode && "justify-stretch")}>
        <Button size={pwaMode ? "default" : "lg"} variant="outline" className={cn(pwaMode && "w-full")}>
          <AlertTriangle className="w-4 h-4 mr-2" />
          Configurar Alertas
        </Button>
      </div>

      {/* Stats */}
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

      {/* Filters */}
      <div className={cn("flex gap-4", pwaMode && "flex-col gap-2")}>
        <Select>
          <SelectTrigger className={cn("w-48 bg-card border-border", pwaMode && "w-full")}>
            <SelectValue placeholder="Todas categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            <SelectItem value="sales">Vendas</SelectItem>
            <SelectItem value="customers">Clientes</SelectItem>
            <SelectItem value="stock">Estoque</SelectItem>
            <SelectItem value="finance">Financeiro</SelectItem>
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

      {/* Alerts Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className={cn(pwaMode && "w-full justify-start overflow-x-auto")}>
          <TabsTrigger value="active">Ativos</TabsTrigger>
          <TabsTrigger value="resolved">Resolvidos</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {filteredAlerts
            .filter((alert) => alert.status === "active")
            .map((alert) => {
              const Icon = getAlertIcon(alert.severity);
              return (
                <Card key={alert.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div
                      className={cn(
                        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
                        pwaMode && "flex-col items-stretch",
                      )}
                    >
                      <div className={cn("flex gap-4 min-w-0", pwaMode && "gap-3")}>
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getSeverityColor(
                            alert.severity
                          )}`}
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
                              className={getSeverityColor(alert.severity)}
                            >
                              {getSeverityLabel(alert.severity)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{alert.description}</p>
                          <div className={cn("flex items-center gap-4 text-sm", pwaMode && "flex-wrap gap-2")}>
                            <Badge variant="secondary">{alert.category}</Badge>
                            <span className="text-muted-foreground">{alert.timestamp}</span>
                          </div>
                        </div>
                      </div>
                      <div className={cn("flex w-full gap-2 sm:w-auto sm:justify-end", pwaMode && "w-full")}>
                        <Button variant="outline" size="sm" className={cn(pwaMode && "flex-1")}>
                          Ver Detalhes
                        </Button>
                        <Button size="sm" className={cn(pwaMode && "flex-1")}>
                          Resolver
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4 mt-6">
          {filteredAlerts
            .filter((alert) => alert.status === "resolved")
            .map((alert) => {
              const Icon = getAlertIcon(alert.severity);
              return (
                <Card key={alert.id} className="opacity-60">
                  <CardHeader>
                    <div
                      className={cn(
                        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
                        pwaMode && "flex-col items-stretch",
                      )}
                    >
                      <div className={cn("flex gap-4 min-w-0", pwaMode && "gap-3")}>
                        <div className="w-12 h-12 bg-green-100 text-green-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className={cn("space-y-2 min-w-0", pwaMode && "w-full")}>
                          <div className={cn("flex items-center gap-2", pwaMode && "flex-wrap")}>
                            <h3 className={cn("font-semibold text-lg", pwaMode && "text-base leading-tight")}>
                              {alert.title}
                            </h3>
                            <Badge variant="outline" className="bg-green-100 text-green-700">
                              Resolvido
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{alert.description}</p>
                          <div className={cn("flex items-center gap-4 text-sm", pwaMode && "flex-wrap gap-2")}>
                            <Badge variant="secondary">{alert.category}</Badge>
                            <span className="text-muted-foreground">{alert.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-6">
          {isLoading ? (
            <Card>
              <CardHeader>
                <p className="text-muted-foreground">Carregando alertas...</p>
              </CardHeader>
            </Card>
          ) : null}

          {!isLoading && errorMessage ? (
            <Card>
              <CardHeader>
                <p className="text-destructive">{errorMessage}</p>
              </CardHeader>
            </Card>
          ) : null}

          {!isLoading && !errorMessage && filteredAlerts.length === 0 ? (
            <Card>
              <CardHeader>
                <p className="text-muted-foreground">Nenhum alerta encontrado.</p>
              </CardHeader>
            </Card>
          ) : null}

          {filteredAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.severity);
            return (
              <Card
                key={alert.id}
                className={`hover:shadow-md transition-shadow ${
                  alert.status === "resolved" ? "opacity-60" : ""
                }`}
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
                          alert.status === "resolved"
                            ? "bg-green-100 text-green-700"
                            : getSeverityColor(alert.severity)
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
                            className={
                              alert.status === "resolved"
                                ? "bg-green-100 text-green-700"
                                : getSeverityColor(alert.severity)
                            }
                          >
                            {alert.status === "resolved"
                              ? "Resolvido"
                              : getSeverityLabel(alert.severity)}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{alert.description}</p>
                        <div className={cn("flex items-center gap-4 text-sm", pwaMode && "flex-wrap gap-2")}>
                          <Badge variant="secondary">{alert.category}</Badge>
                          <span className="text-muted-foreground">{alert.timestamp}</span>
                        </div>
                      </div>
                    </div>
                    {alert.status === "active" && (
                      <div className={cn("flex w-full gap-2 sm:w-auto sm:justify-end", pwaMode && "w-full")}>
                        <Button variant="outline" size="sm" className={cn(pwaMode && "flex-1")}>
                          Ver Detalhes
                        </Button>
                        <Button size="sm" className={cn(pwaMode && "flex-1")}>
                          Resolver
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
