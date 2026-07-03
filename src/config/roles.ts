export type AppRole = "admin" | "manager" | "viewer";

export type RoleOption = {
  id: AppRole;
  label: string;
  description: string;
};

export const APP_ROLES: RoleOption[] = [
  {
    id: "admin",
    label: "Administrador",
    description: "Acesso total ao sistema",
  },
  {
    id: "manager",
    label: "Gestor",
    description: "Gerencia usuários e dashboards",
  },
  {
    id: "viewer",
    label: "Visualizador",
    description: "Acesso somente leitura",
  },
];

export function getRoleLabel(role?: string): string {
  const match = APP_ROLES.find((item) => item.id === role);
  return match?.label ?? "Usuário";
}

export function getRoleDescription(role?: string): string {
  const match = APP_ROLES.find((item) => item.id === role);
  return match?.description ?? "";
}

export function isAppRole(value: string): value is AppRole {
  return APP_ROLES.some((item) => item.id === value);
}
