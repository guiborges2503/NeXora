<?php

namespace App\Repositories;

use PDO;

class PermissionRepository
{
    /** @var PDO */
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function roleHasPermission(string $roleName, string $permissionName): bool
    {
        $stmt = $this->db->prepare(
            'SELECT 1
             FROM role_permissions rp
             INNER JOIN roles r ON r.id = rp.role_id
             INNER JOIN permissions p ON p.id = rp.permission_id
             WHERE r.name = :role AND p.name = :permission
             LIMIT 1'
        );
        $stmt->execute([
            'role' => $roleName,
            'permission' => $permissionName,
        ]);

        return (bool) $stmt->fetchColumn();
    }
}
