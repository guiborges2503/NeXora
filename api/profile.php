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
    $controller = new \App\Controllers\ProfileController();
    $request = new \Shared\Request();
    $method = $_SERVER['REQUEST_METHOD'];
    $queryUserId = (int) $request->getQueryParam('user_id', 0);
    $bodyUserId = (int) $request->getBodyParam('user_id', 0);
    $userId = $queryUserId > 0 ? $queryUserId : $bodyUserId;

    switch ($method) {
        case 'GET':
            $response = $controller->show($userId);
            break;
        case 'PATCH':
            $action = (string) $request->getBodyParam('action', 'update_profile');
            if ($action === 'verify_current_password') {
                $response = $controller->verifyCurrentPassword($userId, $request);
            } elseif ($action === 'change_password') {
                $response = $controller->updatePassword($userId, $request);
            } else {
                $response = $controller->updateProfile($userId, $request);
            }
            break;
        default:
            \Shared\Response::error('Método não permitido', 405)->send();
            break;
    }

    $response->send();
} catch (Throwable $e) {
    \Shared\Logger::getInstance()->error('profile: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
    ]);
    \Shared\Response::error('Erro interno', 500)->send();
}
