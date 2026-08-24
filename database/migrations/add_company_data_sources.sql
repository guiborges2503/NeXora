-- Fontes de dados da empresa contratante (banco via usuário ou API)
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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

SET FOREIGN_KEY_CHECKS = 1;
