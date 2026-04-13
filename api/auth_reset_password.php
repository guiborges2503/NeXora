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

try {
    $controller = new \App\Controllers\AuthController();
    $response = $controller->resetPassword(new \Shared\Request());
    $response->send();
} catch (Throwable $e) {
    \Shared\Logger::getInstance()->error('auth_reset_password: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
    ]);
    \Shared\Response::error('Erro interno', 500)->send();
}
