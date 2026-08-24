-- Perfis, permissões e admin do NeXora
-- phpMyAdmin → u314950627_nexora → SQL → Executar
-- Depois saia e entre de novo: admin@nexora.local / admin123

SET NAMES utf8mb4;

INSERT INTO roles (name, description, created_at)
SELECT 'admin', 'Acesso total ao sistema', NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin');

INSERT INTO roles (name, description, created_at)
SELECT 'manager', 'Gerencia usuários e dashboards', NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'manager');

INSERT INTO roles (name, description, created_at)
SELECT 'viewer', 'Acesso somente leitura', NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'viewer');

INSERT INTO permissions (name, description, created_at)
SELECT 'users.read', 'Listar usuários', NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'users.read');

INSERT INTO permissions (name, description, created_at)
SELECT 'users.write', 'Criar e editar usuários', NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'users.write');

INSERT INTO permissions (name, description, created_at)
SELECT 'dashboards.read', 'Ver dashboards e relatórios', NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'dashboards.read');

INSERT INTO permissions (name, description, created_at)
SELECT 'dashboards.write', 'Criar e editar dashboards', NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'dashboards.write');

INSERT INTO permissions (name, description, created_at)
SELECT 'alerts.read', 'Ver alertas', NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'alerts.read');

INSERT INTO permissions (name, description, created_at)
SELECT 'audit.read', 'Ver logs de auditoria', NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'audit.read');

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_at)
SELECT r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_at)
SELECT r.id, p.id, NOW()
FROM roles r
JOIN permissions p ON p.name IN (
    'users.read',
    'users.write',
    'dashboards.read',
    'dashboards.write',
    'alerts.read',
    'audit.read'
)
WHERE r.name = 'manager';

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_at)
SELECT r.id, p.id, NOW()
FROM roles r
JOIN permissions p ON p.name IN (
    'dashboards.read',
    'alerts.read'
)
WHERE r.name = 'viewer';

INSERT INTO users (name, email, password_hash, status, created_at, updated_at)
VALUES (
    'Administrador',
    'admin@nexora.local',
    '$2y$10$KXcG.CN9Eugk.19UJzMg7OwElZCaZzcSgwVIApaKNA/D94FaMtDye',
    'active',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = 'Administrador',
    password_hash = VALUES(password_hash),
    status = 'active',
    updated_at = NOW();

DELETE ur FROM user_roles ur
JOIN users u ON u.id = ur.user_id
WHERE u.email = 'admin@nexora.local';

INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT u.id, r.id, NOW()
FROM users u
JOIN roles r ON r.name = 'admin'
WHERE u.email = 'admin@nexora.local';
