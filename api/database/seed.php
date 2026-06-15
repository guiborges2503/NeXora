<?php

include_once __DIR__ . '/../settings/includes.php';

use Shared\Database;

try {
    $db = Database::getInstance()->getConnection();

    $seedersDir = __DIR__ . '/seeders';
    $files = glob($seedersDir . '/*.sql') ?: [];
    sort($files);

    foreach ($files as $filePath) {
        $filename = basename($filePath);
        $sql = file_get_contents($filePath);
        if ($sql === false) {
            throw new RuntimeException("Não foi possível ler o seeder {$filename}");
        }

        $db->exec($sql);
        echo "[OK] Seeder aplicado: {$filename}" . PHP_EOL;
    }

    $adminEmail = 'admin@nexora.local';
    $checkAdmin = $db->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $checkAdmin->execute(['email' => $adminEmail]);
    $adminId = $checkAdmin->fetchColumn();

    if (!$adminId) {
        $insertUser = $db->prepare(
            "INSERT INTO users (name, email, password_hash, status, created_at, updated_at)
             VALUES (:name, :email, :password_hash, :status, :created_at, :updated_at)"
        );
        $now = date('Y-m-d H:i:s');
        $insertUser->execute([
            'name' => 'Administrador',
            'email' => $adminEmail,
            'password_hash' => password_hash('admin123', PASSWORD_DEFAULT),
            'status' => 'active',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $adminId = (int) $db->lastInsertId();
        echo "[OK] Usuário admin criado: {$adminEmail} / admin123" . PHP_EOL;
    }

    $adminRoleIdStmt = $db->query("SELECT id FROM roles WHERE name = 'admin' LIMIT 1");
    $adminRoleId = (int) $adminRoleIdStmt->fetchColumn();

    if ($adminRoleId > 0 && (int) $adminId > 0) {
        $assign = $db->prepare(
            "INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_at)
             VALUES (:user_id, :role_id, :assigned_at)"
        );
        $assign->execute([
            'user_id' => (int) $adminId,
            'role_id' => $adminRoleId,
            'assigned_at' => date('Y-m-d H:i:s'),
        ]);
    }

    $rolesStmt = $db->query('SELECT id, name FROM roles');
    $roles = $rolesStmt ? $rolesStmt->fetchAll() : [];

    $permissionsStmt = $db->query('SELECT id, name FROM permissions');
    $permissions = $permissionsStmt ? $permissionsStmt->fetchAll() : [];

    $permissionIdByName = [];
    foreach ($permissions as $permission) {
        $permissionIdByName[$permission['name']] = (int) $permission['id'];
    }

    $rolePermissionsMap = [
        'admin' => ['users.read', 'users.write', 'dashboards.read', 'dashboards.write', 'alerts.read', 'audit.read'],
        'manager' => ['users.read', 'dashboards.read', 'dashboards.write', 'alerts.read', 'audit.read'],
        'viewer' => ['dashboards.read', 'alerts.read'],
    ];

    $assignRolePermissionStmt = $db->prepare(
        "INSERT OR IGNORE INTO role_permissions (role_id, permission_id, granted_at)
         VALUES (:role_id, :permission_id, :granted_at)"
    );

    foreach ($roles as $role) {
        $roleName = (string) $role['name'];
        $roleId = (int) $role['id'];
        $permissionNames = $rolePermissionsMap[$roleName] ?? [];

        foreach ($permissionNames as $permissionName) {
            if (!isset($permissionIdByName[$permissionName])) {
                continue;
            }

            $assignRolePermissionStmt->execute([
                'role_id' => $roleId,
                'permission_id' => $permissionIdByName[$permissionName],
                'granted_at' => date('Y-m-d H:i:s'),
            ]);
        }
    }

    $alertsCount = (int) $db->query('SELECT COUNT(*) FROM alerts')->fetchColumn();
    if ($alertsCount === 0 && (int) $adminId > 0) {
        $insertAlert = $db->prepare(
            "INSERT INTO alerts (user_id, title, message, level, is_read, created_at)
             VALUES (:user_id, :title, :message, :level, :is_read, :created_at)"
        );

        $sampleAlerts = [
            ['Queda nas vendas online', 'Redução de 15% no período semanal', 'high', 0],
            ['Taxa de churn acima da média', 'Cancelamentos 8% acima da média histórica', 'medium', 0],
            ['Meta trimestral atingida', 'Equipe comercial superou 102% da meta', 'info', 1],
        ];

        foreach ($sampleAlerts as $sampleAlert) {
            $insertAlert->execute([
                'user_id' => (int) $adminId,
                'title' => $sampleAlert[0],
                'message' => $sampleAlert[1],
                'level' => $sampleAlert[2],
                'is_read' => $sampleAlert[3],
                'created_at' => date('Y-m-d H:i:s', strtotime('-' . rand(1, 48) . ' hours')),
            ]);
        }
    }

    $auditCount = (int) $db->query('SELECT COUNT(*) FROM audit_logs')->fetchColumn();
    if ($auditCount === 0) {
        $insertAudit = $db->prepare(
            "INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata, created_at)
             VALUES (:user_id, :action, :entity, :entity_id, :metadata, :created_at)"
        );

        $sampleLogs = [
            ['login', 'auth', (string) $adminId, json_encode(['message' => 'Login realizado com sucesso']), '-2 hours'],
            ['create', 'dashboard', '1', json_encode(['name' => 'Dashboard Comercial']), '-6 hours'],
            ['read', 'alerts', null, json_encode(['message' => 'Consulta de alertas']), '-1 day'],
        ];

        foreach ($sampleLogs as $sampleLog) {
            $insertAudit->execute([
                'user_id' => (int) $adminId,
                'action' => $sampleLog[0],
                'entity' => $sampleLog[1],
                'entity_id' => $sampleLog[2],
                'metadata' => $sampleLog[3],
                'created_at' => date('Y-m-d H:i:s', strtotime($sampleLog[4])),
            ]);
        }
    }

    echo "Seed finalizado com sucesso." . PHP_EOL;

    $customersCount = (int) $db->query('SELECT COUNT(*) FROM customers')->fetchColumn();
    if ($customersCount === 0) {
        $insertCustomer = $db->prepare(
            "INSERT INTO customers (name, segment, region_id, created_at)
             VALUES (:name, :segment, (SELECT id FROM regions WHERE code = :code LIMIT 1), :created_at)"
        );

        $sampleCustomers = [
            ['TechNova Ltda', 'enterprise', 'SE'],
            ['Comercial Alfa', 'pme', 'SUL'],
            ['Distribuidora Beta', 'pme', 'NE'],
            ['Indústria Gama', 'enterprise', 'CO'],
            ['Varejo Delta', 'geral', 'N'],
            ['Serviços Omega', 'pme', 'SE'],
        ];

        foreach ($sampleCustomers as $customer) {
            $insertCustomer->execute([
                'name' => $customer[0],
                'segment' => $customer[1],
                'code' => $customer[2],
                'created_at' => date('Y-m-d H:i:s'),
            ]);
        }

        echo "[OK] Clientes de exemplo criados" . PHP_EOL;
    }

    $salesCount = (int) $db->query('SELECT COUNT(*) FROM sales')->fetchColumn();
    if ($salesCount === 0) {
        $insertSale = $db->prepare(
            "INSERT INTO sales (
                sale_date, customer_id, product_id, region_id,
                quantity, unit_price, total_amount, seller_name, created_at
             )
             SELECT
                :sale_date,
                (SELECT id FROM customers ORDER BY id LIMIT 1 OFFSET :customer_offset),
                (SELECT id FROM products ORDER BY id LIMIT 1 OFFSET :product_offset),
                (SELECT id FROM regions WHERE code = :region_code LIMIT 1),
                :quantity,
                (SELECT unit_price FROM products ORDER BY id LIMIT 1 OFFSET :product_offset),
                :total_amount,
                :seller_name,
                :created_at"
        );

        $sellers = ['Ana Souza', 'Bruno Lima', 'Carla Mendes', 'Diego Rocha', 'Elena Pires'];
        $regions = ['SUL', 'SE', 'NE', 'CO', 'N'];

        for ($i = 0; $i < 40; $i++) {
            $quantity = rand(1, 5);
            $productOffset = $i % 7;
            $unitPriceStmt = $db->prepare('SELECT unit_price FROM products ORDER BY id LIMIT 1 OFFSET :offset');
            $unitPriceStmt->execute(['offset' => $productOffset]);
            $unitPrice = (float) $unitPriceStmt->fetchColumn();
            $total = round($unitPrice * $quantity, 2);

            $insertSale->execute([
                'sale_date' => date('Y-m-d', strtotime('-' . rand(1, 180) . ' days')),
                'customer_offset' => $i % 6,
                'product_offset' => $productOffset,
                'region_code' => $regions[$i % count($regions)],
                'quantity' => $quantity,
                'total_amount' => $total,
                'seller_name' => $sellers[$i % count($sellers)],
                'created_at' => date('Y-m-d H:i:s'),
            ]);
        }

        echo "[OK] Vendas de exemplo criadas" . PHP_EOL;
    }
} catch (Throwable $e) {
    fwrite(STDERR, "[ERRO] " . $e->getMessage() . PHP_EOL);
    exit(1);
}
