import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { Shield, Users, Eye, Edit3, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet } from "@/config/api";

type Role = {
  id: string;
  name: string;
  description: string;
  users: number;
};

type Permission = {
  id: string;
  name: string;
  description: string;
};

type PermissionsResponse = {
  roles: Role[];
  permissions: Permission[];
  rolePermissions: Record<string, string[]>;
};

export function PermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPermissions() {
      try {
        const data = await apiGet<PermissionsResponse>("/permissions.php");
        if (mounted) {
          setRoles(data.roles);
          setPermissions(data.permissions);
          setRolePermissions(data.rolePermissions);
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Não foi possível carregar permissões."
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadPermissions();
    return () => {
      mounted = false;
    };
  }, []);

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    for (const permission of permissions) {
      const category = permission.name.split(".")[0] || "geral";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
    }
    return groups;
  }, [permissions]);

  const roleColumnsClass =
    roles.length >= 4 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-3";

  const tabsColumnsClass =
    roles.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 md:grid-cols-3";

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando permissões...</p>;
  }

  if (errorMessage) {
    return <p className="text-destructive">{errorMessage}</p>;
  }

  if (roles.length === 0) {
    return <p className="text-muted-foreground">Nenhum perfil encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button size="lg" disabled>
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      <div className={`grid gap-6 ${roleColumnsClass}`}>
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
                  <span className="text-sm text-muted-foreground">{role.users} usuários</span>
                </div>
                <Badge variant="secondary">{role.id}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Matriz de Permissões</CardTitle>
          <CardDescription>Leitura baseada na configuração de roles e permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={roles[0].id} className="w-full">
            <TabsList className={`grid w-full ${tabsColumnsClass}`}>
              {roles.map((role) => (
                <TabsTrigger key={role.id} value={role.id}>
                  {role.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {roles.map((role) => (
              <TabsContent key={role.id} value={role.id} className="space-y-6 mt-6">
                {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                  <div key={category} className="space-y-4">
                    <h3 className="font-semibold text-lg capitalize">{category}</h3>
                    <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                      {categoryPermissions.map((permission) => {
                        const hasPermission =
                          rolePermissions[role.id]?.includes(permission.name) ?? false;
                        const Icon = permission.name.includes("read") ? Eye : Edit3;

                        return (
                          <div
                            key={`${role.id}-${permission.id}`}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{permission.description}</span>
                            </div>
                            <Switch checked={hasPermission} disabled />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
