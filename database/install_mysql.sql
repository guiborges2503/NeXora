-- =============================================================================
-- NeXora — criação de todas as tabelas MySQL
--
-- Uso: importar no phpMyAdmin (aba Importar)
--
-- Para reinstalar do zero, descomente o bloco DROP TABLE abaixo.
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

/*
DROP TABLE IF EXISTS ai_report_role_access;
DROP TABLE IF EXISTS ai_reports;
DROP TABLE IF EXISTS company_data_sources;
DROP TABLE IF EXISTS openrouter_settings;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS regions;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS ai_conversations;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS dashboard_favorites;
DROP TABLE IF EXISTS dashboard_role_access;
DROP TABLE IF EXISTS dashboard_meta;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS alert_settings;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS dashboards;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS migrations;
*/

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at DATETIME NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    granted_at DATETIME NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dashboards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    owner_id INT NOT NULL,
    is_public TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    level VARCHAR(50) NOT NULL DEFAULT 'info',
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS alert_settings (
    id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
    notify_email TINYINT(1) NOT NULL DEFAULT 1,
    notify_in_app TINYINT(1) NOT NULL DEFAULT 1,
    sales_drop_enabled TINYINT(1) NOT NULL DEFAULT 1,
    sales_drop_percent DECIMAL(6,2) NOT NULL DEFAULT 15.00,
    stock_low_enabled TINYINT(1) NOT NULL DEFAULT 1,
    stock_low_qty INT NOT NULL DEFAULT 10,
    inactive_customers_enabled TINYINT(1) NOT NULL DEFAULT 1,
    inactive_days INT NOT NULL DEFAULT 30,
    finance_goal_enabled TINYINT(1) NOT NULL DEFAULT 0,
    finance_goal_percent DECIMAL(6,2) NOT NULL DEFAULT 80.00,
    updated_at DATETIME NOT NULL,
    updated_by INT NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO alert_settings (id, updated_at) VALUES (1, NOW());

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NULL,
    metadata TEXT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    applied_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dashboard_meta (
    dashboard_id INT PRIMARY KEY,
    embed_url TEXT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'other',
    views_count INT NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dashboard_role_access (
    dashboard_id INT NOT NULL,
    role_id INT NOT NULL,
    granted_at DATETIME NOT NULL,
    PRIMARY KEY (dashboard_id, role_id),
    FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dashboard_favorites (
    user_id INT NOT NULL,
    dashboard_id INT NOT NULL,
    favorited_at DATETIME NOT NULL,
    PRIMARY KEY (user_id, dashboard_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_dashboard_favorites_user_favorited_at
    ON dashboard_favorites (user_id, favorited_at DESC);

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INT PRIMARY KEY,
    first_name VARCHAR(255) NULL,
    last_name VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    job_title VARCHAR(255) NULL,
    avatar_url TEXT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT '',
    messages_json LONGTEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_ai_conversations_user_updated ON ai_conversations (user_id, updated_at);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

CREATE TABLE IF NOT EXISTS regions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'other',
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    segment VARCHAR(100) NOT NULL DEFAULT 'geral',
    region_id INT NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_date DATE NOT NULL,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    region_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    seller_name VARCHAR(255) NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_sales_sale_date ON sales(sale_date);
CREATE INDEX idx_sales_region_id ON sales(region_id);
CREATE INDEX idx_sales_product_id ON sales(product_id);
CREATE INDEX idx_customers_region_id ON customers(region_id);

CREATE TABLE IF NOT EXISTS ai_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'commercial',
    chart_type VARCHAR(50) NOT NULL DEFAULT 'bar',
    sql_query LONGTEXT NOT NULL,
    x_key VARCHAR(100) NULL,
    y_key VARCHAR(100) NULL,
    definition_json LONGTEXT NOT NULL,
    prompt_summary TEXT NULL,
    is_public TINYINT(1) NOT NULL DEFAULT 0,
    views_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_report_role_access (
    report_id INT NOT NULL,
    role_id INT NOT NULL,
    granted_at DATETIME NOT NULL,
    PRIMARY KEY (report_id, role_id),
    FOREIGN KEY (report_id) REFERENCES ai_reports(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS openrouter_settings (
    id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
    api_key VARCHAR(512) NOT NULL DEFAULT '',
    default_model VARCHAR(128) NOT NULL DEFAULT 'openai/gpt-4o-mini',
    updated_at DATETIME NOT NULL,
    updated_by INT NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO openrouter_settings (id, api_key, default_model, updated_at)
VALUES (1, '', 'openai/gpt-4o-mini', NOW());

CREATE TABLE IF NOT EXISTS company_data_sources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    connection_type VARCHAR(20) NOT NULL DEFAULT 'database',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    db_driver VARCHAR(20) NOT NULL DEFAULT 'mysql',
    db_host VARCHAR(255) NOT NULL DEFAULT '',
    db_port VARCHAR(10) NOT NULL DEFAULT '3306',
    db_name VARCHAR(255) NOT NULL DEFAULT '',
    db_user VARCHAR(255) NOT NULL DEFAULT '',
    db_password TEXT NULL,
    db_ssl TINYINT(1) NOT NULL DEFAULT 0,
    db_charset VARCHAR(32) NOT NULL DEFAULT 'utf8mb4',
    api_base_url TEXT NULL,
    api_auth_type VARCHAR(20) NOT NULL DEFAULT 'bearer',
    api_token TEXT NULL,
    api_key_header VARCHAR(100) NOT NULL DEFAULT 'X-API-Key',
    api_username VARCHAR(255) NOT NULL DEFAULT '',
    api_password TEXT NULL,
    api_test_path VARCHAR(255) NOT NULL DEFAULT '',
    last_tested_at DATETIME NULL,
    last_test_ok TINYINT(1) NULL,
    last_test_message VARCHAR(500) NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    updated_by INT NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_company_data_sources_default ON company_data_sources (is_default, is_active);

CREATE INDEX idx_ai_reports_owner_id ON ai_reports(owner_id);

SET FOREIGN_KEY_CHECKS = 1;
