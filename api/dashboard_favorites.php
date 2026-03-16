<?php

include_once __DIR__ . '/settings/includes.php';
include_once __DIR__ . '/cors.php';

header('Content-Type: application/json; charset=utf-8');
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $controller = new \App\Controllers\DashboardFavoritesController();
    $request = new \Shared\Request();
    $method = $_SERVER['REQUEST_METHOD'];
    $userId = (int) $request->getQueryParam('user_id', 0);
    $dashboardId = (int) $request->getQueryParam('dashboard_id', 0);

    switch ($method) {
        case 'GET':
            $response = $controller->index($userId);
            break;
        case 'POST':
            $response = $controller->store($request);
            break;
        case 'DELETE':
            $response = $controller->destroy($userId, $dashboardId);
            break;
        default:
            \Shared\Response::error('Método não permitido', 405)->send();
            break;
    }

    $response->send();
} catch (Throwable $e) {
    \Shared\Logger::getInstance()->error('dashboard_favorites: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
    ]);
    \Shared\Response::error('Erro interno', 500)->send();
}
