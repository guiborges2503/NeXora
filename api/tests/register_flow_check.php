<?php

include_once __DIR__ . '/../settings/includes.php';

$db = getConexaoDB1();
$repo = new \App\Repositories\UserRepository($db);
$service = new \App\Services\AuthService($repo);

$email = 'teste.register.' . time() . '@nexora.local';

try {
    $created = $service->register('Usuario Teste Register', $email, 'senha123');
    echo 'Registrado: ' . json_encode($created, JSON_UNESCAPED_UNICODE) . PHP_EOL;

    $listed = $repo->listAll();
    echo 'Total na listagem /users: ' . count($listed) . PHP_EOL;

    $roleRow = $db->prepare(
        'SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = :id'
    );
    $roleRow->execute(['id' => $created['id']]);
    echo 'Role em user_roles: ' . ($roleRow->fetchColumn() ?: 'NULL') . PHP_EOL;

    $db->prepare('DELETE FROM user_roles WHERE user_id = :id')->execute(['id' => $created['id']]);
    $db->prepare('DELETE FROM users WHERE id = :id')->execute(['id' => $created['id']]);
    echo 'Usuario de teste removido.' . PHP_EOL;
} catch (Throwable $e) {
    fwrite(STDERR, $e->getMessage() . PHP_EOL);
    exit(1);
}
