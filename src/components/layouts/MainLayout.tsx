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
    <div data-pwa-mode={pwaMode ? "true" : undefined} className="flex h-screen bg-background overflow-hidden">
      {!pwaMode && <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className={cn("flex-1 overflow-y-auto bg-background p-6", pwaMode && "p-3 sm:p-4 pb-24")}>
          <div className="pwa-page-container max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      {pwaMode && <PwaBottomNav />}
    </div>
  );
}