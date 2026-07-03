<?php

include_once __DIR__ . '/../settings/includes.php';

$db = getConexaoDB1();
echo 'roles:' . PHP_EOL;
print_r($db->query('SELECT * FROM roles ORDER BY id')->fetchAll());
echo 'permissions count: ' . (int)$db->query('SELECT COUNT(*) FROM permissions')->fetchColumn() . PHP_EOL;
echo 'role_permissions count: ' . (int)$db->query('SELECT COUNT(*) FROM role_permissions')->fetchColumn() . PHP_EOL;
