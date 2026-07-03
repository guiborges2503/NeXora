-- Adiciona tabela de configuração OpenRouter (instalações existentes)
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS openrouter_settings (
    id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
    api_key VARCHAR(512) NOT NULL DEFAULT '',
    default_model VARCHAR(128) NOT NULL DEFAULT 'anthropic/claude-sonnet-4.6',
    updated_at DATETIME NOT NULL,
    updated_by INT NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Nunca commitar chaves reais: configure a api_key pela tela Configurações > OpenRouter.
INSERT IGNORE INTO openrouter_settings (id, api_key, default_model, updated_at)
VALUES (1, '', 'anthropic/claude-sonnet-4.6', NOW());

SET FOREIGN_KEY_CHECKS = 1;
