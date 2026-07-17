import { Bot, Bell, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "react-router";
import { cn } from "../ui/utils";

const pwaItems = [
  { icon: LayoutDashboard, label: "Dashboards", path: "/dashboards" },
  { icon: Bot, label: "IA", path: "/ai-assistant" },
  { icon: Bell, label: "Alertas", path: "/alerts" },
];

export function PwaBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/80 shadow-[0_-12px_40px_-28px_var(--primary)] backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-screen-md items-center justify-around px-2 pb-[max(env(safe-area-inset-bottom),0.25rem)]">
        {pwaItems.map((item) => {
          const Icon = item.icon;
          const isDashboardItem = item.path === "/dashboards";
          const isActive = isDashboardItem
            ? location.pathname === "/dashboards" ||
              location.pathname === "/home" ||
              location.pathname.startsWith("/dashboards/")
            : location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex min-w-[88px] flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "bg-gradient-to-r from-primary to-primary-2 text-white shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
