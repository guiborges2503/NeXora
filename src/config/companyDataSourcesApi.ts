import { apiDelete, apiGet, apiPost, apiPut } from "@/config/api";

export type DataSourceConnectionType = "database" | "api";
export type DataSourceDbDriver = "mysql" | "pgsql" | "sqlsrv";
export type DataSourceApiAuth = "none" | "bearer" | "api_key" | "basic";

export type CompanyDataSource = {
  id: number;
  name: string;
  connection_type: DataSourceConnectionType;
  is_active: boolean;
  is_default: boolean;
  db_driver: DataSourceDbDriver;
  db_host: string;
  db_port: string;
  db_name: string;
  db_user: string;
  db_ssl: boolean;
  db_charset: string;
  api_base_url: string;
  api_auth_type: DataSourceApiAuth;
  api_key_header: string;
  api_username: string;
  api_test_path: string;
  last_tested_at: string | null;
  last_test_ok: boolean | null;
  last_test_message: string | null;
  created_at: string;
  updated_at: string;
  updated_by: number | null;
  has_db_password: boolean;
  has_api_token: boolean;
  has_api_password: boolean;
  db_password_masked?: string;
  api_token_masked?: string;
  api_password_masked?: string;
};

export type CompanyDataSourcePayload = {
  name: string;
  connection_type: DataSourceConnectionType;
  is_active: boolean;
  is_default: boolean;
  db_driver: DataSourceDbDriver;
  db_host: string;
  db_port: string;
  db_name: string;
  db_user: string;
  db_password?: string;
  keep_db_password?: boolean;
  db_ssl: boolean;
  db_charset?: string;
  api_base_url: string;
  api_auth_type: DataSourceApiAuth;
  api_token?: string;
  keep_api_token?: boolean;
  api_key_header: string;
  api_username: string;
  api_password?: string;
  keep_api_password?: boolean;
  api_test_path: string;
};

export type CompanyDataSourceListResponse = {
  items: CompanyDataSource[];
  count: number;
};

export type CompanyDataSourceTestResponse = {
  ok: boolean;
  message: string;
  driver?: string | null;
  table_count?: number | null;
  url?: string | null;
  status?: number | null;
};

const BASE = "/company_data_sources.php";

export async function fetchCompanyDataSources(): Promise<CompanyDataSourceListResponse> {
  return apiGet<CompanyDataSourceListResponse>(BASE);
}

export async function createCompanyDataSource(
  payload: CompanyDataSourcePayload
): Promise<CompanyDataSource> {
  return apiPost<CompanyDataSource, CompanyDataSourcePayload>(BASE, payload);
}

export async function updateCompanyDataSource(
  id: number,
  payload: CompanyDataSourcePayload
): Promise<CompanyDataSource> {
  return apiPut<CompanyDataSource, CompanyDataSourcePayload>(`${BASE}?id=${id}`, payload);
}

export async function deleteCompanyDataSource(id: number): Promise<void> {
  await apiDelete<{ id: number }>(`${BASE}?id=${id}`);
}

export async function setDefaultCompanyDataSource(id: number): Promise<CompanyDataSource> {
  return apiPost<CompanyDataSource, Record<string, never>>(`${BASE}?action=set_default&id=${id}`, {});
}

export async function testCompanyDataSource(
  payload: Partial<CompanyDataSourcePayload> & { id?: number }
): Promise<CompanyDataSourceTestResponse> {
  return apiPost<CompanyDataSourceTestResponse, typeof payload>(`${BASE}?action=test`, payload);
}
