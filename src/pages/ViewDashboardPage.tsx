import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Maximize2, Bot, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ViewDashboardPage() {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-semibold">Vendas & Receita</h1>
            <Badge>Comercial</Badge>
          </div>
          <p className="text-muted-foreground">
            Última atualização: há 2 horas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg">
            <Maximize2 className="w-4 h-4 mr-2" />
            Tela Cheia
          </Button>
          <Button size="lg">
            <Bot className="w-4 h-4 mr-2" />
            Gerar Explicação com IA
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dashboard Embed */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardContent className="p-0 h-full">
              <div className="w-full h-full bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center mx-auto">
                    <svg
                      className="w-8 h-8 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-lg">Dashboard Preview</p>
                    <p className="text-sm text-muted-foreground">
                      O iframe do dashboard seria exibido aqui
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights Sidebar */}
        <div>
          <Card className="h-[600px] flex flex-col">
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
                  <Button variant="outline" className="w-full mt-4">
                    Ver Todos os Insights
                  </Button>
                </TabsContent>
                <TabsContent value="details" className="mt-4 space-y-3">
                  <CardTitle className="text-lg">Informações</CardTitle>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Categoria</p>
                      <p className="font-medium">Comercial</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Criado por</p>
                      <p className="font-medium">João Silva</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Data de criação</p>
                      <p className="font-medium">15 de Janeiro, 2026</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Total de visualizações</p>
                      <p className="font-medium">1,234</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
