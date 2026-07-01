import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { AiReportKpi } from "@/config/aiReportsApi";

function buildSparklinePoints(kpi: AiReportKpi): { i: number; v: number }[] {
  const base = Math.max(Number(kpi.value) || 1, 1);
  const delta = (kpi.comparison_percent ?? 8) / 100;
  const isDown = kpi.trend === "down" || (kpi.comparison_percent ?? 0) < 0;
  const trend = isDown ? -Math.abs(delta) : Math.abs(delta);

  return Array.from({ length: 12 }, (_, i) => {
    const t = i / 11;
    const wave = Math.sin(t * Math.PI * 1.2) * 0.04;
    const growth = 0.72 + t * 0.28 + trend * (t - 0.5) * 0.35;
    return { i, v: base * Math.max(0.55, growth + wave) };
  });
}

type AiReportKpiSparklineProps = {
  kpi: AiReportKpi;
  color: string;
  fill: string;
};

export function AiReportKpiSparkline({ kpi, color, fill }: AiReportKpiSparklineProps) {
  const data = buildSparklinePoints(kpi);
  const gradientId = `spark-${kpi.id}`;

  return (
    <div className="h-12 w-full mt-3 -mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
