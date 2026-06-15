import {
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AiReportDefinition } from "@/config/aiReportsApi";

const PIE_COLORS = ["#2563eb", "#16a34a", "#ea580c", "#9333ea", "#0891b2", "#ca8a04"];

type AiReportChartProps = {
  definition: Pick<AiReportDefinition, "chart_type" | "x_key" | "y_key" | "title"> & {
    chart_type?: "bar" | "line" | "pie" | "table";
    color?: string;
  };
  rows: Record<string, string | number | null>[];
  compact?: boolean;
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
  if (Math.abs(value) >= 1000) {
    return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  }
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number; name?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;

  return (
    <div className="rounded-lg border bg-background/95 px-3 py-2 shadow-md text-sm">
      {label ? <p className="font-medium text-foreground mb-1">{label}</p> : null}
      <p className="text-muted-foreground">
        {payload[0]?.name ?? "Valor"}:{" "}
        <span className="font-semibold text-foreground tabular-nums">{formatTooltipValue(Number(value))}</span>
      </p>
    </div>
  );
}

export function AiReportChart({ definition, rows, compact = false }: AiReportChartProps) {
  const { chart_type = "bar", x_key, y_key, title, color } = definition;
  const chartHeight = compact ? "h-[320px]" : "h-[420px]";
  const primaryColor = color || "#2563eb";

  if (chart_type === "table" || !x_key) {
    const columns =
      rows.length > 0
        ? Object.keys(rows[0])
        : [x_key, y_key].filter(Boolean);

    return (
      <div className="space-y-3">
        {!compact ? <h3 className="font-semibold">{title}</h3> : null}
        <div className="rounded-lg border overflow-auto max-h-[420px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {columns.map((column) => (
                  <TableHead key={column} className="font-semibold">
                    {column.replace(/_/g, " ")}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  {columns.map((column) => (
                    <TableCell key={`${index}-${column}`} className="tabular-nums">
                      {toLabel(row[column])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  const chartData = rows.map((row) => ({
    label: toLabel(row[x_key]),
    value: toNumber(row[y_key]),
  }));

  if (chart_type === "pie") {
    return (
      <div className={`${chartHeight} w-full`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={compact ? 50 : 70}
              outerRadius={compact ? 100 : 130}
              paddingAngle={2}
              label={({ name, percent }) =>
                `${name}: ${((percent ?? 0) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
              }
            >
              {chartData.map((_, index) => (
                <Cell
                  key={index}
                  fill={color ? primaryColor : PIE_COLORS[index % PIE_COLORS.length]}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart_type === "line") {
    return (
      <div className={`${chartHeight} w-full`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatTooltipValue(Number(v))} />
            <Tooltip content={<ChartTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke={primaryColor}
              strokeWidth={3}
              dot={{ r: 4, fill: primaryColor, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
              name={y_key?.replace(/_/g, " ") || "Valor"}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={`${chartHeight} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatTooltipValue(Number(v))} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.35 }} />
          <Legend />
          <Bar
            dataKey="value"
            fill={primaryColor}
            name={y_key?.replace(/_/g, " ") || "Valor"}
            radius={[8, 8, 0, 0]}
            maxBarSize={56}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
