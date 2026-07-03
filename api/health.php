<?php
/**
 * Endpoint: Health check - verifica se a API está online
 * Padrão Nortrek - GET /api/health.php
 */
include_once __DIR__ . "/settings/includes.php";
include_once __DIR__ . "/cors.php";

header("Content-Type: application/json; charset=utf-8");
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    \Shared\Response::error('Método não permitido', 405)->send();
}

try {
    $dbOk = false;
    $schema = null;
    $pdo = getConexaoDB1();
    if ($pdo) {
        $pdo->query('SELECT 1');
        $dbOk = true;

        $schema = validateDatabaseSchema($pdo);

        try {
            $usersCount = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
        } catch (Throwable $e) {
            $usersCount = null;
        }
    }

    $payload = [
        'status' => 'ok',
        'timestamp' => date('c'),
        'environment' => function_exists('getEnvironment') ? getEnvironment() : 'production',
        'db_driver' => DB_DRIVER,
        'database' => $dbOk ? 'connected' : 'disconnected',
        'db_name' => DB_NAME,
        'db_host' => DB_HOST,
        'db_target' => defined('DB_TARGET') ? DB_TARGET : 'production',
        'config_source' => 'api/settings/settings.php',
    ];

    if (isset($usersCount)) {
        $payload['users_count'] = $usersCount;
    }

    if ($schema !== null) {
        $payload['schema'] = [
            'ok' => $schema['ok'],
            'required_count' => $schema['required_count'],
            'present_count' => $schema['present_count'],
            'missing' => $schema['missing'],
        ];

        if (!$schema['ok']) {
            $payload['status'] = 'degraded';
            $payload['hint'] = 'Importe database/install_mysql.sql para criar as tabelas faltantes.';
        }
    }

    if (!$dbOk) {
        $payload['db_config'] = [
            'host' => DB_HOST,
            'port' => DB_PORT,
            'name' => DB_NAME,
            'user' => DB_USER,
            'pass_set' => DB_PASS !== '' && DB_PASS !== 'sua_senha_aqui',
        ];
        $dbError = getLastDbConnectionError();
        if ($dbError) {
            $payload['db_error'] = $dbError;
        }
        if (DB_PASS === '') {
            $payload['hint'] = 'Defina DB_PASS em api/settings/settings.php (senha MySQL da Hostinger).';
        } elseif (
            function_exists('getEnvironment')
            && getEnvironment() === 'development'
            && defined('DB_REMOTE_HOST')
            && DB_REMOTE_HOST === ''
        ) {
            $payload['hint'] = 'Defina DB_REMOTE_HOST em api/settings/settings.php (host MySQL remoto da Hostinger) para usar o banco de produção no PC.';
        }
    }

    $statusCode = ($schema !== null && !$schema['ok']) ? 503 : 200;
    \Shared\Response::success($payload, $statusCode)->send();
} catch (Exception $e) {
    \Shared\Response::success([
        'status' => 'ok',
        'timestamp' => date('c'),
        'db_driver' => DB_DRIVER,
        'database' => 'disconnected',
        'message' => $e->getMessage(),
    ])->send();
}
