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
    $controller = new \App\Controllers\AiConversationsController();
    $request = new \Shared\Request();
    $method = $_SERVER['REQUEST_METHOD'];
    $id = (int) ($request->getQueryParam('id', 0));

    switch ($method) {
        case 'GET':
            if ($id > 0) {
                $response = $controller->show($id, $request);
            } else {
                $response = $controller->index($request);
            }
            break;
        case 'POST':
            $response = $controller->store($request);
            break;
        case 'PATCH':
            if ($id <= 0) {
                \Shared\Response::validationError(['id' => 'Parâmetro id é obrigatório'])->send();
            }
            $response = $controller->update($id, $request);
            break;
        default:
            \Shared\Response::error('Método não permitido', 405)->send();
            break;
    }

    $response->send();
} catch (Throwable $e) {
    \Shared\Logger::getInstance()->error('ai_conversations: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
    ]);
    \Shared\Response::error('Erro interno', 500)->send();
}
