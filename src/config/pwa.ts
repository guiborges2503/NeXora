export const PWA_FOCUSED_ROUTES = ["/dashboards", "/ai-assistant", "/alerts"] as const;

export function isFocusedPwaRoute(path: string): boolean {
  return PWA_FOCUSED_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}

export function isPwaMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const forceByQuery = new URLSearchParams(window.location.search).get("pwa") === "1";
  const forceByEnv = String(import.meta.env.VITE_FORCE_PWA_MODE ?? "").toLowerCase() === "true";

  if (forceByQuery || forceByEnv) {
    return true;
  }

  const media = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const iosStandalone = "standalone" in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return Boolean(media || iosStandalone);
}
