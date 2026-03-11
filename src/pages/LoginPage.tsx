import { Link } from "react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import logoImg from "@/img/logo.png";
import logotipoImg from "@/img/logotipo.png";

export function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="w-full flex justify-center">
            <img src={logoImg} alt="NeXora" className="w-80 max-w-full object-contain" />
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">
                Bem-vindo de volta
              </h2>
              <p className="text-muted-foreground">
                Entre com suas credenciais para acessar sua conta
              </p>
            </div>

            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="bg-input-background border-border"
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
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-input-background border-border"
                />
              </div>

              <Button asChild className="w-full" size="lg">
                <Link to="/home">Entrar</Link>
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Não tem uma conta? </span>
              <Link to="/auth/register" className="text-primary hover:underline font-medium">
                Criar conta
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-background items-center justify-center p-8">
        <div className="max-w-lg space-y-6 text-center">
          <div className="flex items-center justify-center mx-auto">
            <img src={logotipoImg} alt="NeXora" className="w-80 max-w-full object-contain" />
          </div>
          <h3 className="text-3xl font-semibold">
            Transforme dados em decisões inteligentes
          </h3>
          <p className="text-lg text-muted-foreground">
            Plataforma completa de Business Intelligence com IA explicativa para
            pequenas e médias empresas.
          </p>
          <div className="flex items-center justify-center gap-12 pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Empresas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">50k+</div>
              <div className="text-sm text-muted-foreground">Dashboards</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
