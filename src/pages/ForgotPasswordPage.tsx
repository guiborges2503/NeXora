import { type FormEvent, useState } from "react";
import { Link } from "react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import logoImg from "@/img/logo.png";
import logotipoImg from "@/img/logotipo.png";
import { API_BASE_URL } from "@/config/api";

type ApiJson = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage("Informe seu e-mail para recuperar a senha.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMessage("Informe um e-mail válido.");
      return;
    }

    if (!isHttpsOrLocalApi(API_BASE_URL)) {
      setErrorMessage("Por segurança, em produção a API deve usar HTTPS.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth_forgot_password.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        referrerPolicy: "no-referrer",
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const result = (await response.json()) as ApiJson;

      if (!response.ok || !result.success) {
        if (result.errors) {
          const first = Object.values(result.errors)[0];
          setErrorMessage(first ?? result.message ?? "Não foi possível enviar o e-mail.");
        } else {
          setErrorMessage(result.message ?? "Não foi possível enviar o e-mail.");
        }
        return;
      }

      setSuccessMessage(
        result.message ??
          "Se o e-mail existir em nossa base, você receberá instruções para redefinir a senha."
      );
      setEmail("");
    } catch {
      setErrorMessage("Não foi possível conectar ao servidor.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="nx-auth-shell min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="nx-auth-panel w-full max-w-md space-y-8">
          <div className="w-full flex justify-center">
            <img src={logoImg} alt="NeXora" className="w-80 max-w-full object-contain" />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">Recuperar senha</h2>
              <p className="text-muted-foreground">
                Informe seu e-mail para receber as instruções de redefinição.
              </p>
            </div>

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

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
              {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

              <Button className="w-full" size="lg" type="submit" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar instruções"}
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

      <div className="hidden lg:flex flex-1 items-center justify-center p-8">
        <div className="max-w-lg space-y-6 text-center">
          <div className="flex items-center justify-center mx-auto">
            <img src={logotipoImg} alt="NeXora" className="w-80 max-w-full object-contain" />
          </div>
          <h3 className="text-3xl font-semibold">Acesso seguro e rápido</h3>
          <p className="text-lg text-muted-foreground">
            A recuperação de senha foi projetada para manter sua conta protegida.
          </p>
        </div>
      </div>
    </div>
  );
}
