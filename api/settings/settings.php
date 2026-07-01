<?php
/**
 * Configurações do banco de dados e aplicação - TCC
 *
 * Para produção, use variáveis de ambiente ou um arquivo .env
 * Nunca commite credenciais reais no repositório
 */

define('PAGE_TITULO', 'TCC');
define('COPYRIGHT', 'TCC©');
define('VERSION', '1.0.0');
define('NOME_APP', 'tcc');

define('SESSAO', 'TCC');
define('NAME_SESSION', 'tcc_web');

// Banco de dados — MySQL (Hostinger / WAMP)
define('DB_DRIVER', getenv('DB_DRIVER') ?: 'mysql');
define('DB_CHARSET', 'utf8mb4');

define('DB_NAME', getenv('DB_NAME') ?: 'nexora');
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_PORT', getenv('DB_PORT') ?: '3306');

// JWT — altere JWT_SECRET em produção
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'nexora-dev-secret-change-in-production');
define('JWT_TTL_SECONDS', (int) (getenv('JWT_TTL_SECONDS') ?: 86400));

// URL pública do front (links em e-mails; ex.: http://localhost:5173)
define('FRONTEND_PUBLIC_URL', getenv('FRONTEND_PUBLIC_URL') ?: FRONTEND_BASE_URL);

// E-mail — recuperação de senha (defina MAIL_SMTP_HOST para envio via SMTP)
define('MAIL_SMTP_HOST', getenv('MAIL_SMTP_HOST') ?: '');
define('MAIL_SMTP_PORT', (int) (getenv('MAIL_SMTP_PORT') ?: 587));
define('MAIL_SMTP_USER', getenv('MAIL_SMTP_USER') ?: '');
define('MAIL_SMTP_PASS', getenv('MAIL_SMTP_PASS') ?: '');
define('MAIL_SMTP_ENCRYPTION', strtolower(getenv('MAIL_SMTP_ENCRYPTION') ?: 'tls'));
define('MAIL_FROM_ADDRESS', getenv('MAIL_FROM_ADDRESS') ?: 'noreply@nexora.local');
define('MAIL_FROM_NAME', getenv('MAIL_FROM_NAME') ?: 'NeXora');

// OpenRouter — geração de relatórios IA no backend
define('OPENROUTER_API_KEY', getenv('OPENROUTER_API_KEY') ?: '');
define('OPENROUTER_DEFAULT_MODEL', getenv('OPENROUTER_DEFAULT_MODEL') ?: 'openai/gpt-4o-mini');
define('AI_REPORT_MAX_ROWS', (int) (getenv('AI_REPORT_MAX_ROWS') ?: 500));

$openRouterSslVerifyEnv = getenv('OPENROUTER_SSL_VERIFY');
if ($openRouterSslVerifyEnv !== false && $openRouterSslVerifyEnv !== '') {
    define('OPENROUTER_SSL_VERIFY', filter_var($openRouterSslVerifyEnv, FILTER_VALIDATE_BOOLEAN));
} else {
    // WAMP/local costuma falhar sem CA bundle — em DEBUG_MODE não exige certificado
    define('OPENROUTER_SSL_VERIFY', !(defined('DEBUG_MODE') && DEBUG_MODE));
}
