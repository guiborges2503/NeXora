<?php

namespace Shared;

use App\Repositories\PermissionRepository;
use App\Services\JwtService;

class AuthGuard
{
    /**
     * @return array{id:int,email:string,role:string}|null
     */
    public static function authenticate(Request $request): ?array
    {
        $header = $request->getHeader('Authorization');
        if ($header === null || !preg_match('/^Bearer\s+(\S+)$/i', trim($header), $matches)) {
            return null;
        }

        $payload = JwtService::decode($matches[1]);
        if ($payload === null) {
            return null;
        }

        return [
            'id' => (int) $payload['sub'],
            'email' => (string) $payload['email'],
            'role' => (string) $payload['role'],
        ];
    }

    /**
     * @return array{id:int,email:string,role:string}
     */
    public static function requireAuth(Request $request): array
    {
        $user = self::authenticate($request);
        if ($user === null) {
            Response::unauthorized('Token inválido ou ausente')->send();
        }

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare('SELECT status FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $user['id']]);
        $status = $stmt->fetchColumn();

        if ($status !== 'active') {
            Response::unauthorized('Usuário inativo')->send();
        }

        $request->setAuthUser($user);

        return $user;
    }

    /**
     * @param array{id:int,email:string,role:string} $user
     */
    public static function requirePermission(array $user, string $permission): void
    {
        if (($user['role'] ?? '') === 'admin') {
            return;
        }

        $db = Database::getInstance()->getConnection();
        $repo = new PermissionRepository($db);

        if (!$repo->roleHasPermission((string) $user['role'], $permission)) {
            Response::forbidden('Permissão insuficiente')->send();
        }
    }

    /**
     * @param array{id:int,email:string,role:string} $user
     */
    public static function ensureSelf(array $user, int $targetUserId): void
    {
        if ((int) $user['id'] === $targetUserId) {
            return;
        }

        Response::forbidden('Acesso negado a recurso de outro usuário')->send();
    }
}
