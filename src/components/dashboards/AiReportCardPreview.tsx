import { memo, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, Loader2 } from "lucide-react";
import {
  fetchAiReportCardPreview,
  type AiReportDashboardData,
  type AiReportWidget,
} from "@/config/aiReportsApi";
import { CHART_NEON_PALETTE } from "@/components/reports/aiReportTheme";
import { cn } from "@/components/ui/utils";

type AiReportCardPreviewProps = {
  reportId: number;
  className?: string;
};

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return 0;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatKpi(value: string | number | null | undefined, format?: string): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "—";
  if (format === "currency") {
    if (Math.abs(num) >= 1_000_000) return `R$ ${(num / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`;
    if (Math.abs(num) >= 1_000) return `R$ ${(num / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}k`;
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  }
  if (format === "percent") return `${num.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`;
  if (Math.abs(num) >= 1_000) return num.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  return num.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

function buildChartData(widget: AiReportWidget) {
  return widget.rows.map((row) => ({
    label: String(row[widget.x_key] ?? ""),
    value: toNumber(widget.y_key ? row[widget.y_key] : row[Object.keys(row).find((k) => k !== widget.x_key) ?? ""]),
  }));
}

function MiniWidgetChart({ widget }: { widget: AiReportWidget }) {
  const data = useMemo(() => buildChartData(widget), [widget]);
  const chartType = widget.chart_type;

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Sem dados
      </div>
    );
  }

  if (chartType === "pie" || chartType === "donut") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={chartType === "donut" ? 22 : 0}
            outerRadius={36}
            paddingAngle={2}
            stroke="transparent"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={CHART_NEON_PALETTE[index % CHART_NEON_PALETTE.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "table") {
    const columns = Object.keys(widget.rows[0] ?? {}).slice(0, 3);
    return (
      <div className="flex h-full flex-col justify-center gap-1 px-2">
        {widget.rows.slice(0, 4).map((row, index) => (
          <div key={index} className="flex gap-2 text-[9px] text-muted-foreground">
            {columns.map((col) => (
              <span key={col} className="flex-1 truncate tabular-nums">
                {String(row[col] ?? "")}
              </span>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (chartType === "heatmap") {
    const values = data.map((d) => d.value);
    const max = Math.max(...values, 1);
    return (
      <div className="grid h-full grid-cols-4 gap-1 p-2">
        {values.slice(0, 8).map((value, index) => {
          const t = value / max;
          return (
            <div
              key={index}
              className="rounded-sm"
              style={{
                backgroundColor: `hsl(234, ${52 + t * 38}%, ${97 - t * 50}%)`,
              }}
            />
          );
        })}
      </div>
    );
  }

  const useBars = chartType === "bar" || chartType === "horizontal_bar";

  if (useBars) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <Bar dataKey="value" radius={[3, 3, 0, 0]} fill={CHART_NEON_PALETTE[0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id={`card-preview-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_NEON_PALETTE[0]} stopOpacity={0.45} />
            <stop offset="100%" stopColor={CHART_NEON_PALETTE[0]} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={CHART_NEON_PALETTE[0]}
          strokeWidth={2}
          fill={`url(#card-preview-${widget.id})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function PreviewContent({ dashboard }: { dashboard: AiReportDashboardData }) {
  const kpis = dashboard.kpis.slice(0, 3);
  const primaryWidget = dashboard.widgets[0];
  const secondaryWidget = dashboard.widgets[1];

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      {kpis.length > 0 ? (
        <div className="grid grid-cols-3 gap-1.5">
          {kpis.map((kpi) => (
            <div
              key={kpi.id}
              className="rounded-md border border-border/60 bg-background/80 px-1.5 py-1 text-center shadow-sm"
            >
              <p className="truncate text-[8px] uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
              <p className="truncate text-[10px] font-semibold tabular-nums text-foreground">
                {formatKpi(kpi.value, kpi.format)}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
        {primaryWidget ? (
          <div className="min-h-0 rounded-md border border-border/50 bg-background/60 p-1">
            <MiniWidgetChart widget={primaryWidget} />
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/20">
            <BarChart3 className="h-5 w-5 text-muted-foreground/50" />
          </div>
        )}
        {secondaryWidget ? (
          <div className="min-h-0 rounded-md border border-border/50 bg-background/60 p-1">
            <MiniWidgetChart widget={secondaryWidget} />
          </div>
        ) : primaryWidget ? (
          <div className="rounded-md border border-border/40 bg-muted/15" />
        ) : null}
      </div>
    </div>
  );
}

export const AiReportCardPreview = memo(function AiReportCardPreview({
  reportId,
  className,
}: AiReportCardPreviewProps) {
  const [dashboard, setDashboard] = useState<AiReportDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setHasError(false);

    void fetchAiReportCardPreview(reportId)
      .then((data) => {
        if (!mounted) return;
        setDashboard(data.dashboard);
      })
      .catch(() => {
        if (!mounted) return;
        setHasError(true);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [reportId]);

  return (
    <div
      className={cn(
        "relative h-44 w-full overflow-hidden border-b border-border/60 bg-gradient-to-br from-slate-50 via-background to-slate-100 dark:from-slate-900/80 dark:via-background dark:to-slate-950/60",
        className
      )}
    >
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : hasError || !dashboard ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <BarChart3 className="h-8 w-8 opacity-40" />
          <span className="text-xs">Prévia indisponível</span>
        </div>
      ) : (
        <PreviewContent dashboard={dashboard} />
      )}
    </div>
  );
});
