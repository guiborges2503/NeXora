import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";

type ThemeToggleProps = {
  className?: string;
  variant?: "icon" | "labeled";
};

export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size={variant === "labeled" ? "sm" : "icon"}
        className={cn("opacity-0", className)}
        aria-hidden
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size={variant === "labeled" ? "sm" : "icon"}
      className={cn(
        variant === "labeled" ? "gap-2 px-3" : "h-9 w-9",
        className
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Alternar para tema claro" : "Alternar para tema escuro"}
      aria-label={isDark ? "Alternar para tema claro" : "Alternar para tema escuro"}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400" />
      ) : (
        <Moon className="h-4 w-4 text-indigo-600" />
      )}
      {variant === "labeled" ? (
        <span className="text-xs font-medium">{isDark ? "Claro" : "Escuro"}</span>
      ) : null}
    </Button>
  );
}
