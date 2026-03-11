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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreVertical, Mail, Shield } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const users = [
  {
    id: 1,
    name: "João Silva",
    email: "joao.silva@empresa.com",
    role: "Admin",
    status: "active",
    initials: "JS",
  },
  {
    id: 2,
    name: "Maria Santos",
    email: "maria.santos@empresa.com",
    role: "Gestor",
    status: "active",
    initials: "MS",
  },
  {
    id: 3,
    name: "Pedro Oliveira",
    email: "pedro.oliveira@empresa.com",
    role: "Colaborador",
    status: "active",
    initials: "PO",
  },
  {
    id: 4,
    name: "Ana Costa",
    email: "ana.costa@empresa.com",
    role: "Colaborador",
    status: "inactive",
    initials: "AC",
  },
];

export function UsersManagementPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie os usuários e permissões da plataforma
          </p>
        </div>
        <Button size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuários..."
            className="pl-10 bg-card border-border"
          />
        </div>
        <Select>
          <SelectTrigger className="w-48 bg-card border-border">
            <SelectValue placeholder="Todos os perfis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os perfis</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Gestor</SelectItem>
            <SelectItem value="user">Colaborador</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-48 bg-card border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span>{user.role}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.status === "active" ? "default" : "secondary"}
                    className={
                      user.status === "active"
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : ""
                    }
                  >
                    {user.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Alterar permissões</DropdownMenuItem>
                      <DropdownMenuItem>Enviar convite</DropdownMenuItem>
                      <DropdownMenuItem
                        className={
                          user.status === "active" ? "text-orange-600" : "text-green-600"
                        }
                      >
                        {user.status === "active" ? "Desativar" : "Ativar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
