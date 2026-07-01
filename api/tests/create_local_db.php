<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3306', 'root', '');
$pdo->exec('CREATE DATABASE IF NOT EXISTS u276379167_nexora CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
echo "Banco u276379167_nexora criado." . PHP_EOL;
