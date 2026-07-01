<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3306', 'root', '');
$pdo->exec('DROP DATABASE IF EXISTS u276379167_nexora');
$pdo->exec('CREATE DATABASE u276379167_nexora CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
echo "Banco recriado." . PHP_EOL;
