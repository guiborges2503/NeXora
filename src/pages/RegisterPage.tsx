import { Link } from "react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import logoImg from "@/img/logo.png";
import logotipoImg from "@/img/logotipo.png";

export function RegisterPage() {
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
                Preencha os dados para cadastrar um novo usuário
              </p>
            </div>

            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="João Silva"
                  className="bg-input-background border-border"
                />
              </div>

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
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-input-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Perfil de Acesso</Label>
                <Select>
                  <SelectTrigger className="bg-input-background border-border">
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="manager">Gestor</SelectItem>
                    <SelectItem value="user">Colaborador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button asChild className="w-full" size="lg">
                <Link to="/home">Criar Conta</Link>
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
