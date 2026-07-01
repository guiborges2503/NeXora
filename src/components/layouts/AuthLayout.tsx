import { Outlet } from "react-router";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle variant="labeled" className="bg-card/80 backdrop-blur-sm border border-border shadow-sm" />
      </div>
      <Outlet />
    </div>
  );
}
