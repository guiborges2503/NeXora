import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  KeyRound,
  Save,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  Cable,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  clearOpenRouterSettingsRemote,
  loadOpenRouterSettingsFromServer,
  persistOpenRouterSettings,
  testOpenRouterConnection,
} from "@/config/openRouter";
import { fetchOpenRouterSettings } from "@/config/openRouterApi";
import { getStoredUser } from "@/config/currentUser";

export function OpenRouterSettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [defaultModel, setDefaultModel] = useState("openai/gpt-4o-mini");
  const [showKey, setShowKey] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [source, setSource] = useState<"database" | "env" | "none">("none");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ variant: "ok" | "error"; message: string } | null>(
    null
  );

  const canEdit = getStoredUser()?.role === "admin";

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const [settings, remote] = await Promise.all([
          loadOpenRouterSettingsFromServer(),
          fetchOpenRouterSettings().catch(() => null),
        ]);
        if (!active) return;
        setApiKey(settings.apiKey);
        setDefaultModel(settings.defaultModel);
        if (remote) {
          setSource(remote.source);
        }
      } catch (e) {
        if (!active) return;
        setErrorMessage(e instanceof Error ? e.message : "Não foi possível carregar as configurações.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    if (!canEdit) {
      setErrorMessage("Apenas administradores podem alterar esta configuração.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setTestResult(null);
    try {
      const saved = await persistOpenRouterSettings({
        apiKey: apiKey.trim(),
        defaultModel: defaultModel.trim() || "openai/gpt-4o-mini",
      });
      setApiKey(saved.apiKey);
      setDefaultModel(saved.defaultModel);
      setSource("database");
      setSavedAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Falha ao salvar configuração.");
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    if (!canEdit) {
      setErrorMessage("Apenas administradores podem alterar esta configuração.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setTestResult(null);
    try {
      await clearOpenRouterSettingsRemote();
      setApiKey("");
      setDefaultModel("openai/gpt-4o-mini");
      setSource("none");
      setSavedAt(null);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Falha ao limpar configuração.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTestResult(null);
    setTestLoading(true);
    try {
      const result = await testOpenRouterConnection(apiKey);
      if (result.ok) {
        setTestResult({
          variant: "ok",
          message:
            result.modelCount > 0
              ? `Conexão OK. A API respondeu e listou ${result.modelCount} modelos disponíveis.`
              : "Conexão OK. A chave foi aceita pela OpenRouter.",
        });
      } else {
        setTestResult({ variant: "error", message: result.message });
      }
    } finally {
      setTestLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Configuração da API OpenRouter
          </CardTitle>
          <CardDescription>
            Chave e modelo usados pelo assistente, relatórios IA e integrações. Os dados são salvos no
            banco de dados e sincronizados neste navegador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando configurações...
            </div>
          ) : null}

          {!canEdit ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Somente leitura</AlertTitle>
              <AlertDescription>
                Apenas administradores podem alterar a chave OpenRouter. Você pode visualizar e testar a
                configuração atual.
              </AlertDescription>
            </Alert>
          ) : null}

          {source === "env" ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Chave definida no servidor (.env)</AlertTitle>
              <AlertDescription>
                A chave atual vem de OPENROUTER_API_KEY no arquivo api/.env. Salve aqui para persistir no
                banco de dados.
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

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="openrouter-key">Chave da API</Label>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary inline-flex items-center gap-1 hover:underline"
              >
                Obter chave em OpenRouter
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="flex gap-2">
              <Input
                id="openrouter-key"
                type={showKey ? "text" : "password"}
                autoComplete="off"
                placeholder="sk-or-v1-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={!canEdit || loading}
                className="bg-input-background border-border font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? "Ocultar chave" : "Mostrar chave"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Endpoint usado nas requisições:{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px]">https://openrouter.ai/api/v1</code>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openrouter-model">Modelo padrão</Label>
            <Input
              id="openrouter-model"
              placeholder="openai/gpt-4o-mini"
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              disabled={!canEdit || loading}
              className="bg-input-background border-border font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Identificador do modelo no formato da OpenRouter (ex.:{" "}
              <span className="font-mono">anthropic/claude-3.5-sonnet</span>).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={handleSave} disabled={!canEdit || loading || saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testLoading || !apiKey.trim() || loading}
            >
              {testLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Cable className="w-4 h-4 mr-2" />
              )}
              Testar conexão
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={!canEdit || loading || saving}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar configuração
            </Button>
            {savedAt ? (
              <span className="text-sm text-muted-foreground">Salvo às {savedAt}</span>
            ) : null}
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
        </CardContent>
      </Card>
    </div>
  );
}
