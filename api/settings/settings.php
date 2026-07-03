<?php
/**
 * Configurações do banco de dados e aplicação - NeXora
 *
 * Banco: SEMPRE produção Hostinger (u276379167_nexora).
 * Não há banco MySQL local no WAMP.
 *
 * - Hostinger (site publicado): DB_HOST = localhost
 * - PC (npm run dev): DB_HOST = DB_REMOTE_HOST (MySQL remoto da Hostinger)
 *
 * Painel Hostinger → Bancos de dados → MySQL remoto → habilite seu IP e copie o host.
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
define('DB_NAME', 'u276379167_nexora');
define('DB_USER', 'u276379167_nexora');
define('DB_PASS', getenv('DB_PASS') ?: "c\$2+iaxy3F#");
define('DB_TARGET', 'production');

// MySQL remoto Hostinger (npm run dev no PC)
// Painel → Bancos de dados → MySQL remoto → libere o IP do PC (ou Any Host %)
define('DB_REMOTE_HOST', getenv('DB_REMOTE_HOST') ?: 'auth-db746.hstgr.io');

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
