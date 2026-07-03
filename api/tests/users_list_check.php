<?php

include_once __DIR__ . '/../settings/includes.php';

$db = getConexaoDB1();
if (!$db) {
    fwrite(STDERR, 'DB FAIL' . PHP_EOL);
    exit(1);
}

$repo = new \App\Repositories\UserRepository($db);
$users = $repo->listAll();

echo 'Usuarios encontrados: ' . count($users) . PHP_EOL;
foreach ($users as $user) {
    echo sprintf(
        "- #%d %s <%s> status=%s role=%s\n",
        $user['id'],
        $user['name'],
        $user['email'],
        $user['status'],
        $user['role'] ?? 'n/a'
    );
}
