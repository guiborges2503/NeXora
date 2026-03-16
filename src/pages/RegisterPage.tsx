import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import logoImg from "@/img/logo.png";
import logotipoImg from "@/img/logotipo.png";
import { API_BASE_URL } from "@/config/api";

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage("Preencha nome, e-mail e senha.");
      return;
    }

    if (!isHttpsOrLocalApi(API_BASE_URL)) {
      setErrorMessage("Por segurança, o cadastro em produção exige API com HTTPS.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth_register.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        referrerPolicy: "no-referrer",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const payload = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !payload.success) {
        setErrorMessage(payload.message ?? "Não foi possível criar a conta.");
        return;
      }

      setSuccessMessage("Conta criada com sucesso. Faça login para continuar.");
      setPassword("");
      setTimeout(() => navigate("/auth/login"), 1000);
    } catch (_error) {
      setErrorMessage("Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
      setPassword("");
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-background items-center justify-center p-8">
        <div className="max-w-lg space-y-6 text-center">
          <div className="flex items-center justify-center mx-auto">
            <img src={logotipoImg} alt="NeXora" className="w-80 max-w-full object-contain" />
          </div>
          <h3 className="text-3xl font-semibold">
            Comece sua jornada de dados hoje
          </h3>
          <p className="text-lg text-muted-foreground">
            Junte-se a centenas de empresas que já transformaram seus dados em
            insights acionáveis.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="w-full flex justify-center lg:hidden">
            <img src={logoImg} alt="NeXora" className="w-80 max-w-full object-contain" />
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">
                Criar nova conta
              </h2>
              <p className="text-muted-foreground">
                Preencha os dados para cadastrar um novo usuário.
                <br />
                O perfil de acesso será definido pelo administrador.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="João Silva"
                  className="bg-input-background border-border"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="bg-input-background border-border"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-input-background border-border"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              {errorMessage ? (
                <p className="text-sm text-destructive">{errorMessage}</p>
              ) : null}
              {successMessage ? (
                <p className="text-sm text-emerald-600">{successMessage}</p>
              ) : null}

              <Button className="w-full" size="lg" type="submit" disabled={isLoading}>
                {isLoading ? "Criando conta..." : "Criar Conta"}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Já tem uma conta? </span>
              <Link to="/auth/login" className="text-primary hover:underline font-medium">
                Fazer login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
