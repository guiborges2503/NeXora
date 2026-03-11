import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Building2 } from "lucide-react";
import { Link } from "react-router";

export function CreateCompanyPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Cadastrar Empresa</h1>
        <p className="text-muted-foreground">
          Configure os dados da sua empresa na plataforma
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Informações da Empresa
          </CardTitle>
          <CardDescription>
            Preencha os dados principais da sua organização
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nome da Empresa</Label>
              <Input
                id="company-name"
                placeholder="Ex: Acme Corporation"
                className="bg-input-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                className="bg-input-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Logo da Empresa</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Clique para fazer upload ou arraste o arquivo
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG ou SVG (máx. 2MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button asChild className="flex-1" size="lg">
              <Link to="/home">Salvar</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1" size="lg">
              <Link to="/home">Cancelar</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
