<?php

include_once __DIR__ . '/../settings/includes.php';

$host = DB_REMOTE_HOST;
$user = DB_USER;
$pass = DB_PASS;
$db = DB_NAME;

$variants = [
    'plain' => [],
    'ssl_no_verify' => [
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
        PDO::MYSQL_ATTR_SSL_CA => true,
    ],
];

foreach ($variants as $label => $sslOptions) {
    try {
        $options = array_merge([
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 8,
        ], $sslOptions);

        $pdo = new PDO(
            "mysql:host={$host};port=3306;dbname={$db};charset=utf8mb4",
            $user,
            $pass,
            $options
        );
        $count = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
        echo "OK {$label} users={$count}\n";
    } catch (Throwable $e) {
        echo "FAIL {$label} => {$e->getMessage()}\n";
    }
}
