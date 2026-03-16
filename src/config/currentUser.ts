export type StoredUser = {
  id?: number;
  name?: string;
  email?: string;
  status?: string;
  role?: "admin" | "manager" | "viewer" | string;
  avatar_url?: string;
  authenticated?: boolean;
};

export function getStoredUser(): StoredUser | null {
  try {
    const rawUser = localStorage.getItem("nexora_user");
    if (!rawUser) return null;
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    return null;
  }
}

export function getUserInitials(name?: string): string {
  const safeName = (name ?? "").trim();
  if (!safeName) return "US";

  const parts = safeName.split(" ").filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function getRoleLabel(role?: string): string {
  if (role === "admin") return "Administrador";
  if (role === "manager") return "Gestor";
  if (role === "viewer") return "Colaborador";
  return "Usuário";
}
