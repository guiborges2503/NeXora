<?php

include_once __DIR__ . '/../settings/includes.php';

echo 'environment=' . getEnvironment() . PHP_EOL;
echo 'db_host=' . DB_HOST . PHP_EOL;
echo 'db_name=' . DB_NAME . PHP_EOL;
echo 'db_target=' . (defined('DB_TARGET') ? DB_TARGET : 'n/a') . PHP_EOL;

$db = getConexaoDB1();
if (!$db) {
    echo 'connection=FAIL' . PHP_EOL;
    echo 'error=' . (getLastDbConnectionError() ?? 'unknown') . PHP_EOL;
    exit(1);
}

echo 'connection=OK' . PHP_EOL;

$rows = $db->query('SELECT id, name, email, created_at FROM users ORDER BY id')->fetchAll();
echo 'users_count=' . count($rows) . PHP_EOL;
foreach ($rows as $row) {
    echo sprintf(
        "#%d %s <%s> created=%s\n",
        $row['id'],
        $row['name'],
        $row['email'],
        $row['created_at']
    );
}
