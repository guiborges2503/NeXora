<?php

namespace App\Repositories;

use PDO;

class AiConversationRepository
{
    /** @var PDO */
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listByUserId(int $userId, int $limit = 60): array
    {
        $limit = max(1, min(100, $limit));
        $stmt = $this->db->prepare(
            "SELECT id, user_id, title, messages_json, created_at, updated_at
             FROM ai_conversations
             WHERE user_id = :user_id
             ORDER BY " . sqlOrderByDateTime('updated_at') . "
             LIMIT {$limit}"
        );
        $stmt->execute(['user_id' => $userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        return array_map([$this, 'hydrateRow'], $rows);
    }

    public function findByIdForUser(int $id, int $userId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT id, user_id, title, messages_json, created_at, updated_at
             FROM ai_conversations
             WHERE id = :id AND user_id = :user_id
             LIMIT 1"
        );
        $stmt->execute(['id' => $id, 'user_id' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }

        return $this->hydrateRow($row);
    }

    public function create(int $userId, string $title, string $messagesJson): int
    {
        $now = date('Y-m-d H:i:s');
        $stmt = $this->db->prepare(
            "INSERT INTO ai_conversations (user_id, title, messages_json, created_at, updated_at)
             VALUES (:user_id, :title, :messages_json, :created_at, :updated_at)"
        );
        $stmt->execute([
            'user_id' => $userId,
            'title' => $title,
            'messages_json' => $messagesJson,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, int $userId, string $title, string $messagesJson): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE ai_conversations
             SET title = :title,
                 messages_json = :messages_json,
                 updated_at = :updated_at
             WHERE id = :id AND user_id = :user_id"
        );

        return $stmt->execute([
            'id' => $id,
            'user_id' => $userId,
            'title' => $title,
            'messages_json' => $messagesJson,
            'updated_at' => date('Y-m-d H:i:s'),
        ]) && $stmt->rowCount() > 0;
    }

    public function updateTitle(int $id, int $userId, string $title): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE ai_conversations
             SET title = :title,
                 updated_at = :updated_at
             WHERE id = :id AND user_id = :user_id"
        );

        return $stmt->execute([
            'id' => $id,
            'user_id' => $userId,
            'title' => $title,
            'updated_at' => date('Y-m-d H:i:s'),
        ]) && $stmt->rowCount() > 0;
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function hydrateRow(array $row): array
    {
        $decoded = json_decode((string) ($row['messages_json'] ?? '[]'), true);
        $row['messages'] = is_array($decoded) ? $decoded : [];
        unset($row['messages_json']);

        return $row;
    }
}
