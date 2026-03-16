<?php

namespace App\Services;

use App\Repositories\UserRepository;
use RuntimeException;

class AuthService
{
    /** @var UserRepository */
    private $users;

    public function __construct(UserRepository $users)
    {
        $this->users = $users;
    }

    public function register(string $name, string $email, string $password): array
    {
        $name = trim($name);
        $email = $this->normalizeEmail($email);

        if ($this->users->findByEmail($email) !== null) {
            throw new RuntimeException('E-mail já cadastrado');
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        if ($passwordHash === false) {
            throw new RuntimeException('Falha ao processar senha');
        }

        $userId = $this->users->create($name, $email, $passwordHash);
        $this->users->assignRoleByName($userId, 'viewer');

        return [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'status' => 'active',
            'role' => 'viewer',
        ];
    }

    public function login(string $email, string $password): array
    {
        $email = $this->normalizeEmail($email);
        $user = $this->users->findByEmail($email);

        if ($user === null) {
            throw new RuntimeException('Credenciais inválidas');
        }

        $status = (string) ($user['status'] ?? '');
        $passwordHash = (string) ($user['password_hash'] ?? '');

        if ($status !== 'active') {
            throw new RuntimeException('Usuário inativo');
        }

        if ($passwordHash === '' || !password_verify($password, $passwordHash)) {
            throw new RuntimeException('Credenciais inválidas');
        }

        $userWithRole = $this->users->findById((int) $user['id']);
        $role = is_array($userWithRole) ? (string) ($userWithRole['role'] ?? 'viewer') : 'viewer';

        return [
            'id' => (int) $user['id'],
            'name' => (string) $user['name'],
            'email' => (string) $user['email'],
            'status' => $status,
            'role' => $role,
            'authenticated' => true,
        ];
    }

    private function normalizeEmail(string $email): string
    {
        $email = trim($email);
        return function_exists('mb_strtolower') ? mb_strtolower($email) : strtolower($email);
    }
}
