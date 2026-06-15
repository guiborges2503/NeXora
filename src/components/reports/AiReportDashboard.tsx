import { BarChart3, LayoutDashboard, Table2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AiReportChart } from "@/components/reports/AiReportChart";
import type { AiReportDashboardData, AiReportKpi, AiReportWidget } from "@/config/aiReportsApi";
import { cn } from "@/components/ui/utils";

type AiReportDashboardProps = {
  title: string;
  description?: string;
  businessRules?: string;
  dashboard: AiReportDashboardData;
  compact?: boolean;
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

function WidgetIcon({ chartType }: { chartType: AiReportWidget["chart_type"] }) {
  if (chartType === "table") return <Table2 className="w-4 h-4" />;
  if (chartType === "line") return <TrendingUp className="w-4 h-4" />;
  return <BarChart3 className="w-4 h-4" />;
}

export function AiReportDashboard({
  title,
  description,
  businessRules,
  dashboard,
  compact = false,
}: AiReportDashboardProps) {
  const kpis = dashboard.kpis ?? [];
  const widgets = dashboard.widgets ?? [];

  return (
    <div className="space-y-6">
      {!compact ? (
        <div className="rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-200">
                <LayoutDashboard className="w-4 h-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Painel IA NeXora</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h2>
              {description ? <p className="text-sm text-slate-200 max-w-3xl">{description}</p> : null}
            </div>
            <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/10">
              {widgets.length} visualizações
            </Badge>
          </div>
          {businessRules ? (
            <p className="mt-4 text-xs text-slate-300 border-t border-white/10 pt-4">{businessRules}</p>
          ) : null}
        </div>
      ) : null}

      {kpis.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((kpi: AiReportKpi) => (
            <Card key={kpi.id} className="border-border/70 shadow-sm">
              <CardContent className="pt-6">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">
                  {formatKpiValue(kpi.value, kpi.format)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {widgets.map((widget) => (
          <Card
            key={widget.id}
            className={cn(
              "overflow-hidden border-border/70 shadow-sm",
              widget.span === "full" && "xl:col-span-2"
            )}
          >
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <WidgetIcon chartType={widget.chart_type} />
                    {widget.title}
                  </CardTitle>
                  {widget.description ? (
                    <CardDescription className="mt-1">{widget.description}</CardDescription>
                  ) : null}
                </div>
                <Badge variant="outline" className="capitalize shrink-0">
                  {widget.chart_type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <AiReportChart
                definition={{
                  title: widget.title,
                  chart_type: widget.chart_type,
                  x_key: widget.x_key,
                  y_key: widget.y_key,
                  color: widget.color,
                }}
                rows={widget.rows}
                compact={widget.chart_type !== "table"}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
