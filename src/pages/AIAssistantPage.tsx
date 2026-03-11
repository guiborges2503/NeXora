import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const chatHistory = [
  {
    id: 1,
    type: "user",
    message: "Qual foi o desempenho de vendas no último trimestre?",
    timestamp: "10:30",
  },
  {
    id: 2,
    type: "assistant",
    message:
      "No último trimestre (Q4 2025), as vendas apresentaram um crescimento de **23% em relação ao trimestre anterior**. O faturamento total foi de **R$ 4.2 milhões**, superando a meta em 15%.",
    insights: [
      {
        type: "positive",
        text: "Região Sul liderou com crescimento de 35%",
        icon: TrendingUp,
      },
      {
        type: "warning",
        text: "Região Norte apresentou queda de 8%",
        icon: AlertCircle,
      },
    ],
    timestamp: "10:30",
  },
  {
    id: 3,
    type: "user",
    message: "Quais produtos tiveram melhor desempenho?",
    timestamp: "10:32",
  },
  {
    id: 4,
    type: "assistant",
    message:
      "Os produtos com melhor desempenho foram:\n\n1. **Produto Premium X** - R$ 1.2M (+45%)\n2. **Serviço Cloud Y** - R$ 890K (+32%)\n3. **Consultoria Z** - R$ 650K (+28%)\n\nO Produto Premium X sozinho representou 28% do faturamento total do trimestre.",
    timestamp: "10:32",
  },
];

export function AIAssistantPage() {
  const [message, setMessage] = useState("");

  const conversationStarters = [
    "Analise o desempenho de vendas do mês",
    "Quais são os principais indicadores de alerta?",
    "Compare este trimestre com o anterior",
    "Identifique oportunidades de crescimento",
  ];

  return (
    <div className="h-[calc(100vh-8rem)] space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold mb-2">Assistente IA</h1>
        <p className="text-muted-foreground">
          Faça perguntas sobre seus dados e receba insights inteligentes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-5rem)]">
        {/* Conversation History Sidebar */}
        <Card className="lg:col-span-1 overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Conversas Recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-1 px-4 pb-4">
                {[
                  "Análise de Vendas Q4",
                  "Performance de Marketing",
                  "Insights de Estoque",
                  "Análise de Churn",
                ].map((conv, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors text-sm"
                  >
                    <p className="font-medium truncate">{conv}</p>
                    <p className="text-xs text-muted-foreground">Há {index + 1} dias</p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Assistente Inteligente</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Powered by AI • Online
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      className={`flex gap-3 ${
                        chat.type === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {chat.type === "assistant" && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-primary/10">
                            <Bot className="w-4 h-4 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[80%] space-y-2 ${
                          chat.type === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            chat.type === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line">{chat.message}</p>
                        </div>
                        {chat.insights && (
                          <div className="space-y-2 w-full">
                            {chat.insights.map((insight, idx) => {
                              const Icon = insight.icon;
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 p-3 rounded-lg border bg-card"
                                >
                                  <Icon
                                    className={`w-4 h-4 ${
                                      insight.type === "positive"
                                        ? "text-green-600"
                                        : "text-orange-600"
                                    }`}
                                  />
                                  <p className="text-sm">{insight.text}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground px-1">
                          {chat.timestamp}
                        </span>
                      </div>
                      {chat.type === "user" && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Conversation Starters */}
              {chatHistory.length === 0 && (
                <div className="p-6 border-t">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">Como posso ajudar?</h3>
                    <p className="text-sm text-muted-foreground">
                      Experimente estas perguntas:
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {conversationStarters.map((starter, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto py-3 px-4 text-left justify-start"
                        onClick={() => setMessage(starter)}
                      >
                        <span className="text-sm line-clamp-2">{starter}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua pergunta..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 bg-background"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        setMessage("");
                      }
                    }}
                  />
                  <Button size="lg">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
