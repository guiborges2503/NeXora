import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { LayoutDashboard } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { apiGet, apiPost, apiPut } from "@/config/api";

type DashboardResponse = {
  id: number;
  name: string;
  description: string;
  category: string;
  embed_url: string;
  allowed_roles: string[];
  is_public?: number;
};

export function CreateDashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dashboardId = Number(searchParams.get("id") ?? 0);
  const isEditMode = dashboardId > 0;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [category, setCategory] = useState("commercial");
  const [isPublic, setIsPublic] = useState(false);
  const [allowedRoles, setAllowedRoles] = useState<string[]>(["admin", "manager", "viewer"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const permissions = [
    { id: "admin", label: "Administradores" },
    { id: "manager", label: "Gestores" },
    { id: "viewer", label: "Colaboradores" },
  ];

  function toggleRole(roleId: string, checked: boolean) {
    setAllowedRoles((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, roleId]));
      }
      return prev.filter((role) => role !== roleId);
    });
  }

  useEffect(() => {
    let mounted = true;

    async function loadDashboardForEdit() {
      if (!isEditMode) return;

      setIsLoadingExisting(true);
      setErrorMessage("");
      try {
        const data = await apiGet<DashboardResponse>(`/dashboards.php?id=${dashboardId}`);
        if (!mounted) return;

        setName(data.name ?? "");
        setDescription(data.description ?? "");
        setEmbedUrl(data.embed_url ?? "");
        setCategory((data.category as typeof category) ?? "commercial");
        setIsPublic(Boolean(data.is_public));
        setAllowedRoles(
          Array.isArray(data.allowed_roles) && data.allowed_roles.length > 0
            ? data.allowed_roles
            : ["admin", "manager", "viewer"]
        );
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Não foi possível carregar dashboard."
          );
        }
      } finally {
        if (mounted) {
          setIsLoadingExisting(false);
        }
      }
    }

    void loadDashboardForEdit();
    return () => {
      mounted = false;
    };
  }, [dashboardId, isEditMode]);

  async function handleSaveDashboard() {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      let ownerId = 0;
      try {
        const rawUser = localStorage.getItem("nexora_user");
        if (rawUser) {
          const parsed = JSON.parse(rawUser) as { id?: number };
          ownerId = Number(parsed.id ?? 0);
        }
      } catch {
        ownerId = 0;
      }

      const payload = {
        name,
        description,
        embed_url: embedUrl,
        category,
        is_public: isPublic,
        allowed_roles: allowedRoles,
        owner_id: ownerId,
      };

      const saved = isEditMode
        ? await apiPut<
            DashboardResponse,
            {
              name: string;
              description: string;
              embed_url: string;
              category: string;
              is_public: boolean;
              allowed_roles: string[];
              owner_id: number;
            }
          >(`/dashboards.php?id=${dashboardId}`, payload)
        : await apiPost<
        DashboardResponse,
        {
          name: string;
          description: string;
          embed_url: string;
          category: string;
          is_public: boolean;
          allowed_roles: string[];
          owner_id: number;
        }
      >("/dashboards.php", payload);

      navigate(`/dashboards/${saved.id}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : `Não foi possível ${isEditMode ? "atualizar" : "criar"} o dashboard.`
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5" />
            Informações do Dashboard
          </CardTitle>
          <CardDescription>
            Defina os dados e configurações do painel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingExisting ? (
            <p className="text-sm text-muted-foreground">Carregando dados do dashboard...</p>
          ) : null}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dashboard-name">Nome do Dashboard</Label>
              <Input
                id="dashboard-name"
                placeholder="Ex: Relatório de Vendas Q1"
                className="bg-input-background border-border"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descreva o propósito deste dashboard..."
                className="bg-input-background border-border resize-none"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL do BI</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://app.powerbi.com/..."
                className="bg-input-background border-border"
                value={embedUrl}
                onChange={(event) => setEmbedUrl(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Cole o link de embed do seu dashboard (Power BI, Tableau, Looker, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commercial">Comercial</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="finance">Financeiro</SelectItem>
                  <SelectItem value="hr">Recursos Humanos</SelectItem>
                  <SelectItem value="operations">Operações</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Permissões de Acesso</Label>
              <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission.id}
                      checked={allowedRoles.includes(permission.id)}
                      onCheckedChange={(checked) => toggleRole(permission.id, checked === true)}
                    />
                    <label
                      htmlFor={permission.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {permission.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="dashboard-public"
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(checked === true)}
              />
              <label htmlFor="dashboard-public" className="text-sm cursor-pointer">
                Tornar dashboard público para todos os usuários
              </label>
            </div>
          </div>

          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

          <div className="flex gap-3 pt-4">
            <Button
              className="flex-1"
              size="lg"
              onClick={handleSaveDashboard}
              disabled={isSubmitting || isLoadingExisting}
            >
              {isSubmitting
                ? isEditMode
                  ? "Salvando..."
                  : "Criando..."
                : isEditMode
                  ? "Salvar alterações"
                  : "Criar Dashboard"}
            </Button>
            <Button asChild variant="outline" className="flex-1" size="lg">
              <Link to="/dashboards">Cancelar</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
