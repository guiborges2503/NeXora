import { apiDelete, apiGet, apiPost } from "@/config/api";

type StoredUser = {
  id?: number;
};

export function getCurrentUserId(): number | null {
  try {
    const rawUser = localStorage.getItem("nexora_user");
    if (!rawUser) return null;

    const user = JSON.parse(rawUser) as StoredUser;
    const userId = Number(user.id);
    return Number.isFinite(userId) && userId > 0 ? userId : null;
  } catch {
    return null;
  }
}

export async function listFavoriteDashboardIds(userId: number): Promise<number[]> {
  const data = await apiGet<number[]>(`/dashboard_favorites.php?user_id=${encodeURIComponent(String(userId))}`);
  return data.map((value) => Number(value)).filter((value) => Number.isFinite(value));
}

export async function addDashboardFavorite(userId: number, dashboardId: number): Promise<void> {
  await apiPost<{ user_id: number; dashboard_id: number }, { user_id: number; dashboard_id: number }>(
    "/dashboard_favorites.php",
    {
      user_id: userId,
      dashboard_id: dashboardId,
    }
  );
}

export async function removeDashboardFavorite(userId: number, dashboardId: number): Promise<void> {
  await apiDelete<never>(
    `/dashboard_favorites.php?user_id=${encodeURIComponent(String(userId))}&dashboard_id=${encodeURIComponent(String(dashboardId))}`
  );
}
