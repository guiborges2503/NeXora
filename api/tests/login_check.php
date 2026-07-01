<?php

include_once __DIR__ . '/../settings/includes.php';

$db = getConexaoDB1();
echo $db ? 'DB OK (' . DB_NAME . ')' . PHP_EOL : 'DB FAIL' . PHP_EOL;

$stmt = $db->prepare('SELECT id, email FROM users WHERE email = :email');
$stmt->execute(['email' => 'admin@nexora.local']);
$user = $stmt->fetch();
echo $user ? 'Admin encontrado id=' . $user['id'] . PHP_EOL : 'Admin NAO encontrado' . PHP_EOL;
