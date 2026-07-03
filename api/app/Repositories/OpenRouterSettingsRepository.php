<?php

namespace App\Repositories;

use PDO;

class OpenRouterSettingsRepository
{
    private const ROW_ID = 1;

    /** @var PDO */
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * @return array{
     *     api_key: string,
     *     default_model: string,
     *     updated_at: string|null,
     *     updated_by: int|null
     * }
     */
    public function get(): array
    {
        $stmt = $this->db->prepare(
            'SELECT api_key, default_model, updated_at, updated_by
             FROM openrouter_settings
             WHERE id = :id
             LIMIT 1'
        );
        $stmt->execute(['id' => self::ROW_ID]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!is_array($row)) {
            return [
                'api_key' => '',
                'default_model' => 'openai/gpt-4o-mini',
                'updated_at' => null,
                'updated_by' => null,
            ];
        }

        return [
            'api_key' => (string) ($row['api_key'] ?? ''),
            'default_model' => trim((string) ($row['default_model'] ?? '')) ?: 'openai/gpt-4o-mini',
            'updated_at' => isset($row['updated_at']) ? (string) $row['updated_at'] : null,
            'updated_by' => isset($row['updated_by']) ? (int) $row['updated_by'] : null,
        ];
    }

    public function save(string $apiKey, string $defaultModel, int $updatedBy): void
    {
        $now = date('Y-m-d H:i:s');
        $model = trim($defaultModel) !== '' ? trim($defaultModel) : 'openai/gpt-4o-mini';

        $stmt = $this->db->prepare(
            'INSERT INTO openrouter_settings (id, api_key, default_model, updated_at, updated_by)
             VALUES (:id, :api_key, :default_model, :updated_at, :updated_by)
             ON DUPLICATE KEY UPDATE
                api_key = VALUES(api_key),
                default_model = VALUES(default_model),
                updated_at = VALUES(updated_at),
                updated_by = VALUES(updated_by)'
        );
        $stmt->execute([
            'id' => self::ROW_ID,
            'api_key' => $apiKey,
            'default_model' => $model,
            'updated_at' => $now,
            'updated_by' => $updatedBy > 0 ? $updatedBy : null,
        ]);
    }

    public function clear(int $updatedBy): void
    {
        $this->save('', 'openai/gpt-4o-mini', $updatedBy);
    }
}
