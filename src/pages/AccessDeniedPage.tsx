import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Shield, Home, Mail } from "lucide-react";

export function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-24 h-24 bg-red-100 rounded-3xl flex items-center justify-center mx-auto">
          <Shield className="w-12 h-12 text-red-600" />
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-semibold">Acesso Negado</h1>
          <p className="text-muted-foreground text-lg">
            Você não tem permissão para acessar esta página ou recurso.
          </p>
        </div>

        <div className="bg-muted/30 border border-border rounded-lg p-6 space-y-3 text-left">
          <h3 className="font-semibold">Por que isso aconteceu?</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Seu nível de acesso não permite visualizar este conteúdo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Você pode precisar de permissões adicionais</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Entre em contato com um administrador para solicitar acesso</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
          <Button asChild size="lg">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="mailto:admin@empresa.com">
              <Mail className="w-4 h-4 mr-2" />
              Contatar Suporte
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
