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
    $request = new \Shared\Request();
    $authUser = \Shared\AuthGuard::requireAuth($request);
    $method = $_SERVER['REQUEST_METHOD'];
    $action = (string) $request->getQueryParam('action', '');
    $id = (int) $request->getQueryParam('id', 0);
    $db = \Shared\Database::getInstance()->getConnection();
    $settingsRepo = new \App\Repositories\AlertSettingsRepository($db);

    if ($method === 'GET' && $action === 'settings') {
        \Shared\AuthGuard::requirePermission($authUser, 'alerts.read');
        \Shared\Response::success($settingsRepo->get())->send();
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        if ($action === 'resolve') {
            \Shared\AuthGuard::requirePermission($authUser, 'alerts.read');
            if ($id <= 0) {
                \Shared\Response::error('Informe o id do alerta', 400)->send();
            }
            if (!$settingsRepo->markResolved($id, (int) $authUser['id'])) {
                \Shared\Response::notFound('Alerta não encontrado')->send();
            }
            \Shared\Response::success(['id' => $id], 200, 'Alerta resolvido')->send();
        }

        \Shared\AuthGuard::requirePermission($authUser, 'users.write');
        $settingsRepo->save($request->getBody(), (int) $authUser['id']);
        \Shared\Response::success($settingsRepo->get(), 200, 'Configuração de alertas salva')->send();
    }

    if ($method !== 'GET') {
        \Shared\Response::error('Método não permitido', 405)->send();
    }

    \Shared\AuthGuard::requirePermission($authUser, 'alerts.read');

    $stmt = $db->query(
        "SELECT
            a.id,
            a.title,
            a.message AS description,
            a.level AS severity,
            CASE WHEN a.is_read = 1 THEN 'resolved' ELSE 'active' END AS status,
            'Geral' AS category,
            a.created_at
         FROM alerts a
         ORDER BY " . sqlOrderByDateTime('a.created_at')
    );

    $alerts = $stmt ? $stmt->fetchAll() : [];
    $now = new DateTimeImmutable();

    foreach ($alerts as &$alert) {
        $date = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', (string) $alert['created_at']);
        $alert['timestamp'] = $date ? $date->format('d/m/Y H:i') : (string) $alert['created_at'];
    }
    unset($alert);

    $total = count($alerts);
    $active = 0;
    $resolved = 0;
    $high = 0;

    foreach ($alerts as $alert) {
        if ($alert['status'] === 'active') {
            $active++;
        } else {
            $resolved++;
        }
        if ($alert['severity'] === 'high') {
            $high++;
        }
    }

    \Shared\Response::success([
        'items' => $alerts,
        'stats' => [
            'total' => $total,
            'high' => $high,
            'active' => $active,
            'resolved' => $resolved,
            'generated_at' => $now->format(DATE_ATOM),
        ],
    ])->send();
} catch (Throwable $e) {
    \Shared\Logger::getInstance()->error('alerts: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
    ]);
    \Shared\Response::error('Erro interno', 500)->send();
}
