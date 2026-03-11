<?php
/**
 * Endpoint: Health check - verifica se a API está online
 * Padrão Nortrek - GET /api/health.php
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
    $dbOk = false;
    $pdo = getConexaoDB1();
    if ($pdo) {
        $pdo->query('SELECT 1');
        $dbOk = true;
    }

    \Shared\Response::success([
        'status' => 'ok',
        'timestamp' => date('c'),
        'database' => $dbOk ? 'connected' : 'disconnected',
    ])->send();
} catch (Exception $e) {
    \Shared\Response::success([
        'status' => 'ok',
        'timestamp' => date('c'),
        'database' => 'disconnected',
        'message' => $e->getMessage(),
    ])->send();
}
