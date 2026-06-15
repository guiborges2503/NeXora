<?php
/**
 * Configuração centralizada da aplicação TCC - Backend
 *
 * Este arquivo contém todas as URLs e configurações necessárias para o funcionamento
 * da aplicação backend, permitindo fácil alteração entre ambientes
 */

function getEnvironment()
{
    $host = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? 'localhost';

    if (strpos($host, 'localhost') !== false || strpos($host, '127.0.0.1') !== false) {
        return 'development';
    }

    if (strpos($host, '192.168.') !== false || strpos($host, '10.') !== false) {
        return 'development';
    }

    return 'production';
}

$environment = getEnvironment();

if ($environment === 'development') {
    define('FRONTEND_BASE_URL', 'http://127.0.0.1:5173');
    define('CORS_ALLOWED_ORIGINS', [
        'http://127.0.0.1:5173',
        'http://localhost:5173',
        'http://127.0.0.1:5174',
        'http://localhost:5174',
        'http://localhost:3000',
    ]);
    define('CORS_FALLBACK_ORIGIN', 'http://127.0.0.1:5173');
    define('DEBUG_MODE', true);
} else {
    define('FRONTEND_BASE_URL', 'https://tcc.example.com');
    define('CORS_ALLOWED_ORIGINS', [
        'https://tcc.example.com',
        'https://www.tcc.example.com',
    ]);
    define('CORS_FALLBACK_ORIGIN', 'https://tcc.example.com');
    define('DEBUG_MODE', false);
}

define('APP_NAME', 'TCC');
define('APP_VERSION', '1.0.0');
define('API_TIMEOUT', 10000);

function debugLog($message)
{
    if (DEBUG_MODE) {
        error_log("[DEBUG] " . $message);
    }
}

if (DEBUG_MODE) {
    debugLog("Configuração carregada para ambiente: $environment");
    debugLog("Frontend URL: " . FRONTEND_BASE_URL);
}
