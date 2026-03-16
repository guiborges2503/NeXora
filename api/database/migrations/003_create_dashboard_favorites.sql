CREATE TABLE IF NOT EXISTS dashboard_favorites (
    user_id INTEGER NOT NULL,
    dashboard_id INTEGER NOT NULL,
    favorited_at TEXT NOT NULL,
    PRIMARY KEY (user_id, dashboard_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dashboard_favorites_user_favorited_at
    ON dashboard_favorites (user_id, favorited_at DESC);
