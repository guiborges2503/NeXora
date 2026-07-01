import type { AiReportWidget } from "@/config/aiReportsApi";
import { cn } from "@/components/ui/utils";

export const GRID_COLUMNS = 12;
export const GRID_ROW_UNIT_PX = 56;

export type WidgetPlacement = {
  className: string;
  minHeight: number;
};

export type GridLayoutPlan = {
  placements: Map<string, WidgetPlacement>;
};

function inferHeight(widget: AiReportWidget): number {
  if (widget.h !== undefined) return Math.max(2, widget.h);
  if (widget.chart_type === "table") return 5;
  if (widget.chart_type === "heatmap") return 3;
  return 4;
}

function isFullWidthWidget(widget: AiReportWidget): boolean {
  if (widget.span === "full") return true;
  if (widget.chart_type === "table") return true;
  if (widget.w !== undefined && widget.w >= 7) return true;
  if (widget.h !== undefined && widget.h >= 5 && (widget.w === undefined || widget.w >= 6)) return true;
  return false;
}

/**
 * Layout sem sobreposição: 1 coluna no mobile, 2 colunas no desktop.
 * Ignora x/y da DSL (a IA frequentemente gera coordenadas conflitantes).
 */
export function buildGridLayoutPlan(widgets: AiReportWidget[], compact = false): GridLayoutPlan {
  const placements = new Map<string, WidgetPlacement>();

  for (const widget of widgets) {
    const full = isFullWidthWidget(widget);
    placements.set(widget.id, {
      className: getWidgetGridClass(widget, compact, full),
      minHeight: inferHeight(widget) * GRID_ROW_UNIT_PX,
    });
  }

  return { placements };
}

export function getWidgetGridClass(
  widget: AiReportWidget,
  compact = false,
  full = isFullWidthWidget(widget)
): string {
  if (compact) return "min-w-0 col-span-1";
  return cn("min-w-0", full ? "col-span-1 lg:col-span-2" : "col-span-1");
}
