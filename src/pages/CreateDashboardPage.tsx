import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { LayoutDashboard } from "lucide-react";
import { Link } from "react-router";

export function CreateDashboardPage() {
  const permissions = [
    { id: "admin", label: "Administradores" },
    { id: "manager", label: "Gestores" },
    { id: "user", label: "Colaboradores" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Novo Dashboard</h1>
        <p className="text-muted-foreground">
          Configure um novo painel de BI para sua equipe
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5" />
            Informações do Dashboard
          </CardTitle>
          <CardDescription>
            Defina os dados e configurações do painel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dashboard-name">Nome do Dashboard</Label>
              <Input
                id="dashboard-name"
                placeholder="Ex: Relatório de Vendas Q1"
                className="bg-input-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descreva o propósito deste dashboard..."
                className="bg-input-background border-border resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL do BI</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://app.powerbi.com/..."
                className="bg-input-background border-border"
              />
              <p className="text-xs text-muted-foreground">
                Cole o link de embed do seu dashboard (Power BI, Tableau, Looker, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commercial">Comercial</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="finance">Financeiro</SelectItem>
                  <SelectItem value="hr">Recursos Humanos</SelectItem>
                  <SelectItem value="operations">Operações</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Permissões de Acesso</Label>
              <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox id={permission.id} />
                    <label
                      htmlFor={permission.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {permission.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button asChild className="flex-1" size="lg">
              <Link to="/home">Criar Dashboard</Link>
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
