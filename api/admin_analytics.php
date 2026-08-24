<?php

include_once __DIR__ . '/settings/includes.php';
include_once __DIR__ . '/cors.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    \Shared\Response::error('Método não permitido', 405)->send();
}

try {
    $request = new \Shared\Request();
    $authUser = \Shared\AuthGuard::requireAuth($request);
    \Shared\AuthGuard::requirePermission($authUser, 'users.read');

    $db = \Shared\Database::getInstance()->getConnection();
    $service = new \App\Services\AdminAnalyticsService($db);

    \Shared\Response::success($service->overview())->send();
} catch (Throwable $e) {
    \Shared\Logger::getInstance()->error('admin_analytics: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
    ]);
    \Shared\Response::error('Erro interno', 500)->send();
}
