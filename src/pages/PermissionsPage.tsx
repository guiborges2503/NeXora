import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Users, Edit3, Eye, Trash2, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const roles = [
  {
    id: "admin",
    name: "Administrador",
    description: "Acesso total ao sistema",
    users: 3,
    color: "bg-red-100 text-red-700",
  },
  {
    id: "manager",
    name: "Gestor",
    description: "Gerenciar dashboards e usuários da equipe",
    users: 8,
    color: "bg-blue-100 text-blue-700",
  },
  {
    id: "user",
    name: "Colaborador",
    description: "Visualizar dashboards e gerar insights",
    users: 24,
    color: "bg-green-100 text-green-700",
  },
];

const permissions = {
  dashboards: [
    { id: "dashboard_view", name: "Visualizar dashboards", icon: Eye },
    { id: "dashboard_create", name: "Criar dashboards", icon: Edit3 },
    { id: "dashboard_edit", name: "Editar dashboards", icon: Edit3 },
    { id: "dashboard_delete", name: "Excluir dashboards", icon: Trash2 },
  ],
  users: [
    { id: "user_view", name: "Visualizar usuários", icon: Users },
    { id: "user_create", name: "Criar usuários", icon: Edit3 },
    { id: "user_edit", name: "Editar usuários", icon: Edit3 },
    { id: "user_delete", name: "Excluir usuários", icon: Trash2 },
  ],
  ai: [
    { id: "ai_use", name: "Usar assistente IA", icon: Eye },
    { id: "ai_advanced", name: "Recursos avançados de IA", icon: Edit3 },
  ],
  settings: [
    { id: "settings_view", name: "Visualizar configurações", icon: Eye },
    { id: "settings_edit", name: "Editar configurações", icon: Edit3 },
  ],
};

const defaultPermissions = {
  admin: {
    dashboard_view: true,
    dashboard_create: true,
    dashboard_edit: true,
    dashboard_delete: true,
    user_view: true,
    user_create: true,
    user_edit: true,
    user_delete: true,
    ai_use: true,
    ai_advanced: true,
    settings_view: true,
    settings_edit: true,
  },
  manager: {
    dashboard_view: true,
    dashboard_create: true,
    dashboard_edit: true,
    dashboard_delete: false,
    user_view: true,
    user_create: false,
    user_edit: true,
    user_delete: false,
    ai_use: true,
    ai_advanced: true,
    settings_view: true,
    settings_edit: false,
  },
  user: {
    dashboard_view: true,
    dashboard_create: false,
    dashboard_edit: false,
    dashboard_delete: false,
    user_view: false,
    user_create: false,
    user_edit: false,
    user_delete: false,
    ai_use: true,
    ai_advanced: false,
    settings_view: false,
    settings_edit: false,
  },
};

export function PermissionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Gestão de Permissões (RBAC)</h1>
          <p className="text-muted-foreground">
            Configure permissões e controle de acesso por perfil
          </p>
        </div>
        <Button size="lg">
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      {/* Roles Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{role.name}</h3>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {role.users} usuários
                  </span>
                </div>
                <Badge variant="secondary" className={role.color}>
                  {role.id}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Permissões</CardTitle>
          <CardDescription>
            Configure quais ações cada perfil pode realizar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="admin">Administrador</TabsTrigger>
              <TabsTrigger value="manager">Gestor</TabsTrigger>
              <TabsTrigger value="user">Colaborador</TabsTrigger>
            </TabsList>

            {roles.map((role) => (
              <TabsContent key={role.id} value={role.id} className="space-y-6 mt-6">
                {/* Dashboards */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Dashboards</h3>
                  <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                    {permissions.dashboards.map((permission) => {
                      const Icon = permission.icon;
                      return (
                        <div
                          key={permission.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {permission.name}
                            </span>
                          </div>
                          <Switch
                            defaultChecked={
                              defaultPermissions[role.id as keyof typeof defaultPermissions][
                                permission.id as keyof (typeof defaultPermissions)["admin"]
                              ]
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Users */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Usuários</h3>
                  <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                    {permissions.users.map((permission) => {
                      const Icon = permission.icon;
                      return (
                        <div
                          key={permission.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {permission.name}
                            </span>
                          </div>
                          <Switch
                            defaultChecked={
                              defaultPermissions[role.id as keyof typeof defaultPermissions][
                                permission.id as keyof (typeof defaultPermissions)["admin"]
                              ]
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Assistente IA</h3>
                  <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                    {permissions.ai.map((permission) => {
                      const Icon = permission.icon;
                      return (
                        <div
                          key={permission.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {permission.name}
                            </span>
                          </div>
                          <Switch
                            defaultChecked={
                              defaultPermissions[role.id as keyof typeof defaultPermissions][
                                permission.id as keyof (typeof defaultPermissions)["admin"]
                              ]
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Configurações</h3>
                  <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                    {permissions.settings.map((permission) => {
                      const Icon = permission.icon;
                      return (
                        <div
                          key={permission.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {permission.name}
                            </span>
                          </div>
                          <Switch
                            defaultChecked={
                              defaultPermissions[role.id as keyof typeof defaultPermissions][
                                permission.id as keyof (typeof defaultPermissions)["admin"]
                              ]
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
