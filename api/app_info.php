<?php
/**
 * Endpoint: Informações da aplicação
 * Padrão Nortrek - GET /api/app_info.php
 */
include_once __DIR__ . "/settings/includes.php";
include_once __DIR__ . "/cors.php";

header("Content-Type: application/json; charset=utf-8");
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    \Shared\Response::error('Método não permitido', 405)->send();
}

try {
    $version = defined('VERSION') ? VERSION : '1.0.0';
    $appName = defined('APP_NAME') ? APP_NAME : 'TCC';

    \Shared\Response::success([
        'app' => $appName,
        'version' => $version,
        'environment' => getEnvironment(),
    ])->send();
} catch (Exception $e) {
    \Shared\Logger::getInstance()->error('app_info: ' . $e->getMessage());
    \Shared\Response::error('Erro ao buscar informações', 500)->send();
}
