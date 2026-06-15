CREATE TABLE IF NOT EXISTS ai_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'commercial',
    chart_type TEXT NOT NULL DEFAULT 'bar',
    sql_query TEXT NOT NULL,
    x_key TEXT,
    y_key TEXT,
    definition_json TEXT NOT NULL,
    prompt_summary TEXT,
    is_public INTEGER NOT NULL DEFAULT 0,
    views_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_report_role_access (
    report_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    granted_at TEXT NOT NULL,
    PRIMARY KEY (report_id, role_id),
    FOREIGN KEY (report_id) REFERENCES ai_reports(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_reports_owner_id ON ai_reports(owner_id);
