import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Pencil, Share2, Sparkles, Trash2 } from "lucide-react";
import { AiReportDashboard } from "@/components/reports/AiReportDashboard";
import {
  deleteAiReport,
  fetchAiReport,
  incrementAiReportView,
  updateAiReportSharing,
  type AiReportDashboardData,
  type AiReportDefinition,
} from "@/config/aiReportsApi";
import { getCurrentUserId } from "@/config/favorites";
import { getStoredUser } from "@/config/currentUser";

export function ViewAiReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportId = Number(id ?? 0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [businessRules, setBusinessRules] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerId, setOwnerId] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [dashboard, setDashboard] = useState<AiReportDashboardData | null>(null);
  const [reportDefinition, setReportDefinition] = useState<AiReportDefinition | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [allowedRoles, setAllowedRoles] = useState<string[]>([]);
  const [isSavingShare, setIsSavingShare] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentUserId = getCurrentUserId();
  const currentRole = getStoredUser()?.role ?? "viewer";
  const canManage = currentUserId === ownerId || currentRole === "admin";

  useEffect(() => {
    if (!reportId) {
      setErrorMessage("Relatório inválido.");
      setIsLoading(false);
      return;
    }

    let mounted = true;

    async function loadReport() {
      try {
        const data = await fetchAiReport(reportId);
        if (!mounted) return;

        const report = data.report;
        setTitle(report.title);
        setDescription(report.description);
        setBusinessRules(data.definition?.business_rules ?? report.prompt_summary ?? "");
        setOwnerName(report.owner_name);
        setOwnerId(report.owner_id);
        setViewsCount(report.views_count);
        setIsPublic(Boolean(report.is_public));
        setAllowedRoles(report.allowed_roles ?? []);
        setDashboard(data.dashboard);
        setReportDefinition(data.definition ?? null);

        await incrementAiReportView(reportId);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar o relatório.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadReport();
    return () => {
      mounted = false;
    };
  }, [reportId]);

  function toggleRole(roleId: string, checked: boolean) {
    setAllowedRoles((prev) => {
      if (checked) return Array.from(new Set([...prev, roleId]));
      return prev.filter((role) => role !== roleId);
    });
  }

  async function handleSaveSharing() {
    setIsSavingShare(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await updateAiReportSharing(reportId, { is_public: isPublic, allowed_roles: allowedRoles });
      setSuccessMessage("Compartilhamento atualizado.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível atualizar o compartilhamento.");
    } finally {
      setIsSavingShare(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Deseja excluir este relatório?")) return;
    setIsDeleting(true);
    try {
      await deleteAiReport(reportId);
      navigate("/dashboards");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível excluir o relatório.");
      setIsDeleting(false);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/reports/${reportId}`);
      setSuccessMessage("Link copiado para a área de transferência.");
    } catch {
      setErrorMessage("Não foi possível copiar o link.");
    }
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando painel...</p>;
  }

  if (errorMessage && !dashboard) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{errorMessage}</p>
        <Button asChild variant="outline">
          <Link to="/dashboards">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button asChild variant="outline">
          <Link to="/dashboards">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {canManage ? (
            <Button asChild variant="default">
              <Link to={`/reports/${reportId}/edit`}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar painel
              </Link>
            </Button>
          ) : null}
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="w-3 h-3" />
            Painel IA
          </Badge>
          <Badge variant="outline">{viewsCount} views</Badge>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">Criado por {ownerName}</p>

      {dashboard ? (
        <AiReportDashboard
          title={title}
          description={description}
          businessRules={businessRules}
          dashboard={dashboard}
          insights={reportDefinition?.insights}
          recommendations={reportDefinition?.recommendations}
          filters={reportDefinition?.filters}
          theme={reportDefinition?.theme}
        />
      ) : null}

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Compartilhamento</CardTitle>
            <CardDescription>Controle quem pode ver este painel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="share-public"
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(checked === true)}
              />
              <Label htmlFor="share-public">Público para todos os usuários autenticados</Label>
            </div>

            <div className="space-y-2">
              {[
                { id: "admin", label: "Administradores" },
                { id: "manager", label: "Gestores" },
                { id: "viewer", label: "Colaboradores" },
              ].map((role) => (
                <div key={role.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`share-${role.id}`}
                    checked={allowedRoles.includes(role.id)}
                    onCheckedChange={(checked) => toggleRole(role.id, checked === true)}
                  />
                  <Label htmlFor={`share-${role.id}`}>{role.label}</Label>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => void handleCopyLink()}>
                <Share2 className="w-4 h-4 mr-2" />
                Copiar link
              </Button>
              <Button type="button" disabled={isSavingShare} onClick={() => void handleSaveSharing()}>
                {isSavingShare ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar compartilhamento
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting}
                onClick={() => void handleDelete()}
              >
                {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Excluir
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {errorMessage ? <p className="text-destructive text-sm">{errorMessage}</p> : null}
      {successMessage ? <p className="text-emerald-600 text-sm">{successMessage}</p> : null}
    </div>
  );
}
