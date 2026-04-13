<?php

namespace App\Repositories;

use PDO;

class PasswordResetRepository
{
    /** @var PDO */
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function deleteByUserId(int $userId): void
    {
        $stmt = $this->db->prepare('DELETE FROM password_reset_tokens WHERE user_id = :user_id');
        $stmt->execute(['user_id' => $userId]);
    }

    public function insert(int $userId, string $tokenHash, string $expiresAt): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at)
             VALUES (:user_id, :token_hash, :expires_at, :created_at)'
        );
        $now = date('Y-m-d H:i:s');
        $stmt->execute([
            'user_id' => $userId,
            'token_hash' => $tokenHash,
            'expires_at' => $expiresAt,
            'created_at' => $now,
        ]);
    }

    public function findValidByTokenHash(string $tokenHash): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, user_id, expires_at
             FROM password_reset_tokens
             WHERE token_hash = :token_hash
             LIMIT 1'
        );
        $stmt->execute(['token_hash' => $tokenHash]);
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }

        $expires = strtotime((string) $row['expires_at']);
        if ($expires === false || $expires < time()) {
            return null;
        }

        return $row;
    }

    public function deleteById(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM password_reset_tokens WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
