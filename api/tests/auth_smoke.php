<?php

/**
 * Script rápido para validar JWT e AuthGuard (CLI).
 * Uso: php api/tests/auth_smoke.php
 */

$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTP_HOST'] = 'localhost';

require __DIR__ . '/../settings/includes.php';

use App\Repositories\UserRepository;
use App\Services\AuthService;
use App\Services\JwtService;
use Shared\AuthGuard;
use Shared\Database;
use Shared\Request;

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "[FAIL] {$message}" . PHP_EOL);
        exit(1);
    }
    echo "[OK] {$message}" . PHP_EOL;
}

$db = Database::getInstance()->getConnection();
$service = new AuthService(new UserRepository($db));
$user = $service->login('admin@nexora.local', 'admin123');
$token = JwtService::issue($user);

assertTrue($token !== '', 'Token gerado');
$decoded = JwtService::decode($token);
assertTrue(is_array($decoded) && (int) $decoded['sub'] === (int) $user['id'], 'Token decodificado');

$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $token;
$authRequest = new Request();
$authUser = AuthGuard::authenticate($authRequest);
assertTrue(is_array($authUser) && (int) $authUser['id'] === (int) $user['id'], 'AuthGuard autentica token válido');

$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer token-invalido';
$badRequest = new Request();
assertTrue(AuthGuard::authenticate($badRequest) === null, 'AuthGuard rejeita token inválido');

echo PHP_EOL . 'Auth smoke test passed.' . PHP_EOL;
