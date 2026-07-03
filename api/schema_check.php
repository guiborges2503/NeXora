<?php
/**
 * Endpoint: validação do schema MySQL — confirma se todas as tabelas existem
 * GET /api/schema_check.php
 */
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
    $pdo = getConexaoDB1();
    if (!$pdo) {
        $payload = [
            'status' => 'error',
            'timestamp' => date('c'),
            'database' => 'disconnected',
            'schema' => [
                'ok' => false,
                'message' => 'Não foi possível conectar ao banco de dados',
            ],
        ];

        $dbError = getLastDbConnectionError();
        if ($dbError) {
            $payload['db_error'] = $dbError;
        }

        \Shared\Response::success($payload, 503)->send();
    }

    $pdo->query('SELECT 1');

    $schema = validateDatabaseSchema($pdo);

    $payload = [
        'status' => $schema['ok'] ? 'ok' : 'incomplete',
        'timestamp' => date('c'),
        'db_driver' => DB_DRIVER,
        'database' => DB_NAME,
        'schema' => $schema,
    ];

    if (!$schema['ok']) {
        $payload['hint'] = 'Importe database/install_mysql.sql no phpMyAdmin para criar as tabelas faltantes.';
        \Shared\Response::success($payload, 503)->send();
    }

    \Shared\Response::success($payload)->send();
} catch (\Throwable $e) {
    \Shared\Response::error('Falha ao validar schema: ' . $e->getMessage(), 500)->send();
}
