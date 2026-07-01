<?php

try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306', 'root', '');
    $dbs = $pdo->query('SHOW DATABASES')->fetchAll(PDO::FETCH_COLUMN);
    echo "Databases:\n";
    foreach ($dbs as $db) {
        echo " - {$db}\n";
    }
} catch (Throwable $e) {
    echo $e->getMessage();
}
