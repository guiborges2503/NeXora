import { apiGet } from "@/config/api";

export type StoredUser = {
  id?: number;
  name?: string;
  email?: string;
  status?: string;
  role?: "admin" | "manager" | "viewer" | string;
  avatar_url?: string;
  authenticated?: boolean;
};

export { getRoleLabel } from "@/config/roles";

export function getStoredUser(): StoredUser | null {
  try {
    const rawUser = localStorage.getItem("nexora_user");
    if (!rawUser) return null;
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    return null;
  }
}

export function persistStoredUser(patch: Partial<StoredUser>): StoredUser | null {
  const current = getStoredUser();
  if (!current) return null;

  const next: StoredUser = { ...current, ...patch, authenticated: true };
  localStorage.setItem("nexora_user", JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("nexora-user-updated"));
  return next;
}

export async function refreshSessionUser(): Promise<StoredUser | null> {
  const current = getStoredUser();
  if (!current) return null;

  try {
    const profile = await apiGet<{
      id: number;
      name: string;
      email: string;
      status: string;
      role: string;
      avatar_url?: string;
    }>("/profile.php");

    return persistStoredUser({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      status: profile.status,
      role: profile.role,
      avatar_url: profile.avatar_url,
    });
  } catch {
    return current;
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
