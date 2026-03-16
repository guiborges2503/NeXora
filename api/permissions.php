<?php

include_once __DIR__ . '/settings/includes.php';
include_once __DIR__ . '/cors.php';

header('Content-Type: application/json; charset=utf-8');
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    \Shared\Response::error('Método não permitido', 405)->send();
}

try {
    $db = \Shared\Database::getInstance()->getConnection();

    $rolesStmt = $db->query(
        "SELECT
            r.id,
            r.name,
            r.description,
            COUNT(ur.user_id) AS users
         FROM roles r
         LEFT JOIN user_roles ur ON ur.role_id = r.id
         GROUP BY r.id, r.name, r.description
         ORDER BY r.name ASC"
    );
    $rolesRows = $rolesStmt ? $rolesStmt->fetchAll() : [];

    $roles = [];
    $roleNameById = [];
    foreach ($rolesRows as $row) {
        $roleName = (string) $row['name'];
        $roles[] = [
            'id' => $roleName,
            'name' => ucfirst($roleName),
            'description' => (string) $row['description'],
            'users' => (int) $row['users'],
        ];
        $roleNameById[(int) $row['id']] = $roleName;
    }

    $permissionsStmt = $db->query(
        "SELECT id, name, description
         FROM permissions
         ORDER BY name ASC"
    );
    $permissionsRows = $permissionsStmt ? $permissionsStmt->fetchAll() : [];

    $permissions = [];
    foreach ($permissionsRows as $row) {
        $permissions[] = [
            'id' => (string) $row['name'],
            'name' => (string) $row['name'],
            'description' => (string) $row['description'],
        ];
    }

    $rolePermissionsStmt = $db->query(
        "SELECT role_id, permission_id
         FROM role_permissions"
    );
    $rolePermissionsRows = $rolePermissionsStmt ? $rolePermissionsStmt->fetchAll() : [];

    $permissionNameById = [];
    foreach ($permissionsRows as $permission) {
        $permissionNameById[(int) $permission['id']] = (string) $permission['name'];
    }

    $rolePermissions = [];
    foreach ($roles as $role) {
        $rolePermissions[$role['id']] = [];
    }

    foreach ($rolePermissionsRows as $row) {
        $roleId = (int) $row['role_id'];
        $permissionId = (int) $row['permission_id'];
        $roleName = $roleNameById[$roleId] ?? null;
        $permissionName = $permissionNameById[$permissionId] ?? null;

        if ($roleName === null || $permissionName === null) {
            continue;
        }

        $rolePermissions[$roleName][] = $permissionName;
    }

    \Shared\Response::success([
        'roles' => $roles,
        'permissions' => $permissions,
        'rolePermissions' => $rolePermissions,
    ])->send();
} catch (Throwable $e) {
    \Shared\Logger::getInstance()->error('permissions: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
    ]);
    \Shared\Response::error('Erro interno', 500)->send();
}
