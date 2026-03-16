<?php

namespace App\Repositories;

use PDO;

class UserRepository
{
    /** @var PDO */
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function listAll(): array
    {
        $stmt = $this->db->query(
            "SELECT
                u.id,
                u.name,
                u.email,
                u.status,
                COALESCE(MIN(r.name), 'viewer') AS role,
                u.created_at,
                u.updated_at
             FROM users u
             LEFT JOIN user_roles ur ON ur.user_id = u.id
             LEFT JOIN roles r ON r.id = ur.role_id
             GROUP BY u.id, u.name, u.email, u.status, u.created_at, u.updated_at
             ORDER BY u.created_at DESC"
        );

        return $stmt->fetchAll() ?: [];
    }

    public function findByEmail(string $email): ?array
    {
        $normalizedEmail = $this->normalizeEmail($email);

        $stmt = $this->db->prepare(
            "SELECT id, name, email, password_hash, status, created_at, updated_at
             FROM users
             WHERE email = :email
             LIMIT 1"
        );
        $stmt->execute(['email' => $normalizedEmail]);

        $user = $stmt->fetch();
        return $user ?: null;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT
                u.id,
                u.name,
                u.email,
                u.status,
                COALESCE(MIN(r.name), 'viewer') AS role,
                u.created_at,
                u.updated_at
             FROM users u
             LEFT JOIN user_roles ur ON ur.user_id = u.id
             LEFT JOIN roles r ON r.id = ur.role_id
             WHERE u.id = :id
             GROUP BY u.id, u.name, u.email, u.status, u.created_at, u.updated_at
             LIMIT 1"
        );
        $stmt->execute(['id' => $id]);

        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function existsEmailForAnotherUser(string $email, int $userId): bool
    {
        $stmt = $this->db->prepare(
            "SELECT 1
             FROM users
             WHERE email = :email
               AND id <> :id
             LIMIT 1"
        );
        $stmt->execute([
            'email' => $this->normalizeEmail($email),
            'id' => $userId,
        ]);

        return (bool) $stmt->fetchColumn();
    }

    public function create(string $name, string $email, string $passwordHash, string $status = 'active'): int
    {
        $normalizedEmail = $this->normalizeEmail($email);

        $stmt = $this->db->prepare(
            "INSERT INTO users (name, email, password_hash, status, created_at, updated_at)
             VALUES (:name, :email, :password_hash, :status, :created_at, :updated_at)"
        );

        $now = date('Y-m-d H:i:s');
        $stmt->execute([
            'name' => trim($name),
            'email' => $normalizedEmail,
            'password_hash' => $passwordHash,
            'status' => $status,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, string $name, string $email, string $status): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE users
             SET name = :name,
                 email = :email,
                 status = :status,
                 updated_at = :updated_at
             WHERE id = :id"
        );

        return $stmt->execute([
            'id' => $id,
            'name' => trim($name),
            'email' => $this->normalizeEmail($email),
            'status' => $status,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
    }

    public function updatePassword(int $id, string $passwordHash): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE users
             SET password_hash = :password_hash,
                 updated_at = :updated_at
             WHERE id = :id"
        );

        return $stmt->execute([
            'id' => $id,
            'password_hash' => $passwordHash,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
    }

    public function deleteById(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM users WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }

    public function setRoleByName(int $userId, string $roleName): bool
    {
        $stmtRole = $this->db->prepare(
            "SELECT id
             FROM roles
             WHERE name = :name
             LIMIT 1"
        );
        $stmtRole->execute(['name' => trim($roleName)]);

        $roleId = $stmtRole->fetchColumn();
        if (!$roleId) {
            return false;
        }

        $this->db->prepare("DELETE FROM user_roles WHERE user_id = :user_id")
            ->execute(['user_id' => $userId]);

        $stmtAssign = $this->db->prepare(
            "INSERT INTO user_roles (user_id, role_id, assigned_at)
             VALUES (:user_id, :role_id, :assigned_at)"
        );

        $stmtAssign->execute([
            'user_id' => $userId,
            'role_id' => (int) $roleId,
            'assigned_at' => date('Y-m-d H:i:s'),
        ]);

        return true;
    }

    public function assignRoleByName(int $userId, string $roleName): bool
    {
        $stmtRole = $this->db->prepare(
            "SELECT id
             FROM roles
             WHERE name = :name
             LIMIT 1"
        );
        $stmtRole->execute(['name' => trim($roleName)]);

        $roleId = $stmtRole->fetchColumn();
        if (!$roleId) {
            return false;
        }

        $stmtAssign = $this->db->prepare(
            "INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_at)
             VALUES (:user_id, :role_id, :assigned_at)"
        );

        $stmtAssign->execute([
            'user_id' => $userId,
            'role_id' => (int) $roleId,
            'assigned_at' => date('Y-m-d H:i:s'),
        ]);

        return true;
    }

    public function countUsersByRoleName(string $roleName): int
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*)
             FROM user_roles ur
             INNER JOIN roles r ON r.id = ur.role_id
             WHERE r.name = :role_name"
        );
        $stmt->execute(['role_name' => $roleName]);
        return (int) $stmt->fetchColumn();
    }

    private function normalizeEmail(string $email): string
    {
        $email = trim($email);
        return function_exists('mb_strtolower') ? mb_strtolower($email) : strtolower($email);
    }
}
