CREATE TABLE IF NOT EXISTS dashboard_meta (
    dashboard_id INTEGER PRIMARY KEY,
    embed_url TEXT,
    category TEXT NOT NULL DEFAULT 'other',
    views_count INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dashboard_role_access (
    dashboard_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    granted_at TEXT NOT NULL,
    PRIMARY KEY (dashboard_id, role_id),
    FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
