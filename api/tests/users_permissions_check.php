<?php

include_once __DIR__ . '/../settings/includes.php';

$db = getConexaoDB1();
$stmt = $db->query(
    "SELECT r.name AS role, p.name AS permission
     FROM role_permissions rp
     INNER JOIN roles r ON r.id = rp.role_id
     INNER JOIN permissions p ON p.id = rp.permission_id
     WHERE p.name LIKE 'users.%'
     ORDER BY r.name, p.name"
);
foreach ($stmt->fetchAll() as $row) {
    echo $row['role'] . ' -> ' . $row['permission'] . PHP_EOL;
}
