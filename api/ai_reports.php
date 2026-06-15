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
    $controller = new \App\Controllers\AiReportsController();
    $request = new \Shared\Request();
    $authUser = \Shared\AuthGuard::requireAuth($request);
    $userId = (int) $authUser['id'];
    $userRole = (string) ($authUser['role'] ?? 'viewer');
    $method = $_SERVER['REQUEST_METHOD'];
    $id = (int) ($request->getQueryParam('id', 0));
    $action = (string) $request->getBodyParam('action', $request->getQueryParam('action', ''));

    switch ($method) {
        case 'GET':
            \Shared\AuthGuard::requirePermission($authUser, 'dashboards.read');
            $response = $id > 0 ? $controller->show($id, $userId, $userRole) : $controller->index($userId, $userRole);
            break;
        case 'POST':
            if ($action === 'generate') {
                $response = $controller->generate($request);
            } elseif ($action === 'execute') {
                $response = $controller->executePreview($request);
            } else {
                $response = $controller->store($request, $userId);
            }
            break;
        case 'PUT':
            if ($id <= 0) {
                \Shared\Response::validationError(['id' => 'Parâmetro id é obrigatório'])->send();
            }
            $body = $request->getBody();
            if (is_array($body['definition'] ?? null)) {
                $response = $controller->update($id, $request, $userId, $userRole);
            } else {
                $response = $controller->updateSharing($id, $request, $userId, $userRole);
            }
            break;
        case 'PATCH':
            \Shared\AuthGuard::requirePermission($authUser, 'dashboards.read');
            if ($id <= 0) {
                \Shared\Response::validationError(['id' => 'Parâmetro id é obrigatório'])->send();
            }
            if ($action !== 'increment_view') {
                \Shared\Response::validationError(['action' => 'Ação PATCH inválida'])->send();
            }
            $response = $controller->incrementViews($id, $userId, $userRole);
            break;
        case 'DELETE':
            if ($id <= 0) {
                \Shared\Response::validationError(['id' => 'Parâmetro id é obrigatório'])->send();
            }
            $response = $controller->destroy($id, $userId, $userRole);
            break;
        default:
            \Shared\Response::error('Método não permitido', 405)->send();
            break;
    }

    $response->send();
} catch (Throwable $e) {
    \Shared\Logger::getInstance()->error('ai_reports: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
    ]);
    \Shared\Response::error('Erro interno', 500)->send();
}
