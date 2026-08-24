<?php

namespace App\Repositories;

use App\Support\SecretCipher;
use PDO;

class CompanyDataSourceRepository
{
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
            'CREATE TABLE IF NOT EXISTS company_data_sources (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                connection_type VARCHAR(20) NOT NULL DEFAULT \'database\',
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                is_default TINYINT(1) NOT NULL DEFAULT 0,
                db_driver VARCHAR(20) NOT NULL DEFAULT \'mysql\',
                db_host VARCHAR(255) NOT NULL DEFAULT \'\',
                db_port VARCHAR(10) NOT NULL DEFAULT \'3306\',
                db_name VARCHAR(255) NOT NULL DEFAULT \'\',
                db_user VARCHAR(255) NOT NULL DEFAULT \'\',
                db_password TEXT NULL,
                db_ssl TINYINT(1) NOT NULL DEFAULT 0,
                db_charset VARCHAR(32) NOT NULL DEFAULT \'utf8mb4\',
                api_base_url TEXT NULL,
                api_auth_type VARCHAR(20) NOT NULL DEFAULT \'bearer\',
                api_token TEXT NULL,
                api_key_header VARCHAR(100) NOT NULL DEFAULT \'X-API-Key\',
                api_username VARCHAR(255) NOT NULL DEFAULT \'\',
                api_password TEXT NULL,
                api_test_path VARCHAR(255) NOT NULL DEFAULT \'\',
                last_tested_at DATETIME NULL,
                last_test_ok TINYINT(1) NULL,
                last_test_message VARCHAR(500) NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                updated_by INT NULL,
                FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
        );

        $indexStmt = $this->db->query(
            "SHOW INDEX FROM company_data_sources WHERE Key_name = 'idx_company_data_sources_default'"
        );
        if ($indexStmt && !$indexStmt->fetch()) {
            $this->db->exec(
                'CREATE INDEX idx_company_data_sources_default ON company_data_sources (is_default, is_active)'
            );
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listAll(): array
    {
        $stmt = $this->db->query(
            'SELECT * FROM company_data_sources ORDER BY is_default DESC, name ASC, id ASC'
        );
        $rows = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];

        $items = [];
        foreach ($rows as $row) {
            $items[] = $this->mapRow($row);
        }

        return $items;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM company_data_sources WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $this->mapRow($row) : null;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findDefault(): ?array
    {
        $stmt = $this->db->query(
            'SELECT * FROM company_data_sources
             WHERE is_default = 1 AND is_active = 1
             ORDER BY id ASC
             LIMIT 1'
        );
        $row = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : false;

        return is_array($row) ? $this->mapRow($row) : null;
    }

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data, int $userId): int
    {
        $now = date('Y-m-d H:i:s');
        $makeDefault = !empty($data['is_default']) || $this->count() === 0;

        if ($makeDefault) {
            $this->clearDefault();
        }

        $stmt = $this->db->prepare(
            'INSERT INTO company_data_sources (
                name, connection_type, is_active, is_default,
                db_driver, db_host, db_port, db_name, db_user, db_password, db_ssl, db_charset,
                api_base_url, api_auth_type, api_token, api_key_header, api_username, api_password, api_test_path,
                created_at, updated_at, updated_by
            ) VALUES (
                :name, :connection_type, :is_active, :is_default,
                :db_driver, :db_host, :db_port, :db_name, :db_user, :db_password, :db_ssl, :db_charset,
                :api_base_url, :api_auth_type, :api_token, :api_key_header, :api_username, :api_password, :api_test_path,
                :created_at, :updated_at, :updated_by
            )'
        );

        $stmt->execute([
            'name' => $data['name'],
            'connection_type' => $data['connection_type'],
            'is_active' => !empty($data['is_active']) ? 1 : 0,
            'is_default' => $makeDefault ? 1 : 0,
            'db_driver' => $data['db_driver'],
            'db_host' => $data['db_host'],
            'db_port' => $data['db_port'],
            'db_name' => $data['db_name'],
            'db_user' => $data['db_user'],
            'db_password' => SecretCipher::encrypt((string) $data['db_password']),
            'db_ssl' => !empty($data['db_ssl']) ? 1 : 0,
            'db_charset' => $data['db_charset'],
            'api_base_url' => $data['api_base_url'],
            'api_auth_type' => $data['api_auth_type'],
            'api_token' => SecretCipher::encrypt((string) $data['api_token']),
            'api_key_header' => $data['api_key_header'],
            'api_username' => $data['api_username'],
            'api_password' => SecretCipher::encrypt((string) $data['api_password']),
            'api_test_path' => $data['api_test_path'],
            'created_at' => $now,
            'updated_at' => $now,
            'updated_by' => $userId > 0 ? $userId : null,
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function update(int $id, array $data, int $userId): void
    {
        $current = $this->findById($id);
        if ($current === null) {
            throw new \RuntimeException('Fonte de dados não encontrada');
        }

        $makeDefault = !empty($data['is_default']);
        if ($makeDefault) {
            $this->clearDefault();
        }

        $dbPassword = array_key_exists('db_password', $data) && trim((string) $data['db_password']) !== ''
            ? SecretCipher::encrypt((string) $data['db_password'])
            : SecretCipher::encrypt((string) ($current['db_password'] ?? ''));

        $apiToken = array_key_exists('api_token', $data) && trim((string) $data['api_token']) !== ''
            ? SecretCipher::encrypt((string) $data['api_token'])
            : SecretCipher::encrypt((string) ($current['api_token'] ?? ''));

        $apiPassword = array_key_exists('api_password', $data) && trim((string) $data['api_password']) !== ''
            ? SecretCipher::encrypt((string) $data['api_password'])
            : SecretCipher::encrypt((string) ($current['api_password'] ?? ''));

        $stmt = $this->db->prepare(
            'UPDATE company_data_sources SET
                name = :name,
                connection_type = :connection_type,
                is_active = :is_active,
                is_default = :is_default,
                db_driver = :db_driver,
                db_host = :db_host,
                db_port = :db_port,
                db_name = :db_name,
                db_user = :db_user,
                db_password = :db_password,
                db_ssl = :db_ssl,
                db_charset = :db_charset,
                api_base_url = :api_base_url,
                api_auth_type = :api_auth_type,
                api_token = :api_token,
                api_key_header = :api_key_header,
                api_username = :api_username,
                api_password = :api_password,
                api_test_path = :api_test_path,
                updated_at = :updated_at,
                updated_by = :updated_by
             WHERE id = :id'
        );

        $stmt->execute([
            'id' => $id,
            'name' => $data['name'],
            'connection_type' => $data['connection_type'],
            'is_active' => !empty($data['is_active']) ? 1 : 0,
            'is_default' => $makeDefault ? 1 : 0,
            'db_driver' => $data['db_driver'],
            'db_host' => $data['db_host'],
            'db_port' => $data['db_port'],
            'db_name' => $data['db_name'],
            'db_user' => $data['db_user'],
            'db_password' => $dbPassword,
            'db_ssl' => !empty($data['db_ssl']) ? 1 : 0,
            'db_charset' => $data['db_charset'],
            'api_base_url' => $data['api_base_url'],
            'api_auth_type' => $data['api_auth_type'],
            'api_token' => $apiToken,
            'api_key_header' => $data['api_key_header'],
            'api_username' => $data['api_username'],
            'api_password' => $apiPassword,
            'api_test_path' => $data['api_test_path'],
            'updated_at' => date('Y-m-d H:i:s'),
            'updated_by' => $userId > 0 ? $userId : null,
        ]);
    }

    public function delete(int $id): void
    {
        $current = $this->findById($id);
        $stmt = $this->db->prepare('DELETE FROM company_data_sources WHERE id = :id');
        $stmt->execute(['id' => $id]);

        if ($current !== null && !empty($current['is_default'])) {
            $this->promoteFirstAsDefault();
        }
    }

    public function setDefault(int $id): void
    {
        $current = $this->findById($id);
        if ($current === null) {
            throw new \RuntimeException('Fonte de dados não encontrada');
        }

        $this->clearDefault();
        $stmt = $this->db->prepare(
            'UPDATE company_data_sources
             SET is_default = 1, is_active = 1, updated_at = :updated_at
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $id,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
    }

    public function recordTestResult(int $id, bool $ok, string $message): void
    {
        $stmt = $this->db->prepare(
            'UPDATE company_data_sources
             SET last_tested_at = :last_tested_at,
                 last_test_ok = :last_test_ok,
                 last_test_message = :last_test_message,
                 updated_at = :updated_at
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $id,
            'last_tested_at' => date('Y-m-d H:i:s'),
            'last_test_ok' => $ok ? 1 : 0,
            'last_test_message' => mb_substr($message, 0, 500),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
    }

    public function count(): int
    {
        $stmt = $this->db->query('SELECT COUNT(*) FROM company_data_sources');

        return (int) ($stmt ? $stmt->fetchColumn() : 0);
    }

    private function clearDefault(): void
    {
        $this->db->exec('UPDATE company_data_sources SET is_default = 0 WHERE is_default = 1');
    }

    private function promoteFirstAsDefault(): void
    {
        $stmt = $this->db->query(
            'SELECT id FROM company_data_sources WHERE is_active = 1 ORDER BY id ASC LIMIT 1'
        );
        $id = $stmt ? $stmt->fetchColumn() : false;
        if ($id === false) {
            return;
        }

        $update = $this->db->prepare('UPDATE company_data_sources SET is_default = 1 WHERE id = :id');
        $update->execute(['id' => (int) $id]);
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function mapRow(array $row): array
    {
        $dbPassword = SecretCipher::decrypt((string) ($row['db_password'] ?? ''));
        $apiToken = SecretCipher::decrypt((string) ($row['api_token'] ?? ''));
        $apiPassword = SecretCipher::decrypt((string) ($row['api_password'] ?? ''));

        return [
            'id' => (int) $row['id'],
            'name' => (string) $row['name'],
            'connection_type' => (string) $row['connection_type'],
            'is_active' => (int) $row['is_active'] === 1,
            'is_default' => (int) $row['is_default'] === 1,
            'db_driver' => (string) $row['db_driver'],
            'db_host' => (string) $row['db_host'],
            'db_port' => (string) $row['db_port'],
            'db_name' => (string) $row['db_name'],
            'db_user' => (string) $row['db_user'],
            'db_password' => $dbPassword,
            'db_ssl' => (int) $row['db_ssl'] === 1,
            'db_charset' => (string) ($row['db_charset'] ?? 'utf8mb4'),
            'api_base_url' => (string) ($row['api_base_url'] ?? ''),
            'api_auth_type' => (string) ($row['api_auth_type'] ?? 'bearer'),
            'api_token' => $apiToken,
            'api_key_header' => (string) ($row['api_key_header'] ?? 'X-API-Key'),
            'api_username' => (string) ($row['api_username'] ?? ''),
            'api_password' => $apiPassword,
            'api_test_path' => (string) ($row['api_test_path'] ?? ''),
            'last_tested_at' => isset($row['last_tested_at']) && $row['last_tested_at'] !== null
                ? (string) $row['last_tested_at']
                : null,
            'last_test_ok' => isset($row['last_test_ok']) && $row['last_test_ok'] !== null
                ? ((int) $row['last_test_ok'] === 1)
                : null,
            'last_test_message' => isset($row['last_test_message']) && $row['last_test_message'] !== null
                ? (string) $row['last_test_message']
                : null,
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
            'updated_by' => isset($row['updated_by']) && $row['updated_by'] !== null
                ? (int) $row['updated_by']
                : null,
            'has_db_password' => $dbPassword !== '',
            'has_api_token' => $apiToken !== '',
            'has_api_password' => $apiPassword !== '',
        ];
    }
}
