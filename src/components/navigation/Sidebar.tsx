import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Users,
  Bot,
  Bell,
  BarChart3,
  Settings,
  Shield,
  FileText,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
} from "lucide-react";
import logoImg from "@/img/logo.png";
import logotipoImg from "@/img/logotipo.png";
import { isFocusedPwaRoute, isPwaMode } from "@/config/pwa";
import { cn } from "../ui/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const configSubItems = [
  { icon: Users, label: "Usuários", path: "/users" },
  { icon: Shield, label: "Permissões", path: "/permissions" },
  { icon: FileText, label: "Auditoria", path: "/audit" },
  { icon: Building2, label: "Empresa", path: "/settings/company" },
];

const mainMenuItems = [
  { icon: LayoutDashboard, label: "Dashboards", path: "/dashboards" },
  { icon: Bot, label: "Assistente IA", path: "/ai-assistant" },
  { icon: Bell, label: "Alertas", path: "/alerts" },
  { icon: BarChart3, label: "Analytics", path: "/admin" },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const pwaMode = isPwaMode();
  const visibleMainMenuItems = pwaMode
    ? mainMenuItems.filter((item) => isFocusedPwaRoute(item.path))
    : mainMenuItems;
  const [configOpen, setConfigOpen] = useState(
    configSubItems.some((item) => location.pathname === item.path)
  );

  const isConfigActive = configSubItems.some((item) => location.pathname === item.path);

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-card border-r border-border transition-all duration-300 flex-shrink-0",
        isOpen ? "w-64" : "w-24"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center justify-center h-24 border-b border-border flex-shrink-0",
        isOpen ? "px-4" : "px-2"
      )}>
        {isOpen && (
          <div className="flex items-center justify-center w-full min-w-0">
            <img src={logoImg} alt="NeXora" className="w-80 max-w-full object-contain" />
          </div>
        )}
        {!isOpen && (
          <img src={logotipoImg} alt="NeXora" className="h-20 w-20 object-contain" />
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleMainMenuItems.map((item) => {
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
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section: Configurações (expandable) + Logout */}
      <div className="flex flex-col gap-1 px-3 py-4 border-t border-border">
        {!pwaMode && (
          isOpen ? (
            <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
              <CollapsibleTrigger
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isConfigActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium flex-1 text-left">Configurações</span>
                <ChevronDown
                  className={cn("w-4 h-4 flex-shrink-0 transition-transform", configOpen && "rotate-180")}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
                  {configSubItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "w-full flex items-center justify-center px-3 py-2.5 rounded-lg transition-colors",
                  isConfigActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" sideOffset={8} className="min-w-[180px]">
                {configSubItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 cursor-pointer",
                          isActive && "bg-primary text-primary-foreground"
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        )}
        <button
          onClick={() => navigate("/auth/login")}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full",
            "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isOpen && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>

      {/* Toggle Button */}
      {!pwaMode && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-12 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center hover:bg-accent transition-colors z-10"
        >
          {isOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      )}
    </aside>
  );
}