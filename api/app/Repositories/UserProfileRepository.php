<?php

namespace App\Repositories;

use PDO;

class UserProfileRepository
{
    /** @var PDO */
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function findByUserId(int $userId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT
                u.id,
                u.name,
                u.email,
                u.status,
                COALESCE(MIN(r.name), 'viewer') AS role,
                up.first_name,
                up.last_name,
                up.phone,
                up.job_title,
                up.avatar_url
             FROM users u
             LEFT JOIN user_roles ur ON ur.user_id = u.id
             LEFT JOIN roles r ON r.id = ur.role_id
             LEFT JOIN user_profiles up ON up.user_id = u.id
             WHERE u.id = :user_id
             GROUP BY
                u.id, u.name, u.email, u.status,
                up.first_name, up.last_name, up.phone, up.job_title, up.avatar_url
             LIMIT 1"
        );
        $stmt->execute(['user_id' => $userId]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        $name = trim((string) ($row['name'] ?? ''));
        $nameParts = preg_split('/\s+/', $name) ?: [];
        $fallbackFirstName = (string) ($nameParts[0] ?? '');
        $fallbackLastName = trim(implode(' ', array_slice($nameParts, 1)));

        return [
            'id' => (int) $row['id'],
            'name' => $name,
            'email' => (string) ($row['email'] ?? ''),
            'status' => (string) ($row['status'] ?? ''),
            'role' => (string) ($row['role'] ?? 'viewer'),
            'first_name' => (string) (($row['first_name'] ?? '') !== '' ? $row['first_name'] : $fallbackFirstName),
            'last_name' => (string) (($row['last_name'] ?? '') !== '' ? $row['last_name'] : $fallbackLastName),
            'phone' => (string) ($row['phone'] ?? ''),
            'job_title' => (string) ($row['job_title'] ?? ''),
            'avatar_url' => (string) ($row['avatar_url'] ?? ''),
        ];
    }

    public function updateProfile(
        int $userId,
        string $firstName,
        string $lastName,
        string $email,
        string $phone,
        string $jobTitle,
        string $avatarUrl
    ): void {
        $firstName = trim($firstName);
        $lastName = trim($lastName);
        $fullName = trim($firstName . ' ' . $lastName);
        if ($fullName === '') {
            $fullName = trim($firstName);
        }

        $normalizedEmail = $this->normalizeEmail($email);
        $now = date('Y-m-d H:i:s');

        $updateUserStmt = $this->db->prepare(
            "UPDATE users
             SET name = :name,
                 email = :email,
                 updated_at = :updated_at
             WHERE id = :id"
        );
        $updateUserStmt->execute([
            'id' => $userId,
            'name' => $fullName,
            'email' => $normalizedEmail,
            'updated_at' => $now,
        ]);

        $upsertProfileStmt = $this->db->prepare(
            "INSERT INTO user_profiles (user_id, first_name, last_name, phone, job_title, avatar_url, updated_at)
             VALUES (:user_id, :first_name, :last_name, :phone, :job_title, :avatar_url, :updated_at)
             ON CONFLICT(user_id) DO UPDATE SET
                first_name = excluded.first_name,
                last_name = excluded.last_name,
                phone = excluded.phone,
                job_title = excluded.job_title,
                avatar_url = excluded.avatar_url,
                updated_at = excluded.updated_at"
        );
        $upsertProfileStmt->execute([
            'user_id' => $userId,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'phone' => trim($phone),
            'job_title' => trim($jobTitle),
            'avatar_url' => trim($avatarUrl),
            'updated_at' => $now,
        ]);
    }

    public function updatePassword(int $userId, string $newPasswordHash): void
    {
        $stmt = $this->db->prepare(
            "UPDATE users
             SET password_hash = :password_hash,
                 updated_at = :updated_at
             WHERE id = :id"
        );
        $stmt->execute([
            'id' => $userId,
            'password_hash' => $newPasswordHash,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
    }

    public function getPasswordHashByUserId(int $userId): ?string
    {
        $stmt = $this->db->prepare(
            "SELECT password_hash
             FROM users
             WHERE id = :id
             LIMIT 1"
        );
        $stmt->execute(['id' => $userId]);
        $hash = $stmt->fetchColumn();
        if (!$hash) {
            return null;
        }

        return (string) $hash;
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

    private function normalizeEmail(string $email): string
    {
        $email = trim($email);
        return function_exists('mb_strtolower') ? mb_strtolower($email) : strtolower($email);
    }
}
