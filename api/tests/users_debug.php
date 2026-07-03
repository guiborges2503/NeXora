<?php

include_once __DIR__ . '/../settings/includes.php';

$db = getConexaoDB1();
echo 'DB: ' . DB_NAME . PHP_EOL;

$count = (int) $db->query('SELECT COUNT(*) FROM users')->fetchColumn();
echo 'COUNT users: ' . $count . PHP_EOL;

$rows = $db->query('SELECT id, name, email, status FROM users ORDER BY id')->fetchAll();
foreach ($rows as $row) {
    echo json_encode($row, JSON_UNESCAPED_UNICODE) . PHP_EOL;
}

$roles = $db->query(
    'SELECT u.id, u.email, r.name AS role
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     ORDER BY u.id'
)->fetchAll();
echo PHP_EOL . 'Roles:' . PHP_EOL;
foreach ($roles as $row) {
    echo json_encode($row, JSON_UNESCAPED_UNICODE) . PHP_EOL;
}
