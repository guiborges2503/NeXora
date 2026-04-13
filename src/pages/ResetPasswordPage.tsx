import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import logoImg from "@/img/logo.png";
import logotipoImg from "@/img/logotipo.png";
import { API_BASE_URL } from "@/config/api";

type ApiJson = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const raw = (searchParams.get("token") ?? "").trim().toLowerCase();
    setToken(raw);
    if (raw && !/^[a-f0-9]{64}$/.test(raw)) {
      setErrorMessage("Link de recuperação inválido. Solicite um novo e-mail.");
    }
  }, [searchParams]);

  function isHttpsOrLocalApi(baseUrl: string): boolean {
    try {
      const parsedUrl = new URL(baseUrl);
      const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname);
      return parsedUrl.protocol === "https:" || isLocalHost;
    } catch {
      return true;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!/^[a-f0-9]{64}$/.test(token)) {
      setErrorMessage("Link de recuperação inválido. Solicite um novo e-mail.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("A nova senha deve ter ao menos 6 caracteres.");
      return;
    }

    if (password !== confirm) {
      setErrorMessage("A confirmação da senha não confere.");
      return;
    }

    if (!isHttpsOrLocalApi(API_BASE_URL)) {
      setErrorMessage("Por segurança, em produção a API deve usar HTTPS.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth_reset_password.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        referrerPolicy: "no-referrer",
        body: JSON.stringify({ token, password }),
      });

      const result = (await response.json()) as ApiJson;
      if (!response.ok || !result.success) {
        setErrorMessage(result.message ?? "Não foi possível redefinir a senha.");
        return;
      }

      setSuccessMessage(result.message ?? "Senha alterada. Redirecionando para o login…");
      setPassword("");
      setConfirm("");
      setTimeout(() => navigate("/auth/login"), 2000);
    } catch {
      setErrorMessage("Não foi possível conectar ao servidor.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="w-full flex justify-center">
            <img src={logoImg} alt="NeXora" className="w-80 max-w-full object-contain" />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">Nova senha</h2>
              <p className="text-muted-foreground">
                Defina uma nova senha para a sua conta.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="bg-input-background border-border pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <Input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="bg-input-background border-border"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
              {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

              <Button className="w-full" size="lg" type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </form>

            <div className="text-center text-sm">
              <Link to="/auth/login" className="text-primary hover:underline font-medium">
                Voltar para o login
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-background items-center justify-center p-8">
        <div className="max-w-lg space-y-6 text-center">
          <div className="flex items-center justify-center mx-auto">
            <img src={logotipoImg} alt="NeXora" className="w-80 max-w-full object-contain" />
          </div>
          <h3 className="text-3xl font-semibold">Segurança em primeiro lugar</h3>
          <p className="text-lg text-muted-foreground">
            Use uma senha forte e exclusiva para esta conta.
          </p>
        </div>
      </div>
    </div>
  );
}
