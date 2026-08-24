import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Cable,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  Plus,
  Save,
  Server,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getStoredUser, refreshSessionUser } from "@/config/currentUser";
import {
  createCompanyDataSource,
  deleteCompanyDataSource,
  fetchCompanyDataSources,
  setDefaultCompanyDataSource,
  testCompanyDataSource,
  updateCompanyDataSource,
  type CompanyDataSource,
  type CompanyDataSourcePayload,
  type DataSourceApiAuth,
  type DataSourceConnectionType,
  type DataSourceDbDriver,
} from "@/config/companyDataSourcesApi";
import { cn } from "@/components/ui/utils";

type FormState = {
  name: string;
  connection_type: DataSourceConnectionType;
  is_active: boolean;
  is_default: boolean;
  db_driver: DataSourceDbDriver;
  db_host: string;
  db_port: string;
  db_name: string;
  db_user: string;
  db_password: string;
  db_ssl: boolean;
  api_base_url: string;
  api_auth_type: DataSourceApiAuth;
  api_token: string;
  api_key_header: string;
  api_username: string;
  api_password: string;
  api_test_path: string;
};

const DEFAULT_PORTS: Record<DataSourceDbDriver, string> = {
  mysql: "3306",
  pgsql: "5432",
  sqlsrv: "1433",
};

const emptyForm = (): FormState => ({
  name: "",
  connection_type: "database",
  is_active: true,
  is_default: false,
  db_driver: "mysql",
  db_host: "",
  db_port: DEFAULT_PORTS.mysql,
  db_name: "",
  db_user: "",
  db_password: "",
  db_ssl: false,
  api_base_url: "",
  api_auth_type: "bearer",
  api_token: "",
  api_key_header: "X-API-Key",
  api_username: "",
  api_password: "",
  api_test_path: "/health",
});

function formFromSource(source: CompanyDataSource): FormState {
  return {
    name: source.name,
    connection_type: source.connection_type,
    is_active: source.is_active,
    is_default: source.is_default,
    db_driver: source.db_driver,
    db_host: source.db_host,
    db_port: source.db_port || DEFAULT_PORTS[source.db_driver],
    db_name: source.db_name,
    db_user: source.db_user,
    db_password: "",
    db_ssl: source.db_ssl,
    api_base_url: source.api_base_url,
    api_auth_type: source.api_auth_type,
    api_token: "",
    api_key_header: source.api_key_header || "X-API-Key",
    api_username: source.api_username,
    api_password: "",
    api_test_path: source.api_test_path || "/health",
  };
}

function driverLabel(driver: DataSourceDbDriver): string {
  if (driver === "pgsql") return "PostgreSQL";
  if (driver === "sqlsrv") return "SQL Server";
  return "MySQL";
}

function authLabel(auth: DataSourceApiAuth): string {
  if (auth === "api_key") return "Chave de API";
  if (auth === "basic") return "Usuário e senha";
  if (auth === "none") return "Sem autenticação";
  return "Bearer token";
}

function formatDateTime(value: string | null): string {
  if (!value) return "Nunca testada";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CompanyDataSourcesPage() {
  const [canEdit, setCanEdit] = useState(() => getStoredUser()?.role === "admin");
  const [items, setItems] = useState<CompanyDataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ variant: "ok" | "error"; message: string } | null>(
    null
  );
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [showDbPassword, setShowDbPassword] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [hasStoredDbPassword, setHasStoredDbPassword] = useState(false);
  const [hasStoredApiToken, setHasStoredApiToken] = useState(false);
  const [hasStoredApiPassword, setHasStoredApiPassword] = useState(false);

  const defaultSource = useMemo(() => items.find((item) => item.is_default) ?? null, [items]);
  const editingSource = useMemo(
    () => items.find((item) => item.id === editingId) ?? null,
    [items, editingId]
  );

  async function loadSources() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchCompanyDataSources();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Não foi possível carregar as conexões.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSources();
  }, []);

  useEffect(() => {
    let active = true;
    void refreshSessionUser().then((user) => {
      if (!active) return;
      setCanEdit(user?.role === "admin");
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading || !canEdit || items.length > 0 || formOpen) return;
    openCreate("database");
  }, [loading, canEdit, items.length, formOpen]);

  function openCreate(type: DataSourceConnectionType) {
    setEditingId(null);
    setForm({ ...emptyForm(), connection_type: type, is_default: items.length === 0 });
    setHasStoredDbPassword(false);
    setHasStoredApiToken(false);
    setHasStoredApiPassword(false);
    setShowDbPassword(false);
    setShowApiSecret(false);
    setTestResult(null);
    setErrorMessage(null);
    setFormOpen(true);
  }

  function openEdit(source: CompanyDataSource) {
    setEditingId(source.id);
    setForm(formFromSource(source));
    setHasStoredDbPassword(source.has_db_password);
    setHasStoredApiToken(source.has_api_token);
    setHasStoredApiPassword(source.has_api_password);
    setShowDbPassword(false);
    setShowApiSecret(false);
    setTestResult(null);
    setErrorMessage(null);
    setFormOpen(true);
  }

  function patchForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      if (key === "db_driver") {
        const nextDriver = value as DataSourceDbDriver;
        const prevIsDefaultPort = Object.values(DEFAULT_PORTS).includes(prev.db_port);
        return {
          ...prev,
          db_driver: nextDriver,
          db_port: prevIsDefaultPort ? DEFAULT_PORTS[nextDriver] : prev.db_port,
        };
      }
      return { ...prev, [key]: value };
    });
  }

  function buildPayload(): CompanyDataSourcePayload {
    return {
      name: form.name.trim(),
      connection_type: form.connection_type,
      is_active: form.is_active,
      is_default: form.is_default,
      db_driver: form.db_driver,
      db_host: form.db_host.trim(),
      db_port: form.db_port.trim(),
      db_name: form.db_name.trim(),
      db_user: form.db_user.trim(),
      db_password: form.db_password,
      keep_db_password: editingId !== null && hasStoredDbPassword && form.db_password === "",
      db_ssl: form.db_ssl,
      api_base_url: form.api_base_url.trim(),
      api_auth_type: form.api_auth_type,
      api_token: form.api_token,
      keep_api_token: editingId !== null && hasStoredApiToken && form.api_token === "",
      api_key_header: form.api_key_header.trim() || "X-API-Key",
      api_username: form.api_username.trim(),
      api_password: form.api_password,
      keep_api_password: editingId !== null && hasStoredApiPassword && form.api_password === "",
      api_test_path: form.api_test_path.trim(),
    };
  }

  async function handleSave() {
    if (!canEdit) {
      setErrorMessage("Apenas administradores podem alterar as conexões.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setTestResult(null);
    try {
      const payload = buildPayload();
      if (editingId) {
        await updateCompanyDataSource(editingId, payload);
      } else {
        await createCompanyDataSource(payload);
      }
      setFormOpen(false);
      setEditingId(null);
      await loadSources();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Falha ao salvar a conexão.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    setErrorMessage(null);
    try {
      const payload = buildPayload();
      const result = await testCompanyDataSource({
        ...payload,
        ...(editingId ? { id: editingId } : {}),
      });
      setTestResult({
        variant: "ok",
        message: result.message || "Conexão OK.",
      });
      if (editingId) {
        await loadSources();
      }
    } catch (e) {
      setTestResult({
        variant: "error",
        message: e instanceof Error ? e.message : "Falha ao testar a conexão.",
      });
    } finally {
      setTesting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId || !canEdit) return;
    setSaving(true);
    setErrorMessage(null);
    try {
      await deleteCompanyDataSource(deleteId);
      if (editingId === deleteId) {
        setFormOpen(false);
        setEditingId(null);
      }
      setDeleteId(null);
      await loadSources();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Falha ao remover a conexão.");
      setDeleteId(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(id: number) {
    if (!canEdit) return;
    setErrorMessage(null);
    try {
      await setDefaultCompanyDataSource(id);
      await loadSources();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Falha ao definir a fonte padrão.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Conexão de dados da empresa
          </CardTitle>
          <CardDescription>
            Configure o banco de dados ou a API da sua operação. Relatórios, dashboards e o
            assistente passam a ler os dados da empresa contratante, não só o banco interno do
            NeXora.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <UserRound className="h-4 w-4 text-primary" />
              Banco com usuário
            </div>
            <p className="text-sm text-muted-foreground">
              Host, porta, nome do banco, usuário e senha. Ideal para MySQL, PostgreSQL ou SQL
              Server do ERP/CRM.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Globe className="h-4 w-4 text-primary" />
              Integração por API
            </div>
            <p className="text-sm text-muted-foreground">
              URL da API, token, chave ou usuário/senha. Use quando o sistema de origem já expõe
              um endpoint REST.
            </p>
          </div>
        </CardContent>
      </Card>

      {defaultSource ? (
        <Alert className="border-emerald-500/40 bg-emerald-500/5 [&>svg]:text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Fonte padrão</AlertTitle>
          <AlertDescription>
            {defaultSource.name} •{" "}
            {defaultSource.connection_type === "database"
              ? `${driverLabel(defaultSource.db_driver)} em ${defaultSource.db_host}`
              : defaultSource.api_base_url}{" "}
            • último teste: {formatDateTime(defaultSource.last_tested_at)}
            {defaultSource.last_test_ok === true
              ? " (sucesso)"
              : defaultSource.last_test_ok === false
                ? " (falhou)"
                : ""}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nenhuma fonte padrão</AlertTitle>
          <AlertDescription>
            Cadastre o banco ou a API da sua empresa para o NeXora consultar os seus dados.
          </AlertDescription>
        </Alert>
      )}

      {!canEdit ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Somente leitura</AlertTitle>
          <AlertDescription>
            Apenas administradores podem criar ou alterar conexões. Você pode visualizar as fontes
            já cadastradas.
          </AlertDescription>
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle>Fontes cadastradas</CardTitle>
              <CardDescription>Uma delas pode ser marcada como padrão.</CardDescription>
            </div>
            {canEdit ? (
              <Button type="button" size="sm" onClick={() => openCreate("database")}>
                <Plus className="mr-1 h-4 w-4" />
                Nova
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando conexões...
              </div>
            ) : null}

            {!loading && items.length === 0 ? (
              <div className="space-y-3 rounded-xl border border-dashed border-border p-6 text-center">
                <Server className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Ainda não há conexão. Escolha como os dados da sua empresa vão entrar no NeXora.
                </p>
                {canEdit ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button type="button" variant="outline" onClick={() => openCreate("database")}>
                      <Database className="mr-2 h-4 w-4" />
                      Conectar banco
                    </Button>
                    <Button type="button" variant="outline" onClick={() => openCreate("api")}>
                      <Globe className="mr-2 h-4 w-4" />
                      Conectar API
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {items.map((item) => {
              const isSelected = editingId === item.id && formOpen;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openEdit(item)}
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-accent/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{item.name}</p>
                        {item.is_default ? (
                          <Badge>Padrão</Badge>
                        ) : null}
                        {!item.is_active ? (
                          <Badge variant="outline">Inativa</Badge>
                        ) : null}
                        {item.last_test_ok === true ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                          >
                            Teste OK
                          </Badge>
                        ) : null}
                        {item.last_test_ok === false ? (
                          <Badge variant="destructive">Teste falhou</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {item.connection_type === "database"
                          ? `${driverLabel(item.db_driver)} • ${item.db_user}@${item.db_host}:${item.db_port}/${item.db_name}`
                          : `${authLabel(item.api_auth_type)} • ${item.api_base_url}`}
                      </p>
                    </div>
                    {item.connection_type === "database" ? (
                      <Database className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {formOpen ? (
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "Editar conexão" : "Nova conexão"}</CardTitle>
              <CardDescription>
                Escolha entre usuário/senha do banco ou autenticação via API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="source-name">Nome da conexão</Label>
                <Input
                  id="source-name"
                  placeholder="Ex.: ERP produção, API de vendas"
                  value={form.name}
                  onChange={(e) => patchForm("name", e.target.value)}
                  disabled={!canEdit || saving}
                  className="bg-input-background border-border"
                />
              </div>

              <Tabs
                value={form.connection_type}
                onValueChange={(value) =>
                  patchForm("connection_type", value as DataSourceConnectionType)
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="database" disabled={!canEdit}>
                    <Database className="mr-2 h-4 w-4" />
                    Banco de dados
                  </TabsTrigger>
                  <TabsTrigger value="api" disabled={!canEdit}>
                    <Globe className="mr-2 h-4 w-4" />
                    API
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="database" className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tipo de banco</Label>
                      <Select
                        value={form.db_driver}
                        onValueChange={(value) => patchForm("db_driver", value as DataSourceDbDriver)}
                        disabled={!canEdit || saving}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mysql">MySQL / MariaDB</SelectItem>
                          <SelectItem value="pgsql">PostgreSQL</SelectItem>
                          <SelectItem value="sqlsrv">SQL Server</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="db-port">Porta</Label>
                      <Input
                        id="db-port"
                        value={form.db_port}
                        onChange={(e) => patchForm("db_port", e.target.value)}
                        disabled={!canEdit || saving}
                        className="bg-input-background border-border"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="db-host">Host</Label>
                      <Input
                        id="db-host"
                        placeholder="ex.: db.empresa.com.br"
                        value={form.db_host}
                        onChange={(e) => patchForm("db_host", e.target.value)}
                        disabled={!canEdit || saving}
                        className="bg-input-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="db-name">Nome do banco</Label>
                      <Input
                        id="db-name"
                        placeholder="ex.: erp_producao"
                        value={form.db_name}
                        onChange={(e) => patchForm("db_name", e.target.value)}
                        disabled={!canEdit || saving}
                        className="bg-input-background border-border"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="db-user">Usuário</Label>
                      <Input
                        id="db-user"
                        autoComplete="off"
                        value={form.db_user}
                        onChange={(e) => patchForm("db_user", e.target.value)}
                        disabled={!canEdit || saving}
                        className="bg-input-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="db-password">Senha</Label>
                      <div className="flex gap-2">
                        <Input
                          id="db-password"
                          type={showDbPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder={
                            hasStoredDbPassword ? "•••••••• (mantida se vazio)" : "Senha do banco"
                          }
                          value={form.db_password}
                          onChange={(e) => patchForm("db_password", e.target.value)}
                          disabled={!canEdit || saving}
                          className="bg-input-background border-border"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowDbPassword((v) => !v)}
                          aria-label={showDbPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                          {showDbPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <div>
                      <Label htmlFor="db-ssl">Conexão SSL</Label>
                      <p className="text-xs text-muted-foreground">
                        Ative se o banco exigir criptografia no tráfego.
                      </p>
                    </div>
                    <Switch
                      id="db-ssl"
                      checked={form.db_ssl}
                      onCheckedChange={(checked) => patchForm("db_ssl", checked)}
                      disabled={!canEdit || saving}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="api" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-url">URL base</Label>
                    <Input
                      id="api-url"
                      placeholder="https://api.empresa.com.br"
                      value={form.api_base_url}
                      onChange={(e) => patchForm("api_base_url", e.target.value)}
                      disabled={!canEdit || saving}
                      className="bg-input-background border-border font-mono text-sm"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Autenticação</Label>
                      <Select
                        value={form.api_auth_type}
                        onValueChange={(value) =>
                          patchForm("api_auth_type", value as DataSourceApiAuth)
                        }
                        disabled={!canEdit || saving}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bearer">Bearer token</SelectItem>
                          <SelectItem value="api_key">Chave de API</SelectItem>
                          <SelectItem value="basic">Usuário e senha</SelectItem>
                          <SelectItem value="none">Sem autenticação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="api-test-path">Caminho de teste</Label>
                      <Input
                        id="api-test-path"
                        placeholder="/health"
                        value={form.api_test_path}
                        onChange={(e) => patchForm("api_test_path", e.target.value)}
                        disabled={!canEdit || saving}
                        className="bg-input-background border-border font-mono text-sm"
                      />
                    </div>
                  </div>

                  {form.api_auth_type === "api_key" ? (
                    <div className="space-y-2">
                      <Label htmlFor="api-key-header">Header da chave</Label>
                      <Input
                        id="api-key-header"
                        placeholder="X-API-Key"
                        value={form.api_key_header}
                        onChange={(e) => patchForm("api_key_header", e.target.value)}
                        disabled={!canEdit || saving}
                        className="bg-input-background border-border font-mono text-sm"
                      />
                    </div>
                  ) : null}

                  {form.api_auth_type === "bearer" || form.api_auth_type === "api_key" ? (
                    <div className="space-y-2">
                      <Label htmlFor="api-token">
                        {form.api_auth_type === "api_key" ? "Chave da API" : "Token"}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="api-token"
                          type={showApiSecret ? "text" : "password"}
                          autoComplete="off"
                          placeholder={
                            hasStoredApiToken ? "•••••••• (mantido se vazio)" : "Cole o token ou a chave"
                          }
                          value={form.api_token}
                          onChange={(e) => patchForm("api_token", e.target.value)}
                          disabled={!canEdit || saving}
                          className="bg-input-background border-border font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowApiSecret((v) => !v)}
                          aria-label={showApiSecret ? "Ocultar segredo" : "Mostrar segredo"}
                        >
                          {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {form.api_auth_type === "basic" ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="api-user">Usuário</Label>
                        <Input
                          id="api-user"
                          autoComplete="off"
                          value={form.api_username}
                          onChange={(e) => patchForm("api_username", e.target.value)}
                          disabled={!canEdit || saving}
                          className="bg-input-background border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="api-password">Senha</Label>
                        <div className="flex gap-2">
                          <Input
                            id="api-password"
                            type={showApiSecret ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder={
                              hasStoredApiPassword ? "•••••••• (mantida se vazio)" : "Senha da API"
                            }
                            value={form.api_password}
                            onChange={(e) => patchForm("api_password", e.target.value)}
                            disabled={!canEdit || saving}
                            className="bg-input-background border-border"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setShowApiSecret((v) => !v)}
                            aria-label={showApiSecret ? "Ocultar senha" : "Mostrar senha"}
                          >
                            {showApiSecret ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </TabsContent>
              </Tabs>

              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="source-active">Conexão ativa</Label>
                    <p className="text-xs text-muted-foreground">Desative para pausar o uso.</p>
                  </div>
                  <Switch
                    id="source-active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => patchForm("is_active", checked)}
                    disabled={!canEdit || saving}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="source-default">Usar como padrão</Label>
                    <p className="text-xs text-muted-foreground">
                      Fonte principal para relatórios e dashboards.
                    </p>
                  </div>
                  <Switch
                    id="source-default"
                    checked={form.is_default}
                    onCheckedChange={(checked) => patchForm("is_default", checked)}
                    disabled={!canEdit || saving}
                  />
                </div>
              </div>

              {testResult ? (
                <Alert
                  variant={testResult.variant === "error" ? "destructive" : "default"}
                  className={
                    testResult.variant === "ok"
                      ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-950 dark:text-emerald-100 [&>svg]:text-emerald-600"
                      : undefined
                  }
                >
                  {testResult.variant === "ok" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>{testResult.variant === "ok" ? "Sucesso" : "Falha no teste"}</AlertTitle>
                  <AlertDescription>{testResult.message}</AlertDescription>
                </Alert>
              ) : null}

              {editingSource?.last_test_message ? (
                <p className="text-xs text-muted-foreground">
                  Último teste em {formatDateTime(editingSource.last_tested_at)}:{" "}
                  {editingSource.last_test_message}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" onClick={() => void handleSave()} disabled={!canEdit || saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleTest()}
                  disabled={testing || saving}
                >
                  {testing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Cable className="mr-2 h-4 w-4" />
                  )}
                  Testar conexão
                </Button>
                {editingId && canEdit ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleSetDefault(editingId)}
                      disabled={saving || editingSource?.is_default}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Tornar padrão
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDeleteId(editingId)}
                      disabled={saving}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </Button>
                  </>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setFormOpen(false);
                    setEditingId(null);
                    setTestResult(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="hidden lg:flex">
            <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
              <KeyRound className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Selecione uma fonte à esquerda ou crie uma nova conexão com usuário do banco ou API.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta conexão?</AlertDialogTitle>
            <AlertDialogDescription>
              As credenciais serão removidas. Relatórios que dependerem desta fonte deixam de usá-la
              até outra ser configurada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
