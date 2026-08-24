import { Bell, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Link, useLocation, useNavigate } from "react-router";
import { type StoredUser, getRoleLabel, getStoredUser, getUserInitials, refreshSessionUser } from "@/config/currentUser";
import { apiGet } from "@/config/api";
import { clearAuthSession } from "@/config/auth";
import { isPwaMode } from "@/config/pwa";
import { cn } from "../ui/utils";

interface TopbarProps {
  onMenuClick: () => void;
  showMenuButton?: boolean;
  compact?: boolean;
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

export function Topbar({ onMenuClick, showMenuButton = false, compact = false }: TopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname, search } = location;
  const pwaMode = isPwaMode();
  const isCompact = compact || pwaMode;
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeNotificationsCount, setActiveNotificationsCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [notificationsError, setNotificationsError] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    void refreshSessionUser().then(() => {
      if (mounted) setUser(getStoredUser());
    });
    return () => {
      mounted = false;
    };
  }, []);

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

    if (pathname === "/settings/openrouter") {
      return {
        title: "Configuração da API OpenRouter",
        description: "Defina sua chave e o modelo padrão para chamadas à API OpenRouter",
      };
    }

    if (pathname === "/settings/data-sources") {
      return {
        title: "Conexão de dados da empresa",
        description: "Configure o banco de dados ou a API da sua operação",
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
        "relative z-10 h-16 border-b border-border bg-card/75 px-6 flex items-center justify-between shadow-sm shadow-primary/5 backdrop-blur-2xl",
        isCompact && "h-14 px-3",
      )}
    >
      <div className={cn("flex items-center gap-4 flex-1 min-w-0", isCompact && "gap-2")}>
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Abrir menu"
            className="shrink-0 p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        {routeMeta ? (
          <div className="min-w-0">
            <h1 className={cn("font-display text-xl font-bold leading-tight", isCompact && "text-base")}>
              {routeMeta.title}
            </h1>
            <p className={cn("text-sm text-muted-foreground truncate", isCompact && "hidden")}>
              {routeMeta.description}
            </p>
          </div>
        ) : null}
      </div>

      <div className={cn("flex items-center gap-3", isCompact && "gap-1")}>
        <ThemeToggle />
        {/* Notifications */}
        {isCompact ? (
          <>
            <button
              type="button"
              aria-label="Abrir notificações"
              className="relative rounded-lg p-2 transition-colors hover:bg-accent"
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell className="h-5 w-5" />
              {activeNotificationsCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-destructive text-center text-[10px] font-medium leading-4 text-destructive-foreground">
                  {activeNotificationsCount > 9 ? "9+" : activeNotificationsCount}
                </span>
              ) : null}
            </button>
            <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <SheetContent
                side="bottom"
                className="max-h-[min(85dvh,640px)] gap-0 rounded-t-2xl border-border !bg-background p-0 text-foreground shadow-2xl [background-image:none]"
              >
                <SheetHeader className="border-b border-border px-4 py-3 text-left">
                  <SheetTitle>Notificações</SheetTitle>
                  <SheetDescription className="sr-only">
                    Lista de alertas e notificações recentes
                  </SheetDescription>
                </SheetHeader>

                <div className="max-h-[min(60dvh,480px)] overflow-y-auto px-2 py-2">
                  {isLoadingNotifications ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground">Carregando notificações...</p>
                  ) : null}

                  {!isLoadingNotifications && notificationsError ? (
                    <p className="px-3 py-4 text-sm text-destructive">{notificationsError}</p>
                  ) : null}

                  {!isLoadingNotifications && !notificationsError && notifications.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground">Sem notificações no momento.</p>
                  ) : null}

                  {!isLoadingNotifications && !notificationsError
                    ? notifications.map((item) => (
                        <Link
                          key={item.id}
                          to="/alerts"
                          onClick={() => setNotificationsOpen(false)}
                          className="block rounded-xl px-3 py-3 transition-colors hover:bg-accent"
                        >
                          <p className="text-sm font-medium leading-tight">{item.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">{item.timestamp}</p>
                        </Link>
                      ))
                    : null}
                </div>

                <div className="border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <Link
                    to="/alerts"
                    onClick={() => setNotificationsOpen(false)}
                    className="flex h-11 items-center justify-center rounded-xl bg-primary/15 text-sm font-semibold text-primary transition-colors hover:bg-primary/25"
                  >
                    Ver todas as notificações
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Abrir notificações"
                className="relative rounded-lg p-2 transition-colors hover:bg-accent"
              >
                <Bell className="h-5 w-5" />
                {activeNotificationsCount > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-destructive text-center text-[10px] font-medium leading-4 text-destructive-foreground">
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
                      <Link to="/alerts" className="flex flex-col items-start gap-1">
                        <p className="text-sm font-medium leading-tight">{item.title}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
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
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-accent">
              <Avatar className="h-8 w-8">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={userName} /> : null}
                <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
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
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                clearAuthSession();
                navigate("/auth/login");
              }}
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
