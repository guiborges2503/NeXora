<?php

$hosts = [
    '127.0.0.1',
    'localhost',
    'nexora.conectaxcon.com.br',
    'mysql.hostinger.com',
    'auth-db.hostinger.com',
];

$user = 'u276379167_nexora';
$pass = 'c$2+iaxy3F#';
$db = 'u276379167_nexora';

foreach ($hosts as $host) {
    try {
        $pdo = new PDO(
            "mysql:host={$host};port=3306;dbname={$db};charset=utf8mb4",
            $user,
            $pass,
            [PDO::ATTR_TIMEOUT => 5]
        );
        $count = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
        echo "OK host={$host} users={$count}\n";
        foreach ($pdo->query('SELECT id,name,email FROM users ORDER BY id') as $row) {
            echo '  - #' . $row['id'] . ' ' . $row['name'] . ' <' . $row['email'] . ">\n";
        }
    } catch (Throwable $e) {
        echo "FAIL host={$host} => " . $e->getMessage() . "\n";
    }
}
