import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect, type ReactNode } from "react";
import { AI_REPORT_APPEARANCE_KEY } from "@/components/reports/aiReportTheme";

export const NEXORA_THEME_STORAGE_KEY = "nexora-theme";

type AppThemeProviderProps = {
  children: ReactNode;
};

function LegacyThemeMigration() {
  useEffect(() => {
    const legacy = window.localStorage.getItem(AI_REPORT_APPEARANCE_KEY);
    if (legacy !== "light" && legacy !== "dark") return;

    const current = window.localStorage.getItem(NEXORA_THEME_STORAGE_KEY);
    if (!current) {
      window.localStorage.setItem(NEXORA_THEME_STORAGE_KEY, legacy);
    }
    window.localStorage.removeItem(AI_REPORT_APPEARANCE_KEY);
  }, []);

  return null;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey={NEXORA_THEME_STORAGE_KEY}
      themes={["light", "dark"]}
    >
      <LegacyThemeMigration />
      {children}
    </NextThemesProvider>
  );
}
