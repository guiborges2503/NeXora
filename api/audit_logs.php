<?php

include_once __DIR__ . '/settings/includes.php';
include_once __DIR__ . '/cors.php';

header('Content-Type: application/json; charset=utf-8');
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
    \Shared\AuthGuard::requirePermission($authUser, 'audit.read');

    $db = \Shared\Database::getInstance()->getConnection();

    $stmt = $db->query(
        "SELECT
            a.id,
            COALESCE(u.name, 'Sistema') AS user_name,
            a.action,
            a.entity,
            a.entity_id,
            a.metadata,
            a.created_at
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.user_id
         ORDER BY datetime(a.created_at) DESC"
    );

    $rows = $stmt ? $stmt->fetchAll() : [];
    $items = [];

    foreach ($rows as $row) {
        $metadata = [];
        if (!empty($row['metadata'])) {
            $decoded = json_decode($row['metadata'], true);
            if (is_array($decoded)) {
                $metadata = $decoded;
            }
        }

        $date = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', (string) $row['created_at']);
        $items[] = [
            'id' => (int) $row['id'],
            'user' => (string) $row['user_name'],
            'action' => (string) $row['action'],
            'entity' => (string) $row['entity'],
            'entity_id' => $row['entity_id'],
            'details' => (string) ($metadata['message'] ?? ((string) $row['entity'] . ' #' . (string) ($row['entity_id'] ?? 'n/a'))),
            'type' => (string) $row['action'],
            'ip' => (string) ($metadata['ip'] ?? 'Sistema'),
            'timestamp' => $date ? $date->format('d/m/Y H:i') : (string) $row['created_at'],
            'created_at' => (string) $row['created_at'],
        ];
    }

    $today = (int) $db->query("SELECT COUNT(*) FROM audit_logs WHERE date(created_at) = date('now', 'localtime')")->fetchColumn();
    $week = (int) $db->query("SELECT COUNT(*) FROM audit_logs WHERE datetime(created_at) >= datetime('now', '-7 days')")->fetchColumn();
    $month = (int) $db->query("SELECT COUNT(*) FROM audit_logs WHERE datetime(created_at) >= datetime('now', '-30 days')")->fetchColumn();

    \Shared\Response::success([
        'items' => $items,
        'stats' => [
            'total' => count($items),
            'today' => $today,
            'week' => $week,
            'month' => $month,
        ],
    ])->send();
} catch (Throwable $e) {
    \Shared\Logger::getInstance()->error('audit_logs: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
    ]);
    \Shared\Response::error('Erro interno', 500)->send();
}
