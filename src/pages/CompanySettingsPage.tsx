import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Building2, Upload, Save } from "lucide-react";

export function CompanySettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold mb-2">Configurações da Empresa</h1>
        <p className="text-muted-foreground">
          Gerencie as informações e preferências da sua organização
        </p>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Dados da Empresa
          </CardTitle>
          <CardDescription>
            Informações principais da sua organização
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nome da Empresa</Label>
              <Input
                id="company-name"
                defaultValue="Acme Corporation"
                className="bg-input-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                defaultValue="12.345.678/0001-90"
                className="bg-input-background border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Logo da Empresa</Label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                <Building2 className="w-12 h-12 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Alterar Logo
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  PNG, JPG ou SVG (máx. 2MB)
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                defaultValue="(11) 98765-4321"
                className="bg-input-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                defaultValue="www.acmecorp.com"
                className="bg-input-background border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              defaultValue="Av. Paulista, 1000 - São Paulo, SP"
              className="bg-input-background border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferências Gerais</CardTitle>
          <CardDescription>
            Configure as preferências da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações por E-mail</Label>
              <p className="text-sm text-muted-foreground">
                Receber alertas e atualizações importantes
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Insights Automáticos</Label>
              <p className="text-sm text-muted-foreground">
                Gerar insights diários com IA
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compartilhamento de Dados</Label>
              <p className="text-sm text-muted-foreground">
                Permitir compartilhamento anônimo para melhorias
              </p>
            </div>
            <Switch />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Modo de Manutenção</Label>
              <p className="text-sm text-muted-foreground">
                Desabilitar acesso temporariamente
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
          <CardDescription>
            Gerencie configurações de segurança da conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha Atual</Label>
            <Input
              id="current-password"
              type="password"
              placeholder="••••••••"
              className="bg-input-background border-border"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                className="bg-input-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                className="bg-input-background border-border"
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Autenticação em Dois Fatores</Label>
              <p className="text-sm text-muted-foreground">
                Adicionar camada extra de segurança
              </p>
            </div>
            <Button variant="outline">Configurar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" size="lg">
          Cancelar
        </Button>
        <Button size="lg">
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
