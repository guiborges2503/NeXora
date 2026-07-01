import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { API_BASE_URL } from "@/config/api";
import {
  clearSavedLogin,
  getSavedLogin,
  setAuthToken,
  setSavedLogin,
} from "@/config/auth";

const LOGIN_BG_URL = `${import.meta.env.BASE_URL}login.png`;

type LoginApiResponse = {
  success: boolean;
  message?: string;
  data?: {
    id: number;
    name: string;
    email: string;
    status: string;
    role?: "admin" | "manager" | "viewer";
    authenticated: boolean;
    token?: string;
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const savedLogin = getSavedLogin();
  const [email, setEmail] = useState(savedLogin?.email ?? "");
  const [password, setPassword] = useState(savedLogin?.password ?? "");
  const [rememberLogin, setRememberLogin] = useState(savedLogin !== null);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function isHttpsOrLocalApi(baseUrl: string): boolean {
    try {
      const parsedUrl = baseUrl.startsWith("/")
        ? new URL(baseUrl, window.location.origin)
        : new URL(baseUrl);
      const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname);
      return parsedUrl.protocol === "https:" || isLocalHost;
    } catch {
      return true;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setErrorMessage("Informe e-mail e senha para continuar.");
      return;
    }

    if (!isHttpsOrLocalApi(API_BASE_URL)) {
      setErrorMessage("Por segurança, o login em produção exige API com HTTPS.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth_login.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        referrerPolicy: "no-referrer",
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        if (response.status === 404) {
          setErrorMessage(
            "API não encontrada (404). Confirme que a pasta api/ está publicada no servidor."
          );
        } else {
          setErrorMessage(
            `Servidor retornou resposta inválida (HTTP ${response.status}). Verifique a pasta api/ e o arquivo api/.env.`
          );
        }
        return;
      }

      const result = (await response.json()) as LoginApiResponse;

      if (!response.ok || !result.success || !result.data?.authenticated || !result.data.token) {
        setErrorMessage(result.message ?? "Credenciais inválidas.");
        return;
      }

      setAuthToken(result.data.token);
      const { token: _token, ...userWithoutToken } = result.data;
      localStorage.setItem("nexora_user", JSON.stringify(userWithoutToken));

      if (rememberLogin) {
        setSavedLogin({ email: normalizedEmail, password });
      } else {
        clearSavedLogin();
      }

      if (!rememberLogin) {
        setPassword("");
      }

      navigate("/dashboards");
    } catch (_error) {
      setErrorMessage("Não foi possível conectar ao servidor de autenticação.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat p-8"
      style={{ backgroundImage: `url(${LOGIN_BG_URL})` }}
    >
      <div className="relative w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-white drop-shadow-sm">
            Bem-vindo de volta
          </h2>
          <p className="text-balance text-white/80 drop-shadow-sm">
            Entre com suas credenciais para acessar sua conta
          </p>
        </div>

        {/* Painel claro só no bloco de credenciais */}
        <div className="rounded-2xl border border-border/60 bg-background/95 p-6 shadow-2xl backdrop-blur-md">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="bg-input-background border-border"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="bg-input-background border-border pr-10"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
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

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember-login"
                checked={rememberLogin}
                onCheckedChange={(checked) => {
                  const shouldRemember = checked === true;
                  setRememberLogin(shouldRemember);
                  if (!shouldRemember) {
                    clearSavedLogin();
                  }
                }}
              />
              <Label htmlFor="remember-login" className="cursor-pointer text-sm font-normal">
                Salvar login
              </Label>
            </div>

            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : null}

            <Button className="w-full" size="lg" type="submit" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>

        <div className="space-y-3 text-center text-sm text-white/85 drop-shadow-sm">
          <div>
            <span>Não tem uma conta? </span>
            <Link
              to="/auth/register"
              className="font-medium text-sky-300 underline-offset-4 hover:text-sky-200 hover:underline"
            >
              Criar conta
            </Link>
          </div>
          <Link
            to="/sobre"
            className="block text-xs text-white/65 underline-offset-4 transition-colors hover:text-white/90 hover:underline"
          >
            O que é o NeXora?
          </Link>
        </div>
      </div>
    </div>
  );
}
