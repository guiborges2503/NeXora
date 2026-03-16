<?php

include_once __DIR__ . '/settings/includes.php';
include_once __DIR__ . '/cors.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    \Shared\Response::error('Método não permitido', 405)->send();
}

$hostHeader = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
$host = explode(':', $hostHeader)[0];
$isLocalHost = in_array($host, ['localhost', '127.0.0.1', '::1', '[::1]'], true);
$isHttps = (
    (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
    strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https' ||
    strtolower((string) ($_SERVER['REQUEST_SCHEME'] ?? '')) === 'https'
);

if (!$isLocalHost && !$isHttps) {
    \Shared\Response::error('Login permitido apenas via HTTPS em produção', 400)->send();
}

try {
    $controller = new \App\Controllers\AuthController();
    $response = $controller->login(new \Shared\Request());
    $response->send();
} catch (Throwable $e) {
    \Shared\Logger::getInstance()->error('auth_login: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
    ]);
    \Shared\Response::error('Erro interno', 500)->send();
}
