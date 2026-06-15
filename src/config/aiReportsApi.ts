import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/config/api";
import { getOpenRouterSettings } from "@/config/openRouter";

export type AiReportDefinition = {
  layout?: "dashboard";
  title: string;
  description: string;
  category: string;
  chart_type?: "bar" | "line" | "pie" | "table" | "dashboard";
  sql?: string;
  x_key?: string;
  y_key?: string;
  business_rules?: string;
  widget_count?: number;
  kpis?: AiReportKpiDefinition[];
  widgets?: AiReportWidgetDefinition[];
};

export type AiReportKpiDefinition = {
  id: string;
  label: string;
  sql: string;
  value_key?: string;
  format?: "currency" | "number" | "percent" | string;
};

export type AiReportWidgetDefinition = {
  id: string;
  title: string;
  description?: string;
  chart_type: "bar" | "line" | "pie" | "table";
  sql: string;
  x_key: string;
  y_key: string;
  span?: "half" | "full";
  color?: string;
};

export type AiReportKpi = {
  id: string;
  label: string;
  format?: string;
  value: string | number | null;
};

export type AiReportWidget = AiReportWidgetDefinition & {
  rows: Record<string, string | number | null>[];
};

export type AiReportDashboardData = {
  kpis: AiReportKpi[];
  widgets: AiReportWidget[];
};

export type AiReportListItem = {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  owner_name: string;
  category: string;
  chart_type: string;
  is_public: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  report_type: "ai_report";
  allowed_roles?: string[];
};

export type AiReportDetail = {
  report: {
    id: number;
    owner_id: number;
    owner_name: string;
    title: string;
    description: string;
    category: string;
    chart_type: string;
    x_key: string;
    y_key: string;
    prompt_summary?: string;
    is_public: number;
    views_count: number;
    created_at: string;
    updated_at: string;
    allowed_roles?: string[];
  };
  dashboard: AiReportDashboardData;
  definition?: AiReportDefinition;
  rows: Record<string, string | number | null>[];
};

export type AiReportPreviewResponse = {
  definition: AiReportDefinition;
  dashboard: AiReportDashboardData;
  rows: Record<string, string | number | null>[];
};

export async function fetchAiReports(): Promise<AiReportListItem[]> {
  const rows = await apiGet<AiReportListItem[]>("/ai_reports.php");
  return Array.isArray(rows) ? rows : [];
}

export async function fetchAiReport(id: number): Promise<AiReportDetail> {
  return apiGet<AiReportDetail>(`/ai_reports.php?id=${encodeURIComponent(String(id))}`);
}

export async function generateAiReportPreview(
  prompt: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<AiReportPreviewResponse> {
  const settings = getOpenRouterSettings();
  return apiPost<
    AiReportPreviewResponse,
    {
      action: "generate";
      prompt: string;
      messages: { role: "user" | "assistant"; content: string }[];
      api_key?: string;
      model?: string;
    }
  >("/ai_reports.php", {
    action: "generate",
    prompt,
    messages,
    api_key: settings.apiKey || undefined,
    model: settings.defaultModel || undefined,
  });
}

export async function saveAiReport(payload: {
  definition: AiReportDefinition;
  prompt_summary?: string;
  is_public: boolean;
  allowed_roles: string[];
}): Promise<AiReportListItem> {
  return apiPost<AiReportListItem, typeof payload>("/ai_reports.php", payload);
}

export async function updateAiReport(
  id: number,
  payload: {
    definition: AiReportDefinition;
    prompt_summary?: string;
    is_public?: boolean;
    allowed_roles?: string[];
  }
): Promise<AiReportListItem> {
  return apiPut<AiReportListItem, typeof payload>(`/ai_reports.php?id=${id}`, payload);
}

export async function executeAiReportPreview(payload: {
  definition: AiReportDefinition;
  prompt_summary?: string;
}): Promise<{ dashboard: AiReportDashboardData; definition: AiReportDefinition }> {
  return apiPost<
    { dashboard: AiReportDashboardData; definition: AiReportDefinition },
    { action: "execute"; definition: AiReportDefinition; prompt_summary?: string }
  >("/ai_reports.php", {
    action: "execute",
    ...payload,
  });
}

export async function updateAiReportSharing(
  id: number,
  payload: { is_public: boolean; allowed_roles: string[] }
): Promise<AiReportListItem> {
  return apiPut<AiReportListItem, typeof payload>(`/ai_reports.php?id=${id}`, payload);
}

export async function deleteAiReport(id: number): Promise<void> {
  await apiDelete<never>(`/ai_reports.php?id=${encodeURIComponent(String(id))}`);
}

export async function incrementAiReportView(id: number): Promise<void> {
  await apiPatch<unknown, { action: "increment_view" }>(
    `/ai_reports.php?id=${encodeURIComponent(String(id))}`,
    { action: "increment_view" }
  );
}
