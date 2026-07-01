<?php

namespace App\Repositories;

use PDO;

class DashboardFavoriteRepository
{
    /** @var PDO */
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function listDashboardIdsByUserId(int $userId): array
    {
        $stmt = $this->db->prepare(
            "SELECT dashboard_id
             FROM dashboard_favorites
             WHERE user_id = :user_id
             ORDER BY " . sqlOrderByDateTime('favorited_at')
        );
        $stmt->execute(['user_id' => $userId]);

        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if (!$rows) {
            return [];
        }

        return array_map(static function ($value): int {
            return (int) $value;
        }, $rows);
    }

    public function add(int $userId, int $dashboardId): bool
    {
        $stmt = $this->db->prepare(
            "INSERT INTO dashboard_favorites (user_id, dashboard_id, favorited_at)
             VALUES (:user_id, :dashboard_id, :favorited_at)
             ON CONFLICT(user_id, dashboard_id) DO UPDATE SET
                favorited_at = excluded.favorited_at"
        );

        return $stmt->execute([
            'user_id' => $userId,
            'dashboard_id' => $dashboardId,
            'favorited_at' => date('Y-m-d H:i:s'),
        ]);
    }

    public function remove(int $userId, int $dashboardId): bool
    {
        $stmt = $this->db->prepare(
            "DELETE FROM dashboard_favorites
             WHERE user_id = :user_id
               AND dashboard_id = :dashboard_id"
        );

        return $stmt->execute([
            'user_id' => $userId,
            'dashboard_id' => $dashboardId,
        ]);
    }

    public function userExists(int $userId): bool
    {
        $stmt = $this->db->prepare("SELECT 1 FROM users WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $userId]);
        return (bool) $stmt->fetchColumn();
    }

    public function dashboardExists(int $dashboardId): bool
    {
        $stmt = $this->db->prepare("SELECT 1 FROM dashboards WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $dashboardId]);
        return (bool) $stmt->fetchColumn();
    }
}
