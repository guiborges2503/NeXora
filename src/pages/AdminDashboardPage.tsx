import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, BarChart3, Activity, Minus } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { apiGet } from "@/config/api";

type AdminAnalytics = {
  kpis: {
    users_active: number;
    users_total: number;
    users_delta: number;
    dashboards: number;
    dashboards_delta: number;
    insights: number;
    insights_delta: number;
    usage_rate: number;
  };
  monthly: Array<{ month: string; label: string; dashboards: number; insights: number }>;
  weekly: Array<{ name: string; date: string; dashboards: number; insights: number }>;
  categories: Array<{ name: string; value: number; color: string }>;
  details: {
    dashboard_views: number;
    report_views: number;
    avg_dashboard_views: number;
    favorites: number;
    reports: number;
    conversations: number;
    reports_per_day: number;
    alerts_active: number;
  };
};

function formatNumber(value: number): string {
  return value.toLocaleString("pt-BR");
}

function Delta({ value }: { value: number }) {
  if (value > 0) {
    return (
      <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
        <TrendingUp className="w-4 h-4" />
        +{value}% vs mês anterior
      </p>
    );
  }
  if (value < 0) {
    return (
      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
        <TrendingDown className="w-4 h-4" />
        {value}% vs mês anterior
      </p>
    );
  }
  return (
    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
      <Minus className="w-4 h-4" />
      Sem variação no mês
    </p>
  );
}

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const payload = await apiGet<AdminAnalytics>("/admin_analytics.php");
        if (active) setData(payload);
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : "Não foi possível carregar as métricas."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="text-muted-foreground">Carregando métricas reais da plataforma...</p>;
  }

  if (errorMessage || !data) {
    return <p className="text-destructive">{errorMessage || "Sem dados."}</p>;
  }

  const { kpis, monthly, weekly, categories, details } = data;
  const pieHasData = categories.some((item) => item.name !== "Sem dashboards");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Usuários Ativos</p>
                <p className="text-3xl font-semibold">{formatNumber(kpis.users_active)}</p>
                <p className="text-xs text-muted-foreground">de {formatNumber(kpis.users_total)} cadastros</p>
                <Delta value={kpis.users_delta} />
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Dashboards</p>
                <p className="text-3xl font-semibold">{formatNumber(kpis.dashboards)}</p>
                <Delta value={kpis.dashboards_delta} />
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Insights Gerados</p>
                <p className="text-3xl font-semibold">{formatNumber(kpis.insights)}</p>
                <p className="text-xs text-muted-foreground">Relatórios IA + conversas</p>
                <Delta value={kpis.insights_delta} />
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Taxa de Uso</p>
                <p className="text-3xl font-semibold">{kpis.usage_rate}%</p>
                <p className="text-xs text-muted-foreground">Usuários ativos / total</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Novos conteúdos por mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" stroke="currentColor" className="text-muted-foreground" />
                <YAxis allowDecimals={false} stroke="currentColor" className="text-muted-foreground" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="dashboards" name="Dashboards" stroke="#5b5bd6" strokeWidth={3} />
                <Line type="monotone" dataKey="insights" name="Insights" stroke="#06b6d4" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade dos últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground" />
                <YAxis allowDecimals={false} stroke="currentColor" className="text-muted-foreground" />
                <Tooltip />
                <Legend />
                <Bar dataKey="dashboards" name="Dashboards" fill="#5b5bd6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="insights" name="Insights" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Dashboards por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    pieHasData ? `${name} ${(percent * 100).toFixed(0)}%` : name
                  }
                  outerRadius={80}
                  dataKey="value"
                >
                  {categories.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Métricas Detalhadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <p className="font-medium">Visualizações de dashboards</p>
                  <p className="text-sm text-muted-foreground">Total acumulado</p>
                </div>
                <p className="text-2xl font-semibold">{formatNumber(details.dashboard_views)}</p>
              </div>
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <p className="font-medium">Média de visualizações</p>
                  <p className="text-sm text-muted-foreground">Por dashboard</p>
                </div>
                <p className="text-2xl font-semibold">{formatNumber(details.avg_dashboard_views)}</p>
              </div>
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <p className="font-medium">Relatórios IA</p>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(details.conversations)} conversas no assistente
                  </p>
                </div>
                <p className="text-2xl font-semibold">{formatNumber(details.reports)}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Favoritos e alertas</p>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(details.alerts_active)} alertas ativos
                  </p>
                </div>
                <p className="text-2xl font-semibold">{formatNumber(details.favorites)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
