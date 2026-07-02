import { Link } from "react-router";
import { MoreVertical, Sparkles, Star, type LucideIcon } from "lucide-react";
import { AiReportCardPreview } from "@/components/dashboards/AiReportCardPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/components/ui/utils";

export type DashboardListItem = {
  id: number;
  name: string;
  description: string;
  category: "commercial" | "marketing" | "finance" | "hr" | "operations" | "other";
  embed_url?: string;
  owner_id?: number;
  updated_at: string;
  views_count: number;
  report_type?: "powerbi" | "ai_report";
};

type DashboardListCardProps = {
  dashboard: DashboardListItem;
  categoryLabel: string;
  categoryIcon: LucideIcon;
  categoryIconColor: string;
  categoryPreviewGradient: string;
  previewUrl: string;
  isPowerBiPreview: boolean;
  isFavorite: boolean;
  viewPath: string;
  canEditAiReport: boolean;
  relativeDate: string;
  onEdit: () => void;
  onShare: () => void;
  onDuplicate?: () => void;
  onDelete: () => void;
};

export function DashboardListCard({
  dashboard,
  categoryLabel,
  categoryIcon: Icon,
  categoryIconColor,
  categoryPreviewGradient,
  previewUrl,
  isPowerBiPreview,
  isFavorite,
  viewPath,
  canEditAiReport,
  relativeDate,
  onEdit,
  onShare,
  onDuplicate,
  onDelete,
}: DashboardListCardProps) {
  const isAiReport = dashboard.report_type === "ai_report";

  return (
    <Card className="group overflow-hidden border-border/80 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative">
        {isAiReport ? (
          <AiReportCardPreview reportId={dashboard.id} />
        ) : previewUrl ? (
          <div className="relative h-44 w-full overflow-hidden border-b border-border/60 bg-muted/30">
            <iframe
              src={previewUrl}
              title={`Prévia ${dashboard.name}`}
              className={cn(
                "pointer-events-none absolute left-0 top-0 w-full border-0",
                isPowerBiPreview ? "h-[calc(100%+72px)]" : "h-full"
              )}
              loading="lazy"
              referrerPolicy="no-referrer"
              tabIndex={-1}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />
          </div>
        ) : (
          <div
            className={cn(
              "flex h-44 items-center justify-center border-b border-border/60 bg-gradient-to-br",
              categoryPreviewGradient
            )}
          >
            <Icon className="h-12 w-12 text-foreground/20" />
          </div>
        )}
      </div>

      <CardHeader className="space-y-0 pb-2 pt-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40",
              categoryIconColor
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-1.5">
              <h3 className="min-w-0 flex-1 break-words font-semibold leading-snug text-foreground">
                {dashboard.name}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="shrink-0 rounded-md border border-border/60 p-1.5 text-muted-foreground opacity-70 transition-opacity hover:bg-muted hover:opacity-100"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={onEdit}>
                    {isAiReport ? (canEditAiReport ? "Editar" : "Abrir") : "Editar"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={onShare}>Compartilhar</DropdownMenuItem>
                  {!isAiReport && onDuplicate ? (
                    <DropdownMenuItem onSelect={onDuplicate}>Duplicar</DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px]">
                {categoryLabel}
              </Badge>
              {isAiReport ? (
                <Badge className="border-0 bg-primary/10 text-[10px] text-primary hover:bg-primary/10">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Relatório IA
                </Badge>
              ) : null}
              {isFavorite ? (
                <Badge className="border-0 bg-amber-500/15 text-[10px] text-amber-700 dark:text-amber-300 hover:bg-amber-500/15">
                  <Star className="mr-1 h-3 w-3 fill-current" />
                  Favorito
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3 pt-0">
        <div className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
          <span>{relativeDate}</span>
          <span>{dashboard.views_count} views</span>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button asChild className="w-full" size="sm" variant="default">
          <Link to={viewPath}>Visualizar</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
