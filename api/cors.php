<?php
/**
 * Configuração CORS - Padrão Nortrek
 * Incluir no início de cada endpoint
 */
require_once __DIR__ . '/settings/app_config.php';

function setCorsHeaders()
{
    $allowedOrigins = CORS_ALLOWED_ORIGINS;
    $fallbackOrigin = CORS_FALLBACK_ORIGIN;
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (DEBUG_MODE) {
        error_log("[CORS DEBUG] Origin: " . $origin);
    }

    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header("Access-Control-Allow-Origin: $fallbackOrigin");
    }

    header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, PATCH, DELETE");
    header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Max-Age: 86400");

    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}
