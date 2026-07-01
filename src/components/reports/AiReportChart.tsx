import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Fragment } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AiReportChartType } from "@/config/aiReportsApi";
import { CHART_NEON_PALETTE } from "@/components/reports/aiReportTheme";
import { cn } from "@/components/ui/utils";

export const CHART_PALETTE = CHART_NEON_PALETTE;

type AiReportChartProps = {
  definition: {
    title?: string;
    chart_type?: AiReportChartType;
    x_key?: string;
    y_key?: string;
    series_key?: string;
    color?: string;
  };
  rows: Record<string, string | number | null>[];
  compact?: boolean;
  variant?: "light" | "executive";
};

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return 0;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toLabel(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function formatTooltipValue(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return value.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  }
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function formatColumnLabel(column: string): string {
  return column.replace(/_/g, " ");
}

function isPercentColumn(column: string): boolean {
  const c = column.toLowerCase();
  return c.includes("particip") || c.includes("percent") || c.includes("margem") || c === "%";
}

function isNameColumn(column: string): boolean {
  const c = column.toLowerCase();
  return (
    c.includes("nome") ||
    c.includes("name") ||
    c.includes("cliente") ||
    c.includes("vendedor") ||
    c.includes("seller") ||
    c === "produto"
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function chartAxisColors(variant: "light" | "executive") {
  if (variant === "executive") {
    return {
      grid: "rgba(255,255,255,0.06)",
      tick: "#64748b",
      cursor: "rgba(255,255,255,0.06)",
    };
  }
  return {
    grid: "hsl(var(--border))",
    tick: "hsl(var(--muted-foreground))",
    cursor: "hsl(var(--muted))",
  };
}

function ChartTooltip({
  active,
  payload,
  label,
  variant,
}: {
  active?: boolean;
  payload?: { value?: number; name?: string }[];
  label?: string;
  variant: "light" | "executive";
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;

  return (
    <div
      className={cn(
        "rounded-xl px-3 py-2.5 shadow-2xl text-sm border",
        variant === "executive"
          ? "bg-[#1a2238]/95 border-white/10 text-slate-100 backdrop-blur-md"
          : "bg-background/95 border-border/60 backdrop-blur-sm"
      )}
    >
      {label ? <p className="font-medium mb-1 opacity-90">{label}</p> : null}
      <p className={variant === "executive" ? "text-slate-400" : "text-muted-foreground"}>
        {payload[0]?.name ?? "Valor"}:{" "}
        <span className="font-semibold tabular-nums">{formatTooltipValue(Number(value))}</span>
      </p>
    </div>
  );
}

function ChartShell({
  children,
  heightClass,
}: {
  children: React.ReactNode;
  heightClass: string;
}) {
  return <div className={cn(heightClass, "w-full min-w-0 overflow-hidden")}>{children}</div>;
}

function PremiumTable({
  rows,
  columns,
  compact,
  variant,
  title,
}: {
  rows: Record<string, string | number | null>[];
  columns: string[];
  compact: boolean;
  variant: "light" | "executive";
  title?: string;
}) {
  const showRank = /top|ranking/i.test(title ?? "");
  const numericMax = new Map<string, number>();

  for (const col of columns) {
    if (isPercentColumn(col)) continue;
    numericMax.set(col, Math.max(...rows.map((r) => toNumber(r[col])), 1));
  }

  const isExecutive = variant === "executive";
  const nameText = isExecutive ? "text-slate-200" : "text-slate-800";
  const valueText = isExecutive ? "text-slate-200" : "text-slate-900";
  const mutedText = isExecutive ? "text-slate-400" : "text-slate-500";
  const cellText = isExecutive ? "text-slate-300" : "text-slate-700";
  const progressTrack = isExecutive ? "bg-white/5" : "bg-slate-100";
  const rankDefault = isExecutive ? "bg-white/5 text-slate-500" : "bg-slate-100 text-slate-500";
  const rankTop = isExecutive ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700";
  const avatarBg = isExecutive
    ? "bg-gradient-to-br from-blue-500/30 to-violet-500/30 text-slate-200"
    : "bg-gradient-to-br from-blue-100 to-violet-100 text-blue-700";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border",
        isExecutive ? "border-white/[0.06] bg-[#0d1220]/50" : "border-border/50"
      )}
    >
      <div className={cn("overflow-auto", compact ? "max-h-[300px]" : "max-h-[400px]")}>
        <Table>
          <TableHeader>
            <TableRow
              className={cn(
                "border-b hover:bg-transparent",
                isExecutive ? "border-white/[0.06] bg-white/[0.02]" : "bg-muted/50"
              )}
            >
              {showRank ? (
                <TableHead className="w-10 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  #
                </TableHead>
              ) : null}
              {columns.map((column) => (
                <TableHead
                  key={column}
                  className="text-[10px] font-semibold uppercase tracking-widest text-slate-500"
                >
                  {formatColumnLabel(column)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={index}
                className={cn(
                  "border-b transition-colors",
                  isExecutive ? "border-white/[0.04] hover:bg-white/[0.03]" : ""
                )}
              >
                {showRank ? (
                  <TableCell className="py-3">
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold",
                        index < 3 ? rankTop : rankDefault
                      )}
                    >
                      {index + 1}
                    </span>
                  </TableCell>
                ) : null}
                {columns.map((column) => {
                  const raw = row[column];
                  const num = toNumber(raw);
                  const label = toLabel(raw);

                  if (isNameColumn(column)) {
                    return (
                      <TableCell key={column} className="py-3">
                        <div className="flex items-center gap-2.5">
                          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold", avatarBg)}>
                            {initials(label)}
                          </span>
                          <span className={cn("text-sm font-medium", nameText)}>{label}</span>
                        </div>
                      </TableCell>
                    );
                  }

                  if (isPercentColumn(column)) {
                    const pct = Math.min(100, Math.max(0, num));
                    return (
                      <TableCell key={column} className="py-3 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-1.5 flex-1 rounded-full overflow-hidden", progressTrack)}>
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={cn("text-xs tabular-nums w-10 text-right", mutedText)}>
                            {pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                          </span>
                        </div>
                      </TableCell>
                    );
                  }

                  if (numericMax.has(column) && num > 0) {
                    const max = numericMax.get(column) ?? num;
                    const pct = (num / max) * 100;
                    const isCurrency = num > 100;
                    return (
                      <TableCell key={column} className="py-3">
                        <div className="space-y-1">
                          <span className={cn("text-sm font-semibold tabular-nums", valueText)}>
                            {isCurrency
                              ? num.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                  maximumFractionDigits: 0,
                                })
                              : formatTooltipValue(num)}
                          </span>
                          <div className={cn("h-1 w-full max-w-[100px] rounded-full overflow-hidden", progressTrack)}>
                            <div className="h-full rounded-full bg-blue-500/70" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell key={column} className={cn("tabular-nums text-sm py-3", cellText)}>
                      {label}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function formatHeatmapValue(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`;
  }
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

function heatmapIntensity(value: number, min: number, max: number): number {
  if (max <= min) return value > 0 ? 0.65 : 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function heatmapCellStyle(
  intensity: number,
  variant: "light" | "executive"
): { backgroundColor: string; color: string; fontWeight: number } {
  const t = intensity;

  if (variant === "light") {
    const saturation = 52 + t * 38;
    const lightness = 97 - t * 50;
    const useLightText = t >= 0.5;
    return {
      backgroundColor: `hsl(234, ${saturation}%, ${lightness}%)`,
      color: useLightText ? "#ffffff" : "#0f172a",
      fontWeight: t >= 0.35 ? 600 : 500,
    };
  }

  const useLightText = t >= 0.38;
  return {
    backgroundColor: `hsl(234, ${48 + t * 28}%, ${22 + t * 28}%)`,
    color: useLightText ? "#f8fafc" : "#cbd5e1",
    fontWeight: t >= 0.3 ? 600 : 500,
  };
}

function HeatmapView({
  rows,
  xKey,
  yKey,
  seriesKey,
  compact,
  variant,
}: {
  rows: Record<string, string | number | null>[];
  xKey: string;
  yKey: string;
  seriesKey?: string;
  compact: boolean;
  variant: "light" | "executive";
}) {
  const isLight = variant === "light";
  const headerRowClass = isLight
    ? "bg-slate-100 text-slate-700 border-slate-200"
    : "bg-[#0f1524] text-slate-200 border-white/[0.08]";
  const headerColClass = isLight
    ? "bg-slate-50 text-slate-600 border-slate-200"
    : "bg-[#12182a] text-slate-400 border-white/[0.06]";
  const borderCell = isLight ? "border-slate-200/80" : "border-white/[0.06]";

  if (seriesKey && rows.some((row) => row[seriesKey] !== undefined)) {
    const rowLabels = Array.from(new Set(rows.map((r) => toLabel(r[xKey]))));
    const colLabels = Array.from(new Set(rows.map((r) => toLabel(r[seriesKey]))));
    const matrix = new Map<string, number>();

    for (const row of rows) {
      matrix.set(`${toLabel(row[xKey])}::${toLabel(row[seriesKey])}`, toNumber(row[yKey]));
    }

    const allValues = Array.from(matrix.values()).filter((v) => v > 0);
    const max = Math.max(...allValues, 1);
    const min = Math.min(...allValues, 0);

    return (
      <div
        className={cn(
          "overflow-auto rounded-xl border",
          isLight ? "border-slate-200 bg-white" : "border-white/[0.06] bg-[#0d1220]/40",
          compact ? "max-h-[300px]" : "max-h-[400px]"
        )}
      >
        <div
          className="grid min-w-full text-xs"
          style={{
            gridTemplateColumns: `minmax(96px, 120px) repeat(${colLabels.length}, minmax(72px, 1fr))`,
          }}
        >
          <div className={cn("sticky left-0 z-10 p-2.5 border-b border-r font-medium", headerRowClass)} />
          {colLabels.map((col) => (
            <div
              key={col}
              className={cn(
                "p-2.5 text-center border-b font-semibold text-[11px] uppercase tracking-wide truncate",
                headerColClass
              )}
              title={col}
            >
              {col}
            </div>
          ))}
          {rowLabels.map((rowLabel) => (
            <Fragment key={rowLabel}>
              <div
                className={cn(
                  "sticky left-0 z-10 p-2.5 border-r border-b font-semibold text-[11px] truncate",
                  headerRowClass
                )}
                title={rowLabel}
              >
                {rowLabel}
              </div>
              {colLabels.map((colLabel) => {
                const value = matrix.get(`${rowLabel}::${colLabel}`) ?? 0;
                const intensity = heatmapIntensity(value, min, max);
                const cellStyle = heatmapCellStyle(intensity, variant);

                return (
                  <div
                    key={`${rowLabel}-${colLabel}`}
                    className={cn(
                      "flex min-h-[44px] items-center justify-center border-b px-1.5 py-2 text-center tabular-nums text-[11px] sm:text-xs transition-colors",
                      borderCell
                    )}
                    style={{
                      backgroundColor: cellStyle.backgroundColor,
                      color: cellStyle.color,
                      fontWeight: cellStyle.fontWeight,
                    }}
                    title={`${rowLabel} · ${colLabel}: ${formatHeatmapValue(value)}`}
                  >
                    {value > 0 ? formatHeatmapValue(value) : "—"}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    );
  }

  const cells = rows.map((row) => ({
    label: toLabel(row[xKey]),
    value: toNumber(row[yKey]),
  }));
  const max = Math.max(...cells.map((c) => c.value), 1);
  const min = Math.min(...cells.map((c) => c.value), 0);

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${Math.min(cells.length, compact ? 4 : 6)}, minmax(0, 1fr))` }}
    >
      {cells.map((cell, index) => {
        const intensity = heatmapIntensity(cell.value, min, max);
        const cellStyle = heatmapCellStyle(intensity, variant);

        return (
          <div
            key={`${cell.label}-${index}`}
            className={cn(
              "rounded-xl border p-3 text-center",
              isLight ? "border-slate-200" : "border-white/[0.06]"
            )}
            style={{
              backgroundColor: cellStyle.backgroundColor,
              color: cellStyle.color,
            }}
          >
            <p
              className="text-[10px] uppercase tracking-widest truncate opacity-80"
              style={{ color: cellStyle.color }}
            >
              {cell.label}
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums" style={{ color: cellStyle.color }}>
              {formatHeatmapValue(cell.value)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function AiReportChart({
  definition,
  rows,
  compact = false,
  variant = "executive",
}: AiReportChartProps) {
  const { chart_type = "bar", x_key, y_key, series_key, title, color } = definition;
  const chartHeight = compact ? "h-[260px]" : "h-[340px]";
  const primaryColor = color || CHART_PALETTE[0];
  const gradientId = `area-${title?.replace(/\s/g, "-") ?? "chart"}`;
  const axis = chartAxisColors(variant);
  const tooltip = <ChartTooltip variant={variant} />;

  if (chart_type === "table" || !x_key) {
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [x_key, y_key].filter(Boolean);
    return <PremiumTable rows={rows} columns={columns} compact={compact} variant={variant} title={title} />;
  }

  if (chart_type === "heatmap") {
    return (
      <HeatmapView
        rows={rows}
        xKey={x_key}
        yKey={y_key ?? x_key}
        seriesKey={series_key}
        compact={compact}
        variant={variant}
      />
    );
  }

  const chartData = rows.map((row) => ({
    label: toLabel(row[x_key]),
    value: toNumber(y_key ? row[y_key] : row[Object.keys(row).find((k) => k !== x_key) ?? ""]),
  }));

  if (chart_type === "donut" || chart_type === "pie") {
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    const isDonut = chart_type === "donut";

    return (
      <ChartShell heightClass={chartHeight}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={isDonut ? (compact ? 62 : 82) : 0}
              outerRadius={compact ? 100 : 128}
              paddingAngle={3}
              stroke="#12182a"
              strokeWidth={2}
              label={
                isDonut
                  ? ({ cx = 0, cy = 0 }) => (
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={cx} y={cy - 10} fill="#64748b" fontSize={10}>
                          Total
                        </tspan>
                        <tspan x={cx} y={cy + 12} fill="#f1f5f9" fontSize={14} fontWeight={600}>
                          {formatTooltipValue(total)}
                        </tspan>
                      </text>
                    )
                  : false
              }
            >
              {chartData.map((_, index) => (
                <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip content={tooltip} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} layout="vertical" align="right" verticalAlign="middle" />
          </PieChart>
        </ResponsiveContainer>
      </ChartShell>
    );
  }

  if (chart_type === "area" || chart_type === "line") {
    const ChartComponent = chart_type === "area" ? AreaChart : LineChart;
    return (
      <ChartShell heightClass={chartHeight}>
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={chartData} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primaryColor} stopOpacity={0.5} />
                <stop offset="100%" stopColor={primaryColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={axis.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: axis.tick }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: axis.tick }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatTooltipValue(Number(v))}
              width={52}
            />
            <Tooltip content={tooltip} />
            {chart_type === "area" ? (
              <Area
                type="monotone"
                dataKey="value"
                stroke={primaryColor}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                name={y_key ? formatColumnLabel(y_key) : "Valor"}
                dot={{ r: 4, fill: primaryColor, strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: "#12182a", strokeWidth: 2 }}
              />
            ) : (
              <Line
                type="monotone"
                dataKey="value"
                stroke={primaryColor}
                strokeWidth={2.5}
                dot={{ r: 4, fill: primaryColor, strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: "#12182a", strokeWidth: 2 }}
                name={y_key ? formatColumnLabel(y_key) : "Valor"}
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </ChartShell>
    );
  }

  if (chart_type === "horizontal_bar") {
    return (
      <ChartShell heightClass={chartHeight}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 28, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={axis.grid} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: axis.tick }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatTooltipValue(Number(v))}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={100}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={tooltip} cursor={{ fill: axis.cursor, opacity: 1 }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22} name={y_key ? formatColumnLabel(y_key) : "Valor"}>
              {chartData.map((_, index) => (
                <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>
    );
  }

  return (
    <ChartShell heightClass={chartHeight}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={axis.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: axis.tick }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: axis.tick }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatTooltipValue(Number(v))}
            width={52}
          />
          <Tooltip content={tooltip} cursor={{ fill: axis.cursor, opacity: 1 }} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={52} name={y_key ? formatColumnLabel(y_key) : "Valor"}>
            {chartData.map((_, index) => (
              <Cell
                key={index}
                fill={index === chartData.length - 1 ? primaryColor : CHART_PALETTE[index % CHART_PALETTE.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
