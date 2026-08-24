<?php

$_SERVER['HTTP_HOST'] = 'localhost';
include_once __DIR__ . '/../settings/includes.php';

$pdo = getConexaoDB1();
if (!$pdo) {
    fwrite(STDERR, (getLastDbConnectionError() ?? 'DB FAIL') . PHP_EOL);
    exit(1);
}

$sql = file_get_contents(__DIR__ . '/../../database/scripts/seed_admin.sql');
if ($sql === false) {
    fwrite(STDERR, 'seed_admin.sql não encontrado' . PHP_EOL);
    exit(1);
}

$lines = [];
foreach (preg_split('/\R/', $sql) as $line) {
    $trimmed = ltrim($line);
    if ($trimmed === '' || strpos($trimmed, '--') === 0) {
        continue;
    }
    $lines[] = $line;
}
$clean = implode("\n", $lines);
$statements = array_filter(array_map('trim', explode(';', $clean)));

foreach ($statements as $stmt) {
    if ($stmt === '') {
        continue;
    }
    $pdo->exec($stmt);
}

$role = $pdo->prepare(
    "SELECT u.email, u.status, COALESCE(MIN(r.name), 'viewer') AS role
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE u.email = 'admin@nexora.local'
     GROUP BY u.email, u.status"
);
$role->execute();
print_r($role->fetch(PDO::FETCH_ASSOC));
echo 'roles=' . $pdo->query('SELECT COUNT(*) FROM roles')->fetchColumn() . PHP_EOL;
echo 'permissions=' . $pdo->query('SELECT COUNT(*) FROM permissions')->fetchColumn() . PHP_EOL;
echo 'role_permissions=' . $pdo->query('SELECT COUNT(*) FROM role_permissions')->fetchColumn() . PHP_EOL;
echo 'OK' . PHP_EOL;
