import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";

const logs = [
  {
    id: 1,
    user: "João Silva",
    action: "Criou dashboard",
    details: "Dashboard 'Vendas Q1 2026'",
    ip: "192.168.1.100",
    timestamp: "03/03/2026 14:32",
    type: "create",
  },
  {
    id: 2,
    user: "Maria Santos",
    action: "Editou usuário",
    details: "Alterou permissões de 'Pedro Oliveira'",
    ip: "192.168.1.105",
    timestamp: "03/03/2026 13:15",
    type: "update",
  },
  {
    id: 3,
    user: "Pedro Oliveira",
    action: "Visualizou dashboard",
    details: "Dashboard 'Marketing Digital'",
    ip: "192.168.1.108",
    timestamp: "03/03/2026 12:45",
    type: "view",
  },
  {
    id: 4,
    user: "Ana Costa",
    action: "Gerou insight com IA",
    details: "Assistente IA - Análise de vendas",
    ip: "192.168.1.112",
    timestamp: "03/03/2026 11:20",
    type: "ai",
  },
  {
    id: 5,
    user: "João Silva",
    action: "Excluiu dashboard",
    details: "Dashboard 'Relatório Antigo'",
    ip: "192.168.1.100",
    timestamp: "03/03/2026 10:05",
    type: "delete",
  },
  {
    id: 6,
    user: "Maria Santos",
    action: "Login realizado",
    details: "Autenticação bem-sucedida",
    ip: "192.168.1.105",
    timestamp: "03/03/2026 09:00",
    type: "auth",
  },
  {
    id: 7,
    user: "Sistema",
    action: "Alerta criado",
    details: "Alerta: Queda nas vendas online",
    ip: "Sistema",
    timestamp: "03/03/2026 08:30",
    type: "system",
  },
];

export function AuditLogsPage() {
  const getActionColor = (type: string) => {
    switch (type) {
      case "create":
        return "bg-green-100 text-green-700";
      case "update":
        return "bg-blue-100 text-blue-700";
      case "delete":
        return "bg-red-100 text-red-700";
      case "view":
        return "bg-gray-100 text-gray-700";
      case "ai":
        return "bg-purple-100 text-purple-700";
      case "auth":
        return "bg-cyan-100 text-cyan-700";
      case "system":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Logs de Auditoria</h1>
          <p className="text-muted-foreground">
            Acompanhe todas as atividades e ações realizadas na plataforma
          </p>
        </div>
        <Button size="lg" variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar Logs
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar logs..."
              className="pl-10 bg-background border-border"
            />
          </div>
          <Select>
            <SelectTrigger className="w-48 bg-background border-border">
              <SelectValue placeholder="Tipo de ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="create">Criação</SelectItem>
              <SelectItem value="update">Atualização</SelectItem>
              <SelectItem value="delete">Exclusão</SelectItem>
              <SelectItem value="view">Visualização</SelectItem>
              <SelectItem value="ai">IA</SelectItem>
              <SelectItem value="auth">Autenticação</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-48 bg-background border-border">
              <SelectValue placeholder="Usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os usuários</SelectItem>
              <SelectItem value="joao">João Silva</SelectItem>
              <SelectItem value="maria">Maria Santos</SelectItem>
              <SelectItem value="pedro">Pedro Oliveira</SelectItem>
              <SelectItem value="ana">Ana Costa</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Período
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total de Eventos</p>
            <p className="text-3xl font-semibold">2,847</p>
          </div>
        </Card>
        <Card className="p-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Hoje</p>
            <p className="text-3xl font-semibold">127</p>
          </div>
        </Card>
        <Card className="p-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Esta Semana</p>
            <p className="text-3xl font-semibold">834</p>
          </div>
        </Card>
        <Card className="p-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Este Mês</p>
            <p className="text-3xl font-semibold">2,847</p>
          </div>
        </Card>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Data/Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">{log.user}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getActionColor(log.type)}>
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {log.details}
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {log.ip}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {log.timestamp}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando 1-10 de 2,847 registros
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Anterior
          </Button>
          <Button variant="outline" size="sm">
            1
          </Button>
          <Button variant="outline" size="sm">
            2
          </Button>
          <Button variant="outline" size="sm">
            3
          </Button>
          <Button variant="outline" size="sm">
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
