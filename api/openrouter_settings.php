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

try {
    $controller = new \App\Controllers\OpenRouterSettingsController();
    $request = new \Shared\Request();
    $authUser = \Shared\AuthGuard::requireAuth($request);
    $method = $_SERVER['REQUEST_METHOD'];
    $action = (string) $request->getQueryParam('action', '');

    switch ($method) {
        case 'GET':
            $response = $controller->show();
            break;
        case 'PUT':
        case 'PATCH':
            \Shared\AuthGuard::requirePermission($authUser, 'users.write');
            $response = $controller->update($request, (int) $authUser['id']);
            break;
        case 'DELETE':
            \Shared\AuthGuard::requirePermission($authUser, 'users.write');
            $response = $controller->clear((int) $authUser['id']);
            break;
        case 'POST':
            if ($action !== 'test') {
                \Shared\Response::error('Ação inválida', 400)->send();
            }
            $response = $controller->test($request);
            break;
        default:
            \Shared\Response::error('Método não permitido', 405)->send();
            break;
    }

    $response->send();
} catch (Throwable $e) {
    \Shared\Logger::getInstance()->error('openrouter_settings: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
    ]);
    \Shared\Response::error('Erro interno', 500)->send();
}
