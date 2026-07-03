<?php

include_once __DIR__ . '/../settings/includes.php';

$hosts = [
    'auth-db746.hstgr.io',
    'srv746.hstgr.io',
    'mysql746.hstgr.io',
    'db746.hstgr.io',
    'u276379167.hstgr.io',
];

$user = DB_USER;
$pass = DB_PASS;
$db = DB_NAME;

echo 'password=' . DB_PASS . ' len=' . strlen(DB_PASS) . PHP_EOL . PHP_EOL;

foreach ($hosts as $host) {
    try {
        $pdo = new PDO(
            "mysql:host={$host};port=3306;dbname={$db};charset=utf8mb4",
            $user,
            $pass,
            [PDO::ATTR_TIMEOUT => 8, PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        $count = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
        echo "OK host={$host} users={$count}\n";
        foreach ($pdo->query('SELECT id,name,email FROM users ORDER BY id') as $row) {
            echo "  #{$row['id']} {$row['name']} <{$row['email']}>\n";
        }
    } catch (Throwable $e) {
        echo "FAIL host={$host} => {$e->getMessage()}\n";
    }
}
