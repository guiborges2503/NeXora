<?php

namespace App\Repositories;

use PDO;

class AlertSettingsRepository
{
    private const ROW_ID = 1;

    /** @var PDO */
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->ensureSchema();
    }

    public function ensureSchema(): void
    {
        $this->db->exec(
            'CREATE TABLE IF NOT EXISTS alert_settings (
                id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
                notify_email TINYINT(1) NOT NULL DEFAULT 1,
                notify_in_app TINYINT(1) NOT NULL DEFAULT 1,
                sales_drop_enabled TINYINT(1) NOT NULL DEFAULT 1,
                sales_drop_percent DECIMAL(6,2) NOT NULL DEFAULT 15.00,
                stock_low_enabled TINYINT(1) NOT NULL DEFAULT 1,
                stock_low_qty INT NOT NULL DEFAULT 10,
                inactive_customers_enabled TINYINT(1) NOT NULL DEFAULT 1,
                inactive_days INT NOT NULL DEFAULT 30,
                finance_goal_enabled TINYINT(1) NOT NULL DEFAULT 0,
                finance_goal_percent DECIMAL(6,2) NOT NULL DEFAULT 80.00,
                updated_at DATETIME NOT NULL,
                updated_by INT NULL,
                FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
        );

        $exists = $this->db->query('SELECT 1 FROM alert_settings WHERE id = 1 LIMIT 1');
        if ($exists && $exists->fetchColumn()) {
            return;
        }

        $stmt = $this->db->prepare(
            'INSERT INTO alert_settings (
                id, notify_email, notify_in_app,
                sales_drop_enabled, sales_drop_percent,
                stock_low_enabled, stock_low_qty,
                inactive_customers_enabled, inactive_days,
                finance_goal_enabled, finance_goal_percent,
                updated_at
            ) VALUES (
                1, 1, 1, 1, 15, 1, 10, 1, 30, 0, 80, :updated_at
            )'
        );
        $stmt->execute(['updated_at' => date('Y-m-d H:i:s')]);
    }

    /**
     * @return array<string, mixed>
     */
    public function get(): array
    {
        $stmt = $this->db->prepare('SELECT * FROM alert_settings WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => self::ROW_ID]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!is_array($row)) {
            return $this->defaults();
        }

        return [
            'notify_email' => (int) $row['notify_email'] === 1,
            'notify_in_app' => (int) $row['notify_in_app'] === 1,
            'sales_drop_enabled' => (int) $row['sales_drop_enabled'] === 1,
            'sales_drop_percent' => (float) $row['sales_drop_percent'],
            'stock_low_enabled' => (int) $row['stock_low_enabled'] === 1,
            'stock_low_qty' => (int) $row['stock_low_qty'],
            'inactive_customers_enabled' => (int) $row['inactive_customers_enabled'] === 1,
            'inactive_days' => (int) $row['inactive_days'],
            'finance_goal_enabled' => (int) $row['finance_goal_enabled'] === 1,
            'finance_goal_percent' => (float) $row['finance_goal_percent'],
            'updated_at' => (string) ($row['updated_at'] ?? ''),
        ];
    }

    /**
     * @param array<string, mixed> $data
     */
    public function save(array $data, int $userId): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO alert_settings (
                id, notify_email, notify_in_app,
                sales_drop_enabled, sales_drop_percent,
                stock_low_enabled, stock_low_qty,
                inactive_customers_enabled, inactive_days,
                finance_goal_enabled, finance_goal_percent,
                updated_at, updated_by
            ) VALUES (
                :id, :notify_email, :notify_in_app,
                :sales_drop_enabled, :sales_drop_percent,
                :stock_low_enabled, :stock_low_qty,
                :inactive_customers_enabled, :inactive_days,
                :finance_goal_enabled, :finance_goal_percent,
                :updated_at, :updated_by
            )
            ON DUPLICATE KEY UPDATE
                notify_email = VALUES(notify_email),
                notify_in_app = VALUES(notify_in_app),
                sales_drop_enabled = VALUES(sales_drop_enabled),
                sales_drop_percent = VALUES(sales_drop_percent),
                stock_low_enabled = VALUES(stock_low_enabled),
                stock_low_qty = VALUES(stock_low_qty),
                inactive_customers_enabled = VALUES(inactive_customers_enabled),
                inactive_days = VALUES(inactive_days),
                finance_goal_enabled = VALUES(finance_goal_enabled),
                finance_goal_percent = VALUES(finance_goal_percent),
                updated_at = VALUES(updated_at),
                updated_by = VALUES(updated_by)'
        );

        $stmt->execute([
            'id' => self::ROW_ID,
            'notify_email' => !empty($data['notify_email']) ? 1 : 0,
            'notify_in_app' => !empty($data['notify_in_app']) ? 1 : 0,
            'sales_drop_enabled' => !empty($data['sales_drop_enabled']) ? 1 : 0,
            'sales_drop_percent' => $this->clampNumber($data['sales_drop_percent'] ?? 15, 1, 100),
            'stock_low_enabled' => !empty($data['stock_low_enabled']) ? 1 : 0,
            'stock_low_qty' => (int) $this->clampNumber($data['stock_low_qty'] ?? 10, 0, 1000000),
            'inactive_customers_enabled' => !empty($data['inactive_customers_enabled']) ? 1 : 0,
            'inactive_days' => (int) $this->clampNumber($data['inactive_days'] ?? 30, 1, 3650),
            'finance_goal_enabled' => !empty($data['finance_goal_enabled']) ? 1 : 0,
            'finance_goal_percent' => $this->clampNumber($data['finance_goal_percent'] ?? 80, 1, 100),
            'updated_at' => date('Y-m-d H:i:s'),
            'updated_by' => $userId > 0 ? $userId : null,
        ]);
    }

    public function markResolved(int $id, int $userId): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE alerts SET is_read = 1 WHERE id = :id AND user_id = :user_id'
        );
        $stmt->execute(['id' => $id, 'user_id' => $userId]);

        if ($stmt->rowCount() > 0) {
            return true;
        }

        $any = $this->db->prepare('UPDATE alerts SET is_read = 1 WHERE id = :id');
        $any->execute(['id' => $id]);

        return $any->rowCount() > 0;
    }

    /** @return array<string, mixed> */
    private function defaults(): array
    {
        return [
            'notify_email' => true,
            'notify_in_app' => true,
            'sales_drop_enabled' => true,
            'sales_drop_percent' => 15,
            'stock_low_enabled' => true,
            'stock_low_qty' => 10,
            'inactive_customers_enabled' => true,
            'inactive_days' => 30,
            'finance_goal_enabled' => false,
            'finance_goal_percent' => 80,
            'updated_at' => '',
        ];
    }

    /** @param mixed $value */
    private function clampNumber($value, float $min, float $max): float
    {
        $number = is_numeric($value) ? (float) $value : $min;
        if ($number < $min) {
            return $min;
        }
        if ($number > $max) {
            return $max;
        }

        return $number;
    }
}
