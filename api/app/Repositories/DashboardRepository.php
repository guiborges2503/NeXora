<?php

namespace App\Repositories;

use PDO;

class DashboardRepository
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
                d.id,
                d.name,
                d.description,
                d.owner_id,
                COALESCE(u.name, 'Sistema') AS owner_name,
                d.is_public,
                d.created_at,
                d.updated_at,
                COALESCE(dm.embed_url, '') AS embed_url,
                COALESCE(dm.category, 'other') AS category,
                COALESCE(dm.views_count, 0) AS views_count
             FROM dashboards d
             LEFT JOIN users u ON u.id = d.owner_id
             LEFT JOIN dashboard_meta dm ON dm.dashboard_id = d.id
             ORDER BY " . sqlOrderByDateTime('d.created_at')
        );

        return $stmt ? ($stmt->fetchAll() ?: []) : [];
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT
                d.id,
                d.name,
                d.description,
                d.owner_id,
                COALESCE(u.name, 'Sistema') AS owner_name,
                d.is_public,
                d.created_at,
                d.updated_at,
                COALESCE(dm.embed_url, '') AS embed_url,
                COALESCE(dm.category, 'other') AS category,
                COALESCE(dm.views_count, 0) AS views_count
             FROM dashboards d
             LEFT JOIN users u ON u.id = d.owner_id
             LEFT JOIN dashboard_meta dm ON dm.dashboard_id = d.id
             WHERE d.id = :id
             LIMIT 1"
        );
        $stmt->execute(['id' => $id]);
        $dashboard = $stmt->fetch();
        if (!$dashboard) {
            return null;
        }

        $dashboard['allowed_roles'] = $this->getAllowedRoles($id);
        return $dashboard;
    }

    public function create(
        string $name,
        string $description,
        string $embedUrl,
        string $category,
        int $ownerId,
        int $isPublic,
        array $allowedRoles
    ): int {
        $stmt = $this->db->prepare(
            "INSERT INTO dashboards (name, description, owner_id, is_public, created_at, updated_at)
             VALUES (:name, :description, :owner_id, :is_public, :created_at, :updated_at)"
        );
        $now = date('Y-m-d H:i:s');
        $stmt->execute([
            'name' => trim($name),
            'description' => trim($description),
            'owner_id' => $ownerId,
            'is_public' => $isPublic,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $dashboardId = (int) $this->db->lastInsertId();

        $metaStmt = $this->db->prepare(
            "INSERT INTO dashboard_meta (dashboard_id, embed_url, category, views_count, updated_at)
             VALUES (:dashboard_id, :embed_url, :category, :views_count, :updated_at)"
        );
        $metaStmt->execute([
            'dashboard_id' => $dashboardId,
            'embed_url' => trim($embedUrl),
            'category' => trim($category),
            'views_count' => 0,
            'updated_at' => $now,
        ]);

        $this->setAllowedRoles($dashboardId, $allowedRoles);
        return $dashboardId;
    }

    public function update(
        int $id,
        string $name,
        string $description,
        string $embedUrl,
        string $category,
        int $isPublic,
        array $allowedRoles
    ): bool {
        $stmt = $this->db->prepare(
            "UPDATE dashboards
             SET name = :name,
                 description = :description,
                 is_public = :is_public,
                 updated_at = :updated_at
             WHERE id = :id"
        );
        $ok = $stmt->execute([
            'id' => $id,
            'name' => trim($name),
            'description' => trim($description),
            'is_public' => $isPublic,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        $metaStmt = $this->db->prepare(
            "INSERT INTO dashboard_meta (dashboard_id, embed_url, category, views_count, updated_at)
             VALUES (:dashboard_id, :embed_url, :category, 0, :updated_at)
             ON CONFLICT(dashboard_id) DO UPDATE SET
                embed_url = excluded.embed_url,
                category = excluded.category,
                updated_at = excluded.updated_at"
        );
        $metaStmt->execute([
            'dashboard_id' => $id,
            'embed_url' => trim($embedUrl),
            'category' => trim($category),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        $this->setAllowedRoles($id, $allowedRoles);
        return $ok;
    }

    public function deleteById(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM dashboards WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }

    public function incrementViews(int $id): bool
    {
        $stmt = $this->db->prepare(
            "INSERT INTO dashboard_meta (dashboard_id, embed_url, category, views_count, updated_at)
             VALUES (:dashboard_id, '', 'other', 1, :updated_at)
             ON CONFLICT(dashboard_id) DO UPDATE SET
                views_count = COALESCE(views_count, 0) + 1,
                updated_at = excluded.updated_at"
        );
        return $stmt->execute([
            'dashboard_id' => $id,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
    }

    public function getDefaultOwnerId(): int
    {
        $stmt = $this->db->query(
            "SELECT u.id
             FROM users u
             LEFT JOIN user_roles ur ON ur.user_id = u.id
             LEFT JOIN roles r ON r.id = ur.role_id
             WHERE r.name = 'admin'
             LIMIT 1"
        );
        $id = $stmt ? (int) $stmt->fetchColumn() : 0;
        if ($id > 0) {
            return $id;
        }

        $fallback = $this->db->query("SELECT id FROM users ORDER BY id ASC LIMIT 1");
        return $fallback ? (int) $fallback->fetchColumn() : 1;
    }

    private function getAllowedRoles(int $dashboardId): array
    {
        $stmt = $this->db->prepare(
            "SELECT r.name
             FROM dashboard_role_access dra
             INNER JOIN roles r ON r.id = dra.role_id
             WHERE dra.dashboard_id = :dashboard_id
             ORDER BY r.name ASC"
        );
        $stmt->execute(['dashboard_id' => $dashboardId]);
        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
        return $rows ?: [];
    }

    private function setAllowedRoles(int $dashboardId, array $allowedRoles): void
    {
        $this->db->prepare("DELETE FROM dashboard_role_access WHERE dashboard_id = :dashboard_id")
            ->execute(['dashboard_id' => $dashboardId]);

        $allowed = array_values(array_unique(array_filter($allowedRoles, function ($role) {
            return in_array($role, ['admin', 'manager', 'viewer'], true);
        })));

        if (empty($allowed)) {
            $allowed = ['admin', 'manager', 'viewer'];
        }

        $roleStmt = $this->db->prepare("SELECT id FROM roles WHERE name = :name LIMIT 1");
        $insertStmt = $this->db->prepare(
            "INSERT INTO dashboard_role_access (dashboard_id, role_id, granted_at)
             VALUES (:dashboard_id, :role_id, :granted_at)"
        );

        foreach ($allowed as $roleName) {
            $roleStmt->execute(['name' => $roleName]);
            $roleId = (int) $roleStmt->fetchColumn();
            if ($roleId <= 0) {
                continue;
            }

            $insertStmt->execute([
                'dashboard_id' => $dashboardId,
                'role_id' => $roleId,
                'granted_at' => date('Y-m-d H:i:s'),
            ]);
        }
    }
}
