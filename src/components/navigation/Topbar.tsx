import { Bell, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Link, useLocation } from "react-router";
import { type StoredUser, getRoleLabel, getStoredUser, getUserInitials } from "@/config/currentUser";
import { apiGet } from "@/config/api";
import { isPwaMode } from "@/config/pwa";
import { cn } from "../ui/utils";

interface TopbarProps {
  onMenuClick: () => void;
}

type NotificationItem = {
  id: number;
  title: string;
  description: string;
  status: "active" | "resolved";
  timestamp: string;
};

type NotificationsResponse = {
  items: NotificationItem[];
  stats: {
    active: number;
  };
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation();
  const { pathname, search } = location;
  const pwaMode = isPwaMode();
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeNotificationsCount, setActiveNotificationsCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [notificationsError, setNotificationsError] = useState("");

  useEffect(() => {
    setUser(getStoredUser());
  }, [pathname]);

  useEffect(() => {
    function syncUser() {
      setUser(getStoredUser());
    }

    window.addEventListener("storage", syncUser);
    window.addEventListener("nexora-user-updated", syncUser as EventListener);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("nexora-user-updated", syncUser as EventListener);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadNotifications() {
      setIsLoadingNotifications(true);
      setNotificationsError("");
      try {
        const response = await apiGet<NotificationsResponse>("/alerts.php");
        if (!mounted) return;

        const items = Array.isArray(response.items) ? response.items : [];
        setNotifications(items.slice(0, 5));
        setActiveNotificationsCount(Number(response.stats?.active ?? 0));
      } catch (error) {
        if (!mounted) return;
        setNotificationsError(
          error instanceof Error ? error.message : "Não foi possível carregar notificações."
        );
      } finally {
        if (mounted) {
          setIsLoadingNotifications(false);
        }
      }
    }

    void loadNotifications();
    return () => {
      mounted = false;
    };
  }, [pathname]);

  const userName = user?.name?.trim() || "Usuário";
  const userRoleLabel = getRoleLabel(user?.role);
  const userInitials = getUserInitials(user?.name);
  const avatarUrl = user?.avatar_url?.trim() || "";

  const routeMeta = (() => {
    if (pathname === "/dashboards") {
      return {
        title: "Dashboards",
        description: "Visualize e gerencie todos os seus painéis de BI",
      };
    }

    if (pathname === "/dashboards/create") {
      const isEditMode = new URLSearchParams(search).get("id");
      return {
        title: isEditMode ? "Editar Dashboard" : "Novo Dashboard",
        description: isEditMode
          ? "Atualize os dados e configurações do seu painel de BI"
          : "Configure um novo painel de BI para sua equipe",
      };
    }

    if (pathname.startsWith("/dashboards/")) {
      return {
        title: "Visualização do Dashboard",
        description: "Acompanhe os indicadores e insights do painel selecionado",
      };
    }

    if (pathname === "/users") {
      return {
        title: "Gerenciamento de Usuários",
        description: "Gerencie os usuários e permissões da plataforma",
      };
    }

    if (pathname === "/ai-assistant") {
      return {
        title: "Assistente IA",
        description: "Faça perguntas sobre seus dados e receba insights inteligentes",
      };
    }

    if (pathname === "/alerts") {
      return {
        title: "Alertas Inteligentes",
        description: "Acompanhe alertas automáticos baseados em seus dados",
      };
    }

    if (pathname === "/admin") {
      return {
        title: "Dashboard Administrativo",
        description: "Visão geral de métricas e analytics da plataforma",
      };
    }

    if (pathname === "/settings/company") {
      return {
        title: "Configurações da Empresa",
        description: "Gerencie as informações e preferências da sua organização",
      };
    }

    if (pathname === "/settings/profile") {
      return {
        title: "Meu Perfil",
        description: "Gerencie suas informações pessoais e preferências",
      };
    }

    if (pathname === "/audit") {
      return {
        title: "Logs de Auditoria",
        description: "Acompanhe todas as atividades e ações realizadas na plataforma",
      };
    }

    if (pathname === "/permissions") {
      return {
        title: "Gestão de Permissões (RBAC)",
        description: "Perfis e permissões carregados do banco de dados",
      };
    }

    if (pathname === "/company/create") {
      return {
        title: "Cadastrar Empresa",
        description: "Configure os dados da sua empresa na plataforma",
      };
    }

    if (pathname === "/access-denied") {
      return {
        title: "Acesso Negado",
        description: "Você não possui permissão para acessar este recurso",
      };
    }

    return null;
  })();

  return (
    <header
      className={cn(
        "h-16 border-b border-border bg-card px-6 flex items-center justify-between",
        pwaMode && "h-14 px-3",
      )}
    >
      <div className={cn("flex items-center gap-4 flex-1 min-w-0", pwaMode && "gap-2")}>
        {!pwaMode && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        {routeMeta ? (
          <div className="min-w-0">
            <h1 className={cn("text-xl font-semibold leading-tight", pwaMode && "text-base")}>
              {routeMeta.title}
            </h1>
            <p className={cn("text-sm text-muted-foreground truncate", pwaMode && "hidden")}>
              {routeMeta.description}
            </p>
          </div>
        ) : null}
      </div>

      <div className={cn("flex items-center gap-3", pwaMode && "gap-1")}>
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Abrir notificações"
              className="relative p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {activeNotificationsCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-destructive text-destructive-foreground rounded-full text-[10px] leading-4 text-center font-medium">
                  {activeNotificationsCount > 9 ? "9+" : activeNotificationsCount}
                </span>
              ) : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {isLoadingNotifications ? (
              <DropdownMenuItem disabled>
                <p className="text-sm text-muted-foreground">Carregando notificações...</p>
              </DropdownMenuItem>
            ) : null}

            {!isLoadingNotifications && notificationsError ? (
              <DropdownMenuItem disabled>
                <p className="text-sm text-destructive">{notificationsError}</p>
              </DropdownMenuItem>
            ) : null}

            {!isLoadingNotifications && !notificationsError && notifications.length === 0 ? (
              <DropdownMenuItem disabled>
                <p className="text-sm text-muted-foreground">Sem notificações no momento.</p>
              </DropdownMenuItem>
            ) : null}

            {!isLoadingNotifications && !notificationsError
              ? notifications.map((item) => (
                <DropdownMenuItem key={item.id} asChild>
                  <Link to="/alerts" className="flex flex-col gap-1 items-start">
                    <p className="text-sm font-medium leading-tight">{item.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    <p className="text-[11px] text-muted-foreground">{item.timestamp}</p>
                  </Link>
                </DropdownMenuItem>
              ))
              : null}

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/alerts" className="text-sm font-medium">
                Ver todas as notificações
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:bg-accent rounded-lg p-2 transition-colors">
              <Avatar className="w-8 h-8">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={userName} /> : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userRoleLabel}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            {!pwaMode && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings/profile">Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings/company">Configurações</Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/auth/login" className="text-destructive">
                Sair
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
