<?php
/**
 * Configurações do banco de dados e aplicação - NeXora
 *
 * Banco: MySQL da Hostinger (não usa MySQL do WAMP).
 *
 * - Hostinger (site publicado): DB_HOST = localhost
 * - PC / WAMP: DB_HOST = DB_REMOTE_HOST (hostname do painel MySQL remoto)
 */

define('PAGE_TITULO', 'TCC');
define('COPYRIGHT', 'TCC©');
define('VERSION', '1.0.0');
define('NOME_APP', 'tcc');

define('SESSAO', 'TCC');
define('NAME_SESSION', 'tcc_web');

// ---------------------------------------------------------------------------
// Banco de dados — MySQL Hostinger (produção)
// ---------------------------------------------------------------------------
define('DB_DRIVER', 'mysql');
define('DB_CHARSET', 'utf8mb4');
define('DB_PORT', '3306');
define('DB_NAME', 'u314950627_nexora');
define('DB_USER', 'u314950627_nexora');
define('DB_PASS', getenv('DB_PASS') ?: 'qBnGx|gdH7$N');
define('DB_TARGET', 'production');

// Hostname remoto (hPanel → MySQL remoto). Não use auth-db antigo de outra conta.
define('DB_REMOTE_HOST', getenv('DB_REMOTE_HOST') ?: 'srv806.hstgr.io');

$appEnvironment = function_exists('getEnvironment') ? getEnvironment() : 'production';
define('DB_HOST', $appEnvironment === 'production' ? 'localhost' : DB_REMOTE_HOST);

// ---------------------------------------------------------------------------
// Demais configurações (podem usar api/.env como override opcional)
// ---------------------------------------------------------------------------

define('JWT_SECRET', getenv('JWT_SECRET') ?: 'nexora-dev-secret-change-in-production');
define('JWT_TTL_SECONDS', (int) (getenv('JWT_TTL_SECONDS') ?: 86400));
define('FRONTEND_PUBLIC_URL', getenv('FRONTEND_PUBLIC_URL') ?: FRONTEND_BASE_URL);

define('MAIL_SMTP_HOST', getenv('MAIL_SMTP_HOST') ?: '');
define('MAIL_SMTP_PORT', (int) (getenv('MAIL_SMTP_PORT') ?: 587));
define('MAIL_SMTP_USER', getenv('MAIL_SMTP_USER') ?: '');
define('MAIL_SMTP_PASS', getenv('MAIL_SMTP_PASS') ?: '');
define('MAIL_SMTP_ENCRYPTION', strtolower(getenv('MAIL_SMTP_ENCRYPTION') ?: 'tls'));
define('MAIL_FROM_ADDRESS', getenv('MAIL_FROM_ADDRESS') ?: 'noreply@nexora.local');
define('MAIL_FROM_NAME', getenv('MAIL_FROM_NAME') ?: 'NeXora');

define('OPENROUTER_API_KEY', getenv('OPENROUTER_API_KEY') ?: '');
define('OPENROUTER_DEFAULT_MODEL', getenv('OPENROUTER_DEFAULT_MODEL') ?: 'openai/gpt-4o-mini');
define('AI_REPORT_MAX_ROWS', (int) (getenv('AI_REPORT_MAX_ROWS') ?: 500));

$openRouterSslVerifyEnv = getenv('OPENROUTER_SSL_VERIFY');
if ($openRouterSslVerifyEnv !== false && $openRouterSslVerifyEnv !== '') {
    define('OPENROUTER_SSL_VERIFY', filter_var($openRouterSslVerifyEnv, FILTER_VALIDATE_BOOLEAN));
} else {
    define('OPENROUTER_SSL_VERIFY', !(defined('DEBUG_MODE') && DEBUG_MODE));
}
