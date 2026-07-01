import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import type { DashboardColorMode } from "@/components/reports/aiReportTheme";

/** Sincroniza painéis IA com o tema global do app (next-themes). */
export function useAiReportAppearance() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const colorMode: DashboardColorMode =
    mounted && resolvedTheme === "light" ? "light" : "dark";

  return {
    colorMode,
    mounted,
    setColorMode: (mode: DashboardColorMode) => setTheme(mode),
    toggleColorMode: () => setTheme(colorMode === "dark" ? "light" : "dark"),
  };
}
