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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-stretch sm:justify-end">
        <Button size="default" className="w-full sm:w-auto" disabled>
          <Save className="mr-2 h-4 w-4 shrink-0" />
          Salvar Alterações
        </Button>
      </div>

      <div className={`grid gap-3 sm:gap-6 ${roleColumnsClass}`}>
        {roles.map((role) => (
          <Card key={role.id} className="transition-shadow hover:shadow-lg">
            <CardContent className="p-4 pt-4 sm:p-6 sm:pt-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
                    <Shield className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold">{role.name}</h3>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm text-muted-foreground">{role.users} usuários</span>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {role.id}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-1 p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Matriz de Permissões</CardTitle>
          <CardDescription>Leitura baseada na configuração de roles e permissions</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <Tabs defaultValue={roles[0].id} className="w-full">
            <div className="overflow-x-auto pb-1">
              <TabsList
                className={`inline-flex h-auto min-w-full w-max gap-1 p-1 sm:grid sm:w-full sm:min-w-0 ${tabsColumnsClass}`}
              >
                {roles.map((role) => (
                  <TabsTrigger
                    key={role.id}
                    value={role.id}
                    className="shrink-0 px-3 py-2 text-xs sm:text-sm"
                  >
                    {role.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {roles.map((role) => (
              <TabsContent key={role.id} value={role.id} className="mt-4 space-y-5 sm:mt-6 sm:space-y-6">
                {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                  <div key={category} className="space-y-3 sm:space-y-4">
                    <h3 className="text-base font-semibold capitalize sm:text-lg">{category}</h3>
                    <div className="space-y-2 border-l-2 border-primary/20 pl-3 sm:space-y-3 sm:pl-4">
                      {categoryPermissions.map((permission) => {
                        const hasPermission =
                          rolePermissions[role.id]?.includes(permission.name) ?? false;
                        const Icon = permission.name.includes("read") ? Eye : Edit3;

                        return (
                          <div
                            key={`${role.id}-${permission.id}`}
                            className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 p-3"
                          >
                            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <span className="text-sm font-medium leading-snug">
                                {permission.description}
                              </span>
                            </div>
                            <Switch checked={hasPermission} disabled className="shrink-0" />
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
