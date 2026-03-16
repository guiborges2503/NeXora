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
    $controller = new \App\Controllers\DashboardsController();
    $request = new \Shared\Request();
    $method = $_SERVER['REQUEST_METHOD'];
    $id = (int) ($request->getQueryParam('id', 0));

    switch ($method) {
        case 'GET':
            $response = $id > 0 ? $controller->show($id) : $controller->index();
            break;
        case 'POST':
            $response = $controller->store($request);
            break;
        case 'PUT':
            if ($id <= 0) {
                \Shared\Response::validationError(['id' => 'Parâmetro id é obrigatório'])->send();
            }
            $response = $controller->update($id, $request);
            break;
        case 'PATCH':
            if ($id <= 0) {
                \Shared\Response::validationError(['id' => 'Parâmetro id é obrigatório'])->send();
            }
            $action = (string) $request->getBodyParam('action', '');
            if ($action !== 'increment_view') {
                \Shared\Response::validationError(['action' => 'Ação PATCH inválida'])->send();
            }
            $response = $controller->incrementViews($id);
            break;
        case 'DELETE':
            if ($id <= 0) {
                \Shared\Response::validationError(['id' => 'Parâmetro id é obrigatório'])->send();
            }
            $response = $controller->destroy($id);
            break;
        default:
            \Shared\Response::error('Método não permitido', 405)->send();
            break;
    }

    $response->send();
} catch (Throwable $e) {
    \Shared\Logger::getInstance()->error('dashboards: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
    ]);
    \Shared\Response::error('Erro interno', 500)->send();
}
