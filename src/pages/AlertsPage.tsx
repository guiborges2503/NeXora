import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, TrendingDown, Users, Package, CheckCircle2, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const alerts = [
  {
    id: 1,
    title: "Queda acentuada nas vendas online",
    description: "Redução de 15% nas vendas online nos últimos 7 dias comparado ao período anterior",
    severity: "high",
    status: "active",
    category: "Vendas",
    timestamp: "Há 2 horas",
    icon: TrendingDown,
  },
  {
    id: 2,
    title: "Taxa de churn acima da média",
    description: "A taxa de cancelamento de clientes está 8% acima da média histórica",
    severity: "medium",
    status: "active",
    category: "Clientes",
    timestamp: "Há 5 horas",
    icon: Users,
  },
  {
    id: 3,
    title: "Estoque baixo em produtos chave",
    description: "5 produtos principais com estoque abaixo do nível crítico",
    severity: "medium",
    status: "active",
    category: "Estoque",
    timestamp: "Há 1 dia",
    icon: Package,
  },
  {
    id: 4,
    title: "Meta de vendas atingida",
    description: "A equipe de vendas atingiu 105% da meta mensal com 5 dias de antecedência",
    severity: "low",
    status: "resolved",
    category: "Vendas",
    timestamp: "Há 2 dias",
    icon: CheckCircle2,
  },
];

export function AlertsPage() {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Alertas Inteligentes</h1>
          <p className="text-muted-foreground">
            Acompanhe alertas automáticos baseados em seus dados
          </p>
        </div>
        <Button size="lg" variant="outline">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Configurar Alertas
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <p className="text-2xl font-semibold">12</p>
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
                <p className="text-2xl font-semibold text-red-600">3</p>
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
                <p className="text-2xl font-semibold text-orange-600">7</p>
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
                <p className="text-2xl font-semibold text-green-600">5</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select>
          <SelectTrigger className="w-48 bg-card border-border">
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
        <Select>
          <SelectTrigger className="w-48 bg-card border-border">
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
        <TabsList>
          <TabsTrigger value="active">Ativos</TabsTrigger>
          <TabsTrigger value="resolved">Resolvidos</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {alerts
            .filter((alert) => alert.status === "active")
            .map((alert) => {
              const Icon = alert.icon;
              return (
                <Card key={alert.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getSeverityColor(
                            alert.severity
                          )}`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{alert.title}</h3>
                            <Badge
                              variant="outline"
                              className={getSeverityColor(alert.severity)}
                            >
                              {getSeverityLabel(alert.severity)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{alert.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <Badge variant="secondary">{alert.category}</Badge>
                            <span className="text-muted-foreground">{alert.timestamp}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                        <Button size="sm">Resolver</Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4 mt-6">
          {alerts
            .filter((alert) => alert.status === "resolved")
            .map((alert) => {
              const Icon = alert.icon;
              return (
                <Card key={alert.id} className="opacity-60">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-green-100 text-green-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{alert.title}</h3>
                            <Badge variant="outline" className="bg-green-100 text-green-700">
                              Resolvido
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{alert.description}</p>
                          <div className="flex items-center gap-4 text-sm">
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
          {alerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <Card
                key={alert.id}
                className={`hover:shadow-md transition-shadow ${
                  alert.status === "resolved" ? "opacity-60" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          alert.status === "resolved"
                            ? "bg-green-100 text-green-700"
                            : getSeverityColor(alert.severity)
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{alert.title}</h3>
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
                        <div className="flex items-center gap-4 text-sm">
                          <Badge variant="secondary">{alert.category}</Badge>
                          <span className="text-muted-foreground">{alert.timestamp}</span>
                        </div>
                      </div>
                    </div>
                    {alert.status === "active" && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                        <Button size="sm">Resolver</Button>
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
