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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreVertical, Mail, Shield } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/config/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UserItem = {
  id: number;
  name: string;
  email: string;
  status: "active" | "inactive";
  role: "admin" | "manager" | "viewer";
  created_at: string;
};

export function UsersManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formErrorMessage, setFormErrorMessage] = useState("");
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer" as "admin" | "manager" | "viewer",
    status: "active" as "active" | "inactive",
  });

  async function loadUsers() {
    setErrorMessage("");
    try {
      const data = await apiGet<UserItem[]>("/users.php");
      setUsers(
        data.map((user) => ({
          ...user,
          id: Number(user.id),
        }))
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível carregar os usuários."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      void loadUsers();
    }
    return () => {
      mounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredUsers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesSearch =
        searchValue === "" ||
        user.name.toLowerCase().includes(searchValue) ||
        user.email.toLowerCase().includes(searchValue);

      return matchesStatus && matchesRole && matchesSearch;
    });
  }, [users, search, statusFilter, roleFilter]);

  function getInitials(name: string): string {
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  function roleLabel(role: UserItem["role"]): string {
    if (role === "admin") return "Administrador";
    if (role === "manager") return "Gestor";
    return "Colaborador";
  }

  function resetForm() {
    setForm({
      name: "",
      email: "",
      password: "",
      role: "viewer",
      status: "active",
    });
    setEditingUserId(null);
    setFormErrorMessage("");
  }

  function startCreate() {
    resetForm();
    setSuccessMessage("");
    setErrorMessage("");
    setIsFormModalOpen(true);
  }

  function startEdit(user: UserItem) {
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status,
    });
    setEditingUserId(user.id);
    setSuccessMessage("");
    setErrorMessage("");
    setFormErrorMessage("");
    setIsFormModalOpen(true);
  }

  async function handleSaveUser() {
    setIsSubmitting(true);
    setErrorMessage("");
    setFormErrorMessage("");
    setSuccessMessage("");

    try {
      if (editingUserId === null) {
        await apiPost<UserItem, typeof form>("/users.php", form);
        setSuccessMessage("Usuário criado com sucesso.");
      } else {
        await apiPut<UserItem, typeof form>(`/users.php?id=${editingUserId}`, form);
        setSuccessMessage("Usuário atualizado com sucesso.");
      }

      resetForm();
      setIsFormModalOpen(false);
      await loadUsers();
    } catch (error) {
      setFormErrorMessage(error instanceof Error ? error.message : "Falha ao salvar usuário.");
      setForm((prev) => ({ ...prev, password: "" }));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(user: UserItem) {
    const nextStatus: UserItem["status"] = user.status === "active" ? "inactive" : "active";
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await apiPatch<UserItem, { status: UserItem["status"] }>(`/users.php?id=${user.id}`, {
        status: nextStatus,
      });
      setSuccessMessage(`Usuário ${nextStatus === "active" ? "ativado" : "desativado"} com sucesso.`);
      await loadUsers();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível alterar o status do usuário."
      );
    }
  }

  async function handleDeleteUser(user: UserItem) {
    const confirmed = window.confirm(`Deseja excluir o usuário "${user.name}"?`);
    if (!confirmed) return;

    setErrorMessage("");
    setSuccessMessage("");
    try {
      await apiDelete<{ message?: string }>(`/users.php?id=${user.id}`);
      setSuccessMessage("Usuário excluído com sucesso.");
      await loadUsers();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível excluir usuário.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <Button size="lg" onClick={startCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuários..."
            className="pl-10 bg-card border-border"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48 bg-card border-border">
            <SelectValue placeholder="Todos os perfis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os perfis</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Gestor</SelectItem>
            <SelectItem value="viewer">Colaborador</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Carregando usuários...
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

            {!isLoading && !errorMessage && filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum usuário encontrado com os filtros aplicados.
                </TableCell>
              </TableRow>
            ) : null}

            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(user.name)}
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
                    <span>{roleLabel(user.role)}</span>
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
                      <Button variant="ghost" size="sm" aria-label={`Ações de ${user.name}`}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={8}>
                      <DropdownMenuItem onSelect={() => startEdit(user)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          void handleToggleStatus(user);
                        }}
                        className={
                          user.status === "active" ? "text-orange-600" : "text-green-600"
                        }
                      >
                        {user.status === "active" ? "Desativar" : "Ativar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => {
                          void handleDeleteUser(user);
                        }}
                      >
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

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUserId === null ? "Criar novo usuário" : `Editar usuário #${editingUserId}`}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados para {editingUserId === null ? "criar" : "atualizar"} o usuário.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Nome completo"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <Input
              placeholder="E-mail"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            <Input
              placeholder={
                editingUserId === null ? "Senha (mín. 6 caracteres)" : "Nova senha (opcional)"
              }
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={form.role}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, role: value as UserItem["role"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gestor</SelectItem>
                  <SelectItem value="viewer">Colaborador</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, status: value as UserItem["status"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formErrorMessage ? <p className="text-sm text-destructive">{formErrorMessage}</p> : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsFormModalOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} disabled={isSubmitting}>
              {isSubmitting
                ? "Salvando..."
                : editingUserId === null
                  ? "Criar Usuário"
                  : "Salvar edição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
