import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, BarChart3, Activity } from "lucide-react";
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

const revenueData = [
  { month: "Jan", value: 4200 },
  { month: "Fev", value: 3800 },
  { month: "Mar", value: 5100 },
  { month: "Abr", value: 4600 },
  { month: "Mai", value: 6200 },
  { month: "Jun", value: 5800 },
];

const userActivityData = [
  { name: "Seg", dashboards: 45, insights: 28 },
  { name: "Ter", dashboards: 52, insights: 35 },
  { name: "Qua", dashboards: 48, insights: 31 },
  { name: "Qui", dashboards: 61, insights: 42 },
  { name: "Sex", dashboards: 55, insights: 38 },
  { name: "Sáb", dashboards: 32, insights: 18 },
  { name: "Dom", dashboards: 28, insights: 15 },
];

const categoryData = [
  { name: "Comercial", value: 35, color: "#5b5bd6" },
  { name: "Marketing", value: 25, color: "#06b6d4" },
  { name: "Financeiro", value: 20, color: "#10b981" },
  { name: "RH", value: 12, color: "#f59e0b" },
  { name: "Outros", value: 8, color: "#ef4444" },
];

export function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Usuários Ativos</p>
                <p className="text-3xl font-semibold">247</p>
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +12% vs mês anterior
                </p>
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
                <p className="text-3xl font-semibold">142</p>
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +8% vs mês anterior
                </p>
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
                <p className="text-3xl font-semibold">1,234</p>
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +23% vs mês anterior
                </p>
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
                <p className="text-3xl font-semibold">87%</p>
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +5% vs mês anterior
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="month" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e4e4e7",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#5b5bd6"
                  strokeWidth={3}
                  dot={{ fill: "#5b5bd6", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="name" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e4e4e7",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="dashboards" fill="#5b5bd6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="insights" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Dashboards por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
                  <p className="font-medium">Tempo médio de sessão</p>
                  <p className="text-sm text-muted-foreground">
                    Por usuário ativo
                  </p>
                </div>
                <p className="text-2xl font-semibold">24 min</p>
              </div>
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <p className="font-medium">Dashboards mais visualizados</p>
                  <p className="text-sm text-muted-foreground">
                    Média diária
                  </p>
                </div>
                <p className="text-2xl font-semibold">8.5</p>
              </div>
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <p className="font-medium">Insights gerados por dia</p>
                  <p className="text-sm text-muted-foreground">
                    Via assistente IA
                  </p>
                </div>
                <p className="text-2xl font-semibold">45</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Taxa de satisfação</p>
                  <p className="text-sm text-muted-foreground">
                    Baseado em feedback
                  </p>
                </div>
                <p className="text-2xl font-semibold text-green-600">94%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
