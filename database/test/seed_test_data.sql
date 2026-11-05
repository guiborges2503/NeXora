-- =============================================================================
-- NeXora — massa de dados FICTÍCIA para testes (Projeto P2 / TQS)
--
-- Executar depois de install_mysql.sql e scripts/seed_admin.sql.
-- Os dados são determinísticos (datas e valores fixos) para que os oráculos
-- dos casos de teste (CT-024, CT-025, CT-028) tenham sempre o mesmo resultado.
--
-- Usuários de teste (senha de todos: Teste@123) — dados fictícios:
--   admin.teste@nexora.local         Administrador  ativo
--   gestor.teste@nexora.local        Gestor         ativo
--   visualizador.teste@nexora.local  Visualizador   ativo
--   inativo.teste@nexora.local       Visualizador   INATIVO
--
-- Contagens esperadas após o seed:
--   regions = 5, products = 5, customers = 6, sales = 600,
--   dashboards = 2 (1 para todos os perfis, 1 apenas Administrador)
-- =============================================================================

SET NAMES utf8mb4;

-- Hash bcrypt de "Teste@123" (gerado com password_hash do PHP)
SET @pwd = '$2y$10$784Ew/H2obU17zwt1s.G7e1OW5/vJI.7ZgoG7yUmfS5JB/E3xIDve';
SET @now = '2026-01-15 10:00:00';

INSERT INTO users (name, email, password_hash, status, created_at, updated_at) VALUES
    ('Admin Teste',        'admin.teste@nexora.local',        @pwd, 'active',   @now, @now),
    ('Gestor Teste',       'gestor.teste@nexora.local',       @pwd, 'active',   @now, @now),
    ('Visualizador Teste', 'visualizador.teste@nexora.local', @pwd, 'active',   @now, @now),
    ('Inativo Teste',      'inativo.teste@nexora.local',      @pwd, 'inactive', @now, @now);

INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT u.id, r.id, @now
FROM users u
JOIN roles r ON r.name = CASE u.email
    WHEN 'admin.teste@nexora.local'        THEN 'admin'
    WHEN 'gestor.teste@nexora.local'       THEN 'manager'
    WHEN 'visualizador.teste@nexora.local' THEN 'viewer'
    WHEN 'inativo.teste@nexora.local'      THEN 'viewer'
END
WHERE u.email LIKE '%.teste@nexora.local';

-- -----------------------------------------------------------------------------
-- Dados de negócio (tabelas consultadas pela IA)
-- -----------------------------------------------------------------------------
INSERT INTO regions (id, name, code, created_at) VALUES
    (1, 'Sudeste', 'SE', @now),
    (2, 'Sul', 'SUL', @now),
    (3, 'Nordeste', 'NE', @now),
    (4, 'Centro-Oeste', 'CO', @now),
    (5, 'Norte', 'N', @now);

INSERT INTO products (id, name, category, unit_price, created_at) VALUES
    (1, 'Plano Analytics Pro',     'software', 890.00,  @now),
    (2, 'Consultoria de BI',       'servicos', 4500.00, @now),
    (3, 'Licença Dashboard Extra', 'software', 190.00,  @now),
    (4, 'Treinamento da equipe',   'servicos', 1200.00, @now),
    (5, 'Pacote Relatórios IA',    'software', 320.00,  @now);

INSERT INTO customers (id, name, segment, region_id, created_at) VALUES
    (1, 'Acme Indústria',    'industria',   1, @now),
    (2, 'Mercado Horizonte', 'varejo',      2, @now),
    (3, 'Clínica Aurora',    'saude',       3, @now),
    (4, 'Agro Campo Verde',  'agronegocio', 4, @now),
    (5, 'Logística Norte',   'logistica',   5, @now),
    (6, 'Tech Paulista',     'tecnologia',  1, @now);

-- 600 vendas determinísticas entre 01/01/2026 e 23/08/2026 (n = 1..600)
--   cliente  = ((n-1) % 6) + 1      produto = ((n-1) % 5) + 1
--   qtd      = ((n-1) % 4) + 1      data    = 2026-01-01 + ((n-1) % 235) dias
SET SESSION cte_max_recursion_depth = 1000;
INSERT INTO sales (sale_date, customer_id, product_id, region_id, quantity, unit_price, total_amount, seller_name, created_at)
WITH RECURSIVE seq (n) AS (
    SELECT 1
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 600
)
SELECT
    DATE_ADD('2026-01-01', INTERVAL ((s.n - 1) % 235) DAY),
    c.id,
    p.id,
    c.region_id,
    ((s.n - 1) % 4) + 1,
    p.unit_price,
    ROUND((((s.n - 1) % 4) + 1) * p.unit_price, 2),
    ELT(((s.n - 1) % 5) + 1, 'Ana Souza', 'Bruno Lima', 'Carla Nunes', 'Diego Alves', 'Elisa Prado'),
    @now
FROM seq s
JOIN customers c ON c.id = ((s.n - 1) % 6) + 1
JOIN products  p ON p.id = ((s.n - 1) % 5) + 1;

-- -----------------------------------------------------------------------------
-- Dashboards fictícios (link de incorporação fictício)
-- -----------------------------------------------------------------------------
INSERT INTO dashboards (id, name, description, owner_id, is_public, created_at, updated_at)
SELECT 1, 'Vendas Gerais (Teste)', 'Dashboard liberado para todos os perfis', u.id, 0, @now, @now
FROM users u WHERE u.email = 'admin.teste@nexora.local';

INSERT INTO dashboards (id, name, description, owner_id, is_public, created_at, updated_at)
SELECT 2, 'Financeiro Restrito (Teste)', 'Dashboard liberado apenas para Administradores', u.id, 0, @now, @now
FROM users u WHERE u.email = 'admin.teste@nexora.local';

INSERT INTO dashboard_meta (dashboard_id, embed_url, category, views_count, updated_at) VALUES
    (1, 'https://app.powerbi.com/view?r=FICTICIO-VENDAS-GERAIS', 'commercial', 0, @now),
    (2, 'https://app.powerbi.com/view?r=FICTICIO-FINANCEIRO',    'finance',    0, @now);

INSERT INTO dashboard_role_access (dashboard_id, role_id, granted_at)
SELECT 1, r.id, @now FROM roles r WHERE r.name IN ('admin', 'manager', 'viewer');

INSERT INTO dashboard_role_access (dashboard_id, role_id, granted_at)
SELECT 2, r.id, @now FROM roles r WHERE r.name = 'admin';
