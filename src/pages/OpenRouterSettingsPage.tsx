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
  clearOpenRouterSettings,
  getOpenRouterSettings,
  saveOpenRouterSettings,
  testOpenRouterConnection,
} from "@/config/openRouter";

export function OpenRouterSettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [defaultModel, setDefaultModel] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ variant: "ok" | "error"; message: string } | null>(
    null
  );

  useEffect(() => {
    const s = getOpenRouterSettings();
    setApiKey(s.apiKey);
    setDefaultModel(s.defaultModel);
  }, []);

  function handleSave() {
    saveOpenRouterSettings({
      apiKey: apiKey.trim(),
      defaultModel: defaultModel.trim() || "openai/gpt-4o-mini",
    });
    setSavedAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
  }

  function handleClear() {
    clearOpenRouterSettings();
    setApiKey("");
    setDefaultModel("openai/gpt-4o-mini");
    setSavedAt(null);
    setTestResult(null);
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
            Informe sua chave para usar modelos via OpenRouter no assistente e integrações. A chave fica
            armazenada apenas neste navegador (localStorage).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
              className="bg-input-background border-border font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Identificador do modelo no formato da OpenRouter (ex.:{" "}
              <span className="font-mono">anthropic/claude-3.5-sonnet</span>).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testLoading || !apiKey.trim()}
            >
              {testLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Cable className="w-4 h-4 mr-2" />
              )}
              Testar conexão
            </Button>
            <Button type="button" variant="outline" onClick={handleClear}>
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
