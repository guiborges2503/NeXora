import { Outlet } from "react-router";
import { Sidebar } from "../navigation/Sidebar";
import { Topbar } from "../navigation/Topbar";
import { useState } from "react";
import { isPwaMode } from "@/config/pwa";
import { cn } from "../ui/utils";
import { PwaBottomNav } from "../navigation/PwaBottomNav";

export function MainLayout() {
  const pwaMode = isPwaMode();
  const [sidebarOpen, setSidebarOpen] = useState(() => !pwaMode);

  return (
    <div
      data-pwa-mode={pwaMode ? "true" : undefined}
      className="relative isolate flex h-screen overflow-hidden bg-background"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_8%,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_38%),radial-gradient(circle_at_28%_92%,color-mix(in_srgb,var(--primary-2)_12%,transparent),transparent_34%)] dark:bg-[radial-gradient(circle_at_82%_8%,color-mix(in_srgb,var(--primary)_24%,transparent),transparent_38%),radial-gradient(circle_at_28%_92%,color-mix(in_srgb,var(--primary-2)_14%,transparent),transparent_34%)]"
      />
      {!pwaMode && <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className={cn("flex-1 overflow-y-auto bg-transparent p-6", pwaMode && "p-3 sm:p-4 pb-24")}>
          <div className="pwa-page-container max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      {pwaMode && <PwaBottomNav />}
    </div>
  );
}