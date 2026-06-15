INSERT OR IGNORE INTO regions (name, code, created_at) VALUES
    ('Sul', 'SUL', datetime('now')),
    ('Sudeste', 'SE', datetime('now')),
    ('Nordeste', 'NE', datetime('now')),
    ('Centro-Oeste', 'CO', datetime('now')),
    ('Norte', 'N', datetime('now'));

INSERT OR IGNORE INTO products (name, category, unit_price, created_at) VALUES
    ('Licença SaaS Anual', 'commercial', 12000.00, datetime('now')),
    ('Consultoria BI', 'commercial', 8500.00, datetime('now')),
    ('Treinamento Power BI', 'commercial', 3200.00, datetime('now')),
    ('Suporte Premium', 'operations', 1800.00, datetime('now')),
    ('Implementação ERP', 'operations', 15000.00, datetime('now')),
    ('Campanha Digital', 'marketing', 4500.00, datetime('now')),
    ('SEO Mensal', 'marketing', 2200.00, datetime('now'));
