import { useMemo, type ReactNode } from "react";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  DollarSign,
  LayoutDashboard,
  Lightbulb,
  Package,
  PieChart as PieChartIcon,
  Sparkles,
  Table2,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AiReportChart } from "@/components/reports/AiReportChart";
import { AiReportKpiSparkline } from "@/components/reports/AiReportKpiSparkline";
import { buildGridLayoutPlan, getWidgetGridClass } from "@/components/reports/aiReportGrid";
import {
  getDashboardTokens,
  INSIGHT_ICONS,
  KPI_ACCENTS,
  type DashboardTokens,
} from "@/components/reports/aiReportTheme";
import { useAiReportAppearance } from "@/components/reports/useAiReportAppearance";
import type {
  AiReportChartType,
  AiReportDashboardData,
  AiReportFilterDefinition,
  AiReportKpi,
  AiReportWidget,
} from "@/config/aiReportsApi";
import { cn } from "@/components/ui/utils";

type AiReportDashboardProps = {
  title: string;
  description?: string;
  businessRules?: string;
  dashboard: AiReportDashboardData;
  compact?: boolean;
  insights?: string[];
  recommendations?: string[];
  filters?: AiReportFilterDefinition[];
  theme?: string;
};

const KPI_ICON_MAP: Record<string, LucideIcon> = {
  "dollar-sign": DollarSign,
  dollar: DollarSign,
  revenue: DollarSign,
  package: Package,
  product: Package,
  users: Users,
  clients: Users,
  trending: TrendingUp,
};

const CHART_TYPE_LABELS: Record<AiReportChartType, string> = {
  bar: "Barras",
  line: "Linha",
  area: "Área",
  pie: "Pizza",
  donut: "Donut",
  horizontal_bar: "Ranking",
  heatmap: "Heatmap",
  table: "Tabela",
};

function formatKpiValue(value: string | number | null | undefined, format?: string): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return String(value ?? "—");

  if (format === "currency") {
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  }
  if (format === "percent") {
    return `${num.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  }
  return num.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function resolveKpiIcon(kpi: AiReportKpi): LucideIcon {
  const key = (kpi.icon ?? "").toLowerCase();
  if (key && KPI_ICON_MAP[key]) return KPI_ICON_MAP[key];
  if (kpi.format === "currency") return DollarSign;
  return TrendingUp;
}

function WidgetIcon({ chartType }: { chartType: AiReportChartType }) {
  if (chartType === "table") return <Table2 className="w-4 h-4" />;
  if (chartType === "line" || chartType === "area") return <TrendingUp className="w-4 h-4" />;
  if (chartType === "donut" || chartType === "pie") return <PieChartIcon className="w-4 h-4" />;
  return <BarChart3 className="w-4 h-4" />;
}

function AnimatedIn({
  index,
  children,
  className,
  style,
}: {
  index: number;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("ai-report-animate-in", className)}
      style={{ animationDelay: `${index * 75}ms`, ...style }}
    >
      {children}
    </div>
  );
}

function KpiCard({
  kpi,
  index,
  tokens,
}: {
  kpi: AiReportKpi;
  index: number;
  tokens: DashboardTokens;
}) {
  const Icon = resolveKpiIcon(kpi);
  const accent = KPI_ACCENTS[index % KPI_ACCENTS.length];
  const isDown = kpi.trend === "down" || (kpi.comparison_percent !== undefined && kpi.comparison_percent < 0);

  return (
    <AnimatedIn index={index}>
      <div className={cn("group relative overflow-hidden rounded-2xl border p-5 transition-all", tokens.card, tokens.cardHover)}>
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-40 transition-opacity group-hover:opacity-60"
          style={{ backgroundColor: accent.stroke }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={cn("text-[10px] font-bold uppercase tracking-[0.18em]", tokens.label)}>{kpi.label}</p>
            <p className={cn("mt-2 text-2xl font-bold tracking-tight tabular-nums", tokens.value)}>
              {formatKpiValue(kpi.value, kpi.format)}
            </p>
            {kpi.comparison_percent !== undefined ? (
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    isDown ? "bg-red-500/15 text-red-500" : "bg-emerald-500/15 text-emerald-600"
                  )}
                >
                  {isDown ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  {isDown ? "▼" : "▲"} {Math.abs(kpi.comparison_percent).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                </span>
                <span className={cn("text-[10px]", tokens.label)}>vs. período anterior</span>
              </div>
            ) : null}
          </div>
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: accent.icon, color: accent.stroke }}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <AiReportKpiSparkline kpi={kpi} color={accent.stroke} fill={accent.fill} />
      </div>
    </AnimatedIn>
  );
}

function WidgetCard({
  widget,
  placement,
  compact,
  widgetIndex,
  tokens,
  animateIndex,
}: {
  widget: AiReportWidget;
  placement?: { className: string; minHeight: number };
  compact: boolean;
  widgetIndex: number;
  tokens: DashboardTokens;
  animateIndex: number;
}) {
  const chartLabel = CHART_TYPE_LABELS[widget.chart_type] ?? widget.chart_type;
  const accent = KPI_ACCENTS[widgetIndex % KPI_ACCENTS.length];
  const layoutClass = placement?.className ?? getWidgetGridClass(widget, compact);

  return (
    <AnimatedIn
      index={animateIndex}
      className={layoutClass}
      style={{ minHeight: placement?.minHeight }}
    >
      <div
        className={cn(
          "group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border transition-all",
          tokens.card,
          tokens.cardHover
        )}
      >
        <div className={cn("flex items-start justify-between gap-3 border-b px-5 py-4", tokens.widgetHeaderBorder)}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: accent.icon, color: accent.stroke }}
              >
                <WidgetIcon chartType={widget.chart_type} />
              </span>
              <div className="min-w-0">
                <h3 className={cn("text-sm font-semibold uppercase tracking-wide truncate", tokens.title)}>
                  {widget.title}
                </h3>
                {widget.description ? (
                  <p className={cn("mt-0.5 text-xs line-clamp-2 leading-relaxed", tokens.subtitle)}>
                    {widget.description}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <span className={cn("shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider", tokens.pillMuted)}>
            {chartLabel}
          </span>
        </div>
        <div className="flex-1 min-w-0 overflow-hidden px-4 py-4 sm:px-5 sm:py-5">
          <AiReportChart
            definition={{
              title: widget.title,
              chart_type: widget.chart_type,
              x_key: widget.x_key,
              y_key: widget.y_key,
              series_key: widget.series_key,
              color: widget.color ?? accent.stroke,
            }}
            rows={widget.rows}
            compact={compact || widget.chart_type === "heatmap"}
            variant={tokens.chartVariant}
          />
        </div>
      </div>
    </AnimatedIn>
  );
}

export function AiReportDashboard({
  title,
  description,
  businessRules,
  dashboard,
  compact = false,
  insights = [],
  recommendations = [],
  filters = [],
  theme = "professional",
}: AiReportDashboardProps) {
  const { colorMode, mounted } = useAiReportAppearance();
  const tokens = getDashboardTokens(colorMode);
  const kpis = dashboard.kpis ?? [];
  const widgets = dashboard.widgets ?? [];

  const gridPlan = useMemo(() => buildGridLayoutPlan(widgets, compact), [widgets, compact]);

  const periodLabel =
    filters.find((f) => f.type === "date_range")?.label ?? filters[0]?.label ?? "Últimos 3 meses";

  const widgetAnimateOffset = kpis.length;

  if (!mounted) {
    return (
      <div
        className={cn("overflow-hidden rounded-2xl border min-h-[320px]", tokens.canvasBorder)}
        style={{ backgroundColor: tokens.canvas }}
      />
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border transition-colors duration-500",
        tokens.canvasBorder,
        compact ? "text-sm" : ""
      )}
      style={{ backgroundColor: tokens.canvas }}
    >
      {!compact ? (
        <AnimatedIn index={0}>
          <div className={cn("relative border-b px-6 py-5 sm:px-8", tokens.headerBorder)}>
            <div className={cn("pointer-events-none absolute inset-0", tokens.headerGlow)} />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-500">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.24em]">NeXora Executive BI</span>
                </div>
                <h2 className={cn("text-xl font-bold tracking-tight sm:text-2xl", tokens.title)}>{title}</h2>
                {description ? (
                  <p className={cn("text-sm leading-relaxed", tokens.subtitle)}>{description}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={cn("inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs", tokens.pill)}
                >
                  <Calendar className={cn("h-3.5 w-3.5", tokens.iconMuted)} />
                  {periodLabel}
                  <ChevronDown className={cn("h-3.5 w-3.5", tokens.iconMuted)} />
                </button>
                <span className={cn("rounded-xl border px-3 py-1.5 text-xs capitalize", tokens.pillMuted)}>
                  {theme}
                </span>
                <span className={cn("rounded-xl border px-3 py-1.5 text-xs font-medium", tokens.accentPill)}>
                  {widgets.length} blocos
                </span>
              </div>
            </div>
            {businessRules ? (
              <p className={cn("relative mt-4 border-t pt-4 text-xs leading-relaxed", tokens.headerBorder, tokens.subtitle)}>
                {businessRules}
              </p>
            ) : null}
          </div>
        </AnimatedIn>
      ) : (
        <div className={cn("flex items-center gap-2 border-b px-4 py-3", tokens.headerBorder)}>
          <LayoutDashboard className="h-4 w-4 shrink-0 text-indigo-500" />
          <span className={cn("text-sm font-semibold truncate flex-1", tokens.title)}>{title}</span>
        </div>
      )}

      <div className={cn("space-y-5", compact ? "p-4" : "p-6 sm:p-8")}>
        {kpis.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi, index) => (
              <KpiCard key={kpi.id} kpi={kpi} index={index + 1} tokens={tokens} />
            ))}
          </div>
        ) : null}

        <div
          className={cn(
            "grid grid-cols-1 gap-4 auto-rows-min",
            !compact && "lg:grid-cols-2"
          )}
        >
          {widgets.map((widget, index) => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              placement={gridPlan.placements.get(widget.id)}
              compact={compact}
              widgetIndex={index}
              tokens={tokens}
              animateIndex={widgetAnimateOffset + index + 1}
            />
          ))}
        </div>

        {insights.length > 0 ? (
          <AnimatedIn index={widgetAnimateOffset + widgets.length + 1}>
            <div className={cn("rounded-2xl border p-5", tokens.insightPanel)}>
              <div className="mb-4 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <h3 className={cn("text-xs font-bold uppercase tracking-[0.18em]", tokens.label)}>
                  Insights principais
                </h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {insights.map((insight, index) => (
                  <AnimatedIn key={index} index={index} className="h-full">
                    <div className={cn("flex h-full gap-3 rounded-xl border p-3.5 transition-colors", tokens.insightItem)}>
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                        style={{
                          backgroundColor: `${INSIGHT_ICONS[index % INSIGHT_ICONS.length]}22`,
                          color: INSIGHT_ICONS[index % INSIGHT_ICONS.length],
                        }}
                      >
                        {index + 1}
                      </span>
                      <p className={cn("text-xs leading-relaxed", tokens.subtitle)}>{insight}</p>
                    </div>
                  </AnimatedIn>
                ))}
              </div>
            </div>
          </AnimatedIn>
        ) : null}

        {recommendations.length > 0 ? (
          <AnimatedIn index={widgetAnimateOffset + widgets.length + 2}>
            <div className={cn("rounded-2xl border p-5", tokens.recoPanel)}>
              <div className="mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-500" />
                <h3 className={cn("text-xs font-bold uppercase tracking-[0.18em]", tokens.label)}>
                  Recomendações executivas
                </h3>
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {recommendations.map((item, index) => (
                  <AnimatedIn key={index} index={index}>
                    <li className={cn("flex gap-3 rounded-xl border px-4 py-3", tokens.recoItem)}>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-bold text-emerald-600">
                        {index + 1}
                      </span>
                      <span className={cn("text-sm leading-relaxed", tokens.subtitle)}>{item}</span>
                    </li>
                  </AnimatedIn>
                ))}
              </ul>
            </div>
          </AnimatedIn>
        ) : null}
      </div>
    </div>
  );
}
