import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Clock, LogIn } from "lucide-react";

export function SessionExpiredPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-24 h-24 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto">
          <Clock className="w-12 h-12 text-orange-600" />
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-semibold">Sessão Expirada</h1>
          <p className="text-muted-foreground text-lg">
            Sua sessão expirou por inatividade. Por favor, faça login novamente
            para continuar.
          </p>
        </div>

        <div className="bg-muted/30 border border-border rounded-lg p-6 space-y-3 text-left">
          <h3 className="font-semibold">Por motivos de segurança:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Sessões expiram após 30 minutos de inatividade</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Seus dados permanecem seguros e protegidos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Você pode fazer login novamente a qualquer momento</span>
            </li>
          </ul>
        </div>

        <div className="pt-6">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link to="/auth/login">
              <LogIn className="w-4 h-4 mr-2" />
              Fazer Login Novamente
            </Link>
          </Button>
        </div>

        <div className="pt-4">
          <p className="text-sm text-muted-foreground">
            Problemas para fazer login?{" "}
            <a href="mailto:suporte@empresa.com" className="text-primary hover:underline">
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
