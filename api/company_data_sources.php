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
    $controller = new \App\Controllers\CompanyDataSourcesController();
    $request = new \Shared\Request();
    $authUser = \Shared\AuthGuard::requireAuth($request);
    $method = $_SERVER['REQUEST_METHOD'];
    $action = (string) $request->getQueryParam('action', '');
    $id = (int) $request->getQueryParam('id', 0);

    switch ($method) {
        case 'GET':
            $response = $id > 0 ? $controller->show($id) : $controller->index();
            break;
        case 'POST':
            \Shared\AuthGuard::requirePermission($authUser, 'users.write');
            if ($action === 'test') {
                $response = $controller->test($request);
            } elseif ($action === 'set_default') {
                if ($id <= 0) {
                    \Shared\Response::error('Informe o id da fonte', 400)->send();
                }
                $response = $controller->setDefault($id);
            } else {
                $response = $controller->store($request, (int) $authUser['id']);
            }
            break;
        case 'PUT':
        case 'PATCH':
            \Shared\AuthGuard::requirePermission($authUser, 'users.write');
            if ($id <= 0) {
                \Shared\Response::error('Informe o id da fonte', 400)->send();
            }
            $response = $controller->update($id, $request, (int) $authUser['id']);
            break;
        case 'DELETE':
            \Shared\AuthGuard::requirePermission($authUser, 'users.write');
            if ($id <= 0) {
                \Shared\Response::error('Informe o id da fonte', 400)->send();
            }
            $response = $controller->destroy($id);
            break;
        default:
            \Shared\Response::error('Método não permitido', 405)->send();
            break;
    }

    $response->send();
} catch (Throwable $e) {
    \Shared\Logger::getInstance()->error('company_data_sources: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
    ]);
    \Shared\Response::error('Erro interno', 500)->send();
}
