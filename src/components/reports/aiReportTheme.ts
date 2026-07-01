export const EXECUTIVE_THEME = {
  canvas: "#0b0e14",
  card: "#12182a",
  cardElevated: "#161e32",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(255,255,255,0.1)",
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  textDim: "#64748b",
} as const;

export const LIGHT_THEME = {
  canvas: "#f4f7fb",
  card: "#ffffff",
  cardElevated: "#ffffff",
  border: "rgba(15,23,42,0.08)",
  borderHover: "rgba(15,23,42,0.14)",
  text: "#0f172a",
  textMuted: "#64748b",
  textDim: "#94a3b8",
} as const;

export type DashboardColorMode = "dark" | "light";

export type DashboardTokens = {
  canvas: string;
  canvasBorder: string;
  card: string;
  cardHover: string;
  headerBorder: string;
  headerGlow: string;
  title: string;
  subtitle: string;
  label: string;
  value: string;
  pill: string;
  pillMuted: string;
  accentPill: string;
  widgetHeaderBorder: string;
  insightPanel: string;
  insightItem: string;
  recoPanel: string;
  recoItem: string;
  iconMuted: string;
  chartVariant: "light" | "executive";
};

export function getDashboardTokens(mode: DashboardColorMode): DashboardTokens {
  if (mode === "light") {
    return {
      canvas: LIGHT_THEME.canvas,
      canvasBorder: "border-slate-200/90 shadow-xl shadow-slate-300/25",
      card: "bg-white border-slate-200/90 shadow-md shadow-slate-200/40",
      cardHover: "hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50",
      headerBorder: "border-slate-200/80",
      headerGlow: "bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.1),transparent_55%)]",
      title: "text-slate-900",
      subtitle: "text-slate-500",
      label: "text-slate-500",
      value: "text-slate-900",
      pill: "border-slate-200 bg-white text-slate-600 shadow-sm",
      pillMuted: "border-slate-200 bg-slate-50 text-slate-500",
      accentPill: "border-blue-200 bg-blue-50 text-blue-700",
      widgetHeaderBorder: "border-slate-100",
      insightPanel: "border-slate-200 bg-white shadow-sm",
      insightItem: "border-slate-200 bg-slate-50 hover:bg-white hover:shadow-sm",
      recoPanel: "border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white shadow-sm",
      recoItem: "border-slate-200 bg-white",
      iconMuted: "text-slate-400",
      chartVariant: "light",
    };
  }

  return {
    canvas: EXECUTIVE_THEME.canvas,
    canvasBorder: "border-white/[0.06] shadow-2xl shadow-black/40",
    card: "bg-[#12182a] border-white/[0.06] shadow-lg shadow-black/20",
    cardHover: "hover:border-white/10 hover:shadow-xl hover:shadow-black/30",
    headerBorder: "border-white/[0.06]",
    headerGlow: "bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.12),transparent_50%)]",
    title: "text-slate-50",
    subtitle: "text-slate-400",
    label: "text-slate-500",
    value: "text-slate-50",
    pill: "border-white/[0.08] bg-white/[0.04] text-slate-300",
    pillMuted: "border-white/[0.08] bg-white/[0.04] text-slate-400",
    accentPill: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
    widgetHeaderBorder: "border-white/[0.05]",
    insightPanel: "border-white/[0.06] bg-[#12182a]",
    insightItem: "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04]",
    recoPanel: "border-emerald-500/10 bg-gradient-to-br from-emerald-500/[0.06] to-transparent",
    recoItem: "border-white/[0.05] bg-[#12182a]/80",
    iconMuted: "text-slate-500",
    chartVariant: "executive",
  };
}

export const AI_REPORT_APPEARANCE_KEY = "nexora-ai-report-color-mode";

export const KPI_ACCENTS = [
  { stroke: "#a855f7", fill: "rgba(168,85,247,0.15)", icon: "rgba(168,85,247,0.2)" },
  { stroke: "#3b82f6", fill: "rgba(59,130,246,0.15)", icon: "rgba(59,130,246,0.2)" },
  { stroke: "#14b8a6", fill: "rgba(20,184,166,0.15)", icon: "rgba(20,184,166,0.2)" },
  { stroke: "#f97316", fill: "rgba(249,115,22,0.15)", icon: "rgba(249,115,22,0.2)" },
  { stroke: "#ec4899", fill: "rgba(236,72,153,0.15)", icon: "rgba(236,72,153,0.2)" },
  { stroke: "#eab308", fill: "rgba(234,179,8,0.15)", icon: "rgba(234,179,8,0.2)" },
] as const;

export const CHART_NEON_PALETTE = [
  "#a855f7",
  "#3b82f6",
  "#14b8a6",
  "#f97316",
  "#eab308",
  "#ec4899",
  "#6366f1",
  "#22d3ee",
];

export const INSIGHT_ICONS = ["#a855f7", "#3b82f6", "#14b8a6", "#f97316", "#ec4899"] as const;
