INSERT OR IGNORE INTO roles (name, description, created_at)
VALUES
    ('admin', 'Acesso total ao sistema', datetime('now')),
    ('manager', 'Gerencia usuários e dashboards', datetime('now')),
    ('viewer', 'Acesso somente leitura', datetime('now'));

INSERT OR IGNORE INTO permissions (name, description, created_at)
VALUES
    ('users.read', 'Visualizar usuários', datetime('now')),
    ('users.write', 'Criar e editar usuários', datetime('now')),
    ('dashboards.read', 'Visualizar dashboards', datetime('now')),
    ('dashboards.write', 'Criar e editar dashboards', datetime('now')),
    ('alerts.read', 'Visualizar alertas', datetime('now')),
    ('audit.read', 'Visualizar trilhas de auditoria', datetime('now'));
