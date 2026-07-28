import { Outlet } from "react-router";
import { useState } from "react";
import { Sidebar } from "../navigation/Sidebar";
import { Topbar } from "../navigation/Topbar";
import { PwaBottomNav } from "../navigation/PwaBottomNav";
import { isPwaMode } from "@/config/pwa";
import { cn } from "../ui/utils";
import { useIsCompactLayout } from "../ui/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

export function MainLayout() {
  const pwaMode = isPwaMode();
  const isCompact = useIsCompactLayout();
  const useMobileShell = pwaMode || isCompact;

  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      data-pwa-mode={pwaMode ? "true" : undefined}
      data-mobile-shell={useMobileShell ? "true" : undefined}
      className="relative isolate flex h-dvh max-h-dvh overflow-hidden bg-background"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_8%,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_38%),radial-gradient(circle_at_28%_92%,color-mix(in_srgb,var(--primary-2)_12%,transparent),transparent_34%)] dark:bg-[radial-gradient(circle_at_82%_8%,color-mix(in_srgb,var(--primary)_24%,transparent),transparent_38%),radial-gradient(circle_at_28%_92%,color-mix(in_srgb,var(--primary-2)_14%,transparent),transparent_34%)]"
      />

      {!useMobileShell ? (
        <Sidebar
          isOpen={desktopOpen}
          onToggle={() => setDesktopOpen((open) => !open)}
          variant="dock"
        />
      ) : null}

      {!pwaMode && useMobileShell ? (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="w-[min(20rem,88vw)] max-w-[88vw] gap-0 border-sidebar-border bg-sidebar/95 p-0 backdrop-blur-2xl"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Menu de navegação</SheetTitle>
              <SheetDescription>Acesse as seções do NeXora</SheetDescription>
            </SheetHeader>
            <Sidebar
              isOpen
              onToggle={() => setMobileOpen(false)}
              variant="drawer"
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          showMenuButton={!pwaMode && useMobileShell}
          compact={useMobileShell}
        />
        <main
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden bg-transparent p-6",
            useMobileShell && "p-3 pb-24 sm:p-4 sm:pb-24",
          )}
        >
          <div className="pwa-page-container mx-auto max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>

      {useMobileShell ? <PwaBottomNav /> : null}
    </div>
  );
}
