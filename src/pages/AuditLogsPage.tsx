import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
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
import { Search, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { apiGet } from "@/config/api";

type AuditLogItem = {
  id: number;
  user: string;
  action: string;
  details: string;
  ip: string;
  timestamp: string;
  type: string;
  created_at?: string;
};

type AuditLogsResponse = {
  items: AuditLogItem[];
  stats: {
    total: number;
    today: number;
    week: number;
    month: number;
  };
};

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState<AuditLogsResponse["stats"]>({
    total: 0,
    today: 0,
    week: 0,
    month: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let mounted = true;

    async function loadLogs() {
      try {
        const data = await apiGet<AuditLogsResponse>("/audit_logs.php");
        if (mounted) {
          setLogs(data.items);
          setStats(data.stats);
          setCurrentPage(1);
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Não foi possível carregar os logs."
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadLogs();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredLogs = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    const now = new Date();

    const minDate = (() => {
      if (periodFilter === "today") {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        return d;
      }
      if (periodFilter === "7d") {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        return d;
      }
      if (periodFilter === "30d") {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        return d;
      }
      return null;
    })();

    return logs.filter((log) => {
      const matchesType = typeFilter === "all" || log.type === typeFilter;
      const matchesUser = userFilter === "all" || log.user === userFilter;
      const matchesSearch =
        searchValue === "" ||
        log.user.toLowerCase().includes(searchValue) ||
        log.action.toLowerCase().includes(searchValue) ||
        log.details.toLowerCase().includes(searchValue);

      let matchesPeriod = true;
      if (minDate) {
        const createdAt = log.created_at ? new Date(log.created_at.replace(" ", "T")) : null;
        matchesPeriod = createdAt ? createdAt >= minDate : true;
      }

      return matchesType && matchesUser && matchesSearch && matchesPeriod;
    });
  }, [logs, search, typeFilter, userFilter, periodFilter]);

  const uniqueUsers = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.user))).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getActionColor = (type: string) => {
    switch (type) {
      case "create":
        return "bg-green-100 text-green-700";
      case "update":
        return "bg-blue-100 text-blue-700";
      case "delete":
        return "bg-red-100 text-red-700";
      case "read":
        return "bg-gray-100 text-gray-700";
      case "login":
        return "bg-cyan-100 text-cyan-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      create: "Criação",
      update: "Atualização",
      delete: "Exclusão",
      read: "Leitura",
      login: "Login",
    };
    return labels[type] ?? type;
  };

  function exportCsv() {
    const headers = ["id", "usuario", "acao", "detalhes", "ip", "data_hora"];
    const rows = filteredLogs.map((log) => [
      String(log.id),
      log.user,
      log.action,
      log.details,
      log.ip,
      log.timestamp,
    ]);

    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <Button size="lg" variant="outline" onClick={exportCsv}>
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
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-48 bg-background border-border">
              <SelectValue placeholder="Tipo de ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="create">{getActionLabel("create")}</SelectItem>
              <SelectItem value="update">{getActionLabel("update")}</SelectItem>
              <SelectItem value="delete">{getActionLabel("delete")}</SelectItem>
              <SelectItem value="read">{getActionLabel("read")}</SelectItem>
              <SelectItem value="login">{getActionLabel("login")}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={userFilter}
            onValueChange={(value) => {
              setUserFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-48 bg-background border-border">
              <SelectValue placeholder="Usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os usuários</SelectItem>
              {uniqueUsers.map((user) => (
                <SelectItem key={user} value={user}>
                  {user}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={periodFilter}
            onValueChange={(value) => {
              setPeriodFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-48 bg-background border-border">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total de Eventos</p>
            <p className="text-3xl font-semibold">{stats.total}</p>
          </div>
        </Card>
        <Card className="p-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Hoje</p>
            <p className="text-3xl font-semibold">{stats.today}</p>
          </div>
        </Card>
        <Card className="p-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Esta Semana</p>
            <p className="text-3xl font-semibold">{stats.week}</p>
          </div>
        </Card>
        <Card className="p-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Este Mês</p>
            <p className="text-3xl font-semibold">{stats.month}</p>
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Carregando logs...
                </TableCell>
              </TableRow>
            ) : null}

            {!isLoading && errorMessage ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-destructive">
                  {errorMessage}
                </TableCell>
              </TableRow>
            ) : null}

            {!isLoading && !errorMessage && filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum log encontrado.
                </TableCell>
              </TableRow>
            ) : null}

            {paginatedLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">{log.user}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getActionColor(log.type)}>
                    {getActionLabel(log.type)}
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
          Mostrando {paginatedLogs.length} de {filteredLogs.length} registros filtrados (total:{" "}
          {stats.total})
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled>
            {currentPage}/{totalPages}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
