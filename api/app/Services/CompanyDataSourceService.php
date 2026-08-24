<?php

namespace App\Services;

use PDO;
use PDOException;
use RuntimeException;

class CompanyDataSourceService
{
    private const ALLOWED_DRIVERS = ['mysql', 'pgsql', 'sqlsrv'];
    private const ALLOWED_TYPES = ['database', 'api'];
    private const ALLOWED_AUTH = ['none', 'bearer', 'api_key', 'basic'];

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function normalizePayload(array $payload, bool $isUpdate = false): array
    {
        $type = strtolower(trim((string) ($payload['connection_type'] ?? 'database')));
        if (!in_array($type, self::ALLOWED_TYPES, true)) {
            $type = 'database';
        }

        $driver = strtolower(trim((string) ($payload['db_driver'] ?? 'mysql')));
        if (!in_array($driver, self::ALLOWED_DRIVERS, true)) {
            $driver = 'mysql';
        }

        $auth = strtolower(trim((string) ($payload['api_auth_type'] ?? 'bearer')));
        if (!in_array($auth, self::ALLOWED_AUTH, true)) {
            $auth = 'bearer';
        }

        $name = trim((string) ($payload['name'] ?? ''));
        $port = trim((string) ($payload['db_port'] ?? ''));
        if ($port === '') {
            $port = $this->defaultPort($driver);
        }

        $header = trim((string) ($payload['api_key_header'] ?? 'X-API-Key'));
        if ($header === '') {
            $header = 'X-API-Key';
        }

        return [
            'name' => $name,
            'connection_type' => $type,
            'is_active' => $this->toBool($payload['is_active'] ?? true),
            'is_default' => $this->toBool($payload['is_default'] ?? false),
            'db_driver' => $driver,
            'db_host' => trim((string) ($payload['db_host'] ?? '')),
            'db_port' => $port,
            'db_name' => trim((string) ($payload['db_name'] ?? '')),
            'db_user' => trim((string) ($payload['db_user'] ?? '')),
            'db_password' => (string) ($payload['db_password'] ?? ''),
            'keep_db_password' => $this->toBool($payload['keep_db_password'] ?? $isUpdate),
            'db_ssl' => $this->toBool($payload['db_ssl'] ?? false),
            'db_charset' => trim((string) ($payload['db_charset'] ?? 'utf8mb4')) ?: 'utf8mb4',
            'api_base_url' => trim((string) ($payload['api_base_url'] ?? '')),
            'api_auth_type' => $auth,
            'api_token' => (string) ($payload['api_token'] ?? ''),
            'keep_api_token' => $this->toBool($payload['keep_api_token'] ?? $isUpdate),
            'api_key_header' => $header,
            'api_username' => trim((string) ($payload['api_username'] ?? '')),
            'api_password' => (string) ($payload['api_password'] ?? ''),
            'keep_api_password' => $this->toBool($payload['keep_api_password'] ?? $isUpdate),
            'api_test_path' => trim((string) ($payload['api_test_path'] ?? '')),
        ];
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, string>
     */
    public function validate(array $data, bool $requireSecrets): array
    {
        $errors = [];

        if ($data['name'] === '') {
            $errors['name'] = 'Informe um nome para identificar esta conexão';
        } elseif (mb_strlen($data['name']) > 255) {
            $errors['name'] = 'O nome deve ter no máximo 255 caracteres';
        }

        if ($data['connection_type'] === 'database') {
            if ($data['db_host'] === '') {
                $errors['db_host'] = 'Informe o host do banco de dados';
            }
            if ($data['db_name'] === '') {
                $errors['db_name'] = 'Informe o nome do banco';
            }
            if ($data['db_user'] === '') {
                $errors['db_user'] = 'Informe o usuário do banco';
            }
            if (!preg_match('/^\d{1,5}$/', (string) $data['db_port'])) {
                $errors['db_port'] = 'Informe uma porta válida';
            }
            if ($requireSecrets && trim((string) $data['db_password']) === '' && empty($data['keep_db_password'])) {
                $errors['db_password'] = 'Informe a senha do usuário do banco';
            }
        } else {
            $urlError = $this->validateHttpUrl((string) $data['api_base_url']);
            if ($urlError !== null) {
                $errors['api_base_url'] = $urlError;
            }

            if ($data['api_auth_type'] === 'bearer' || $data['api_auth_type'] === 'api_key') {
                if ($requireSecrets && trim((string) $data['api_token']) === '' && empty($data['keep_api_token'])) {
                    $errors['api_token'] = 'Informe o token ou a chave da API';
                }
            }

            if ($data['api_auth_type'] === 'basic') {
                if ($data['api_username'] === '') {
                    $errors['api_username'] = 'Informe o usuário da API';
                }
                if ($requireSecrets && trim((string) $data['api_password']) === '' && empty($data['keep_api_password'])) {
                    $errors['api_password'] = 'Informe a senha da API';
                }
            }
        }

        return $errors;
    }

    /**
     * @param array<string, mixed> $data
     * @return array{ok: bool, message: string, details: array<string, mixed>}
     */
    public function testConnection(array $data): array
    {
        if ($data['connection_type'] === 'api') {
            return $this->testApi($data);
        }

        return $this->testDatabase($data);
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    public function toPublic(array $row): array
    {
        unset($row['db_password'], $row['api_token'], $row['api_password']);

        $row['api_token_masked'] = !empty($row['has_api_token']) ? '••••••••' : '';
        $row['db_password_masked'] = !empty($row['has_db_password']) ? '••••••••' : '';
        $row['api_password_masked'] = !empty($row['has_api_password']) ? '••••••••' : '';

        return $row;
    }

    /**
     * @param array<string, mixed> $incoming
     * @param array<string, mixed>|null $stored
     * @return array<string, mixed>
     */
    public function mergeSecrets(array $incoming, ?array $stored): array
    {
        if ($stored === null) {
            return $incoming;
        }

        if (trim((string) $incoming['db_password']) === '' && !empty($incoming['keep_db_password'])) {
            $incoming['db_password'] = (string) ($stored['db_password'] ?? '');
        }
        if (trim((string) $incoming['api_token']) === '' && !empty($incoming['keep_api_token'])) {
            $incoming['api_token'] = (string) ($stored['api_token'] ?? '');
        }
        if (trim((string) $incoming['api_password']) === '' && !empty($incoming['keep_api_password'])) {
            $incoming['api_password'] = (string) ($stored['api_password'] ?? '');
        }

        return $incoming;
    }

    /**
     * @param array<string, mixed> $data
     * @return array{ok: bool, message: string, details: array<string, mixed>}
     */
    private function testDatabase(array $data): array
    {
        $driver = (string) $data['db_driver'];
        $pdoDriver = $driver === 'pgsql' ? 'pgsql' : ($driver === 'sqlsrv' ? 'sqlsrv' : 'mysql');

        if (!in_array($pdoDriver, PDO::getAvailableDrivers(), true)) {
            return [
                'ok' => false,
                'message' => "O driver PDO {$pdoDriver} não está habilitado neste servidor PHP.",
                'details' => ['driver' => $pdoDriver],
            ];
        }

        try {
            $pdo = $this->openPdo($data);
            $tableCount = $this->countTables($pdo, $driver, (string) $data['db_name']);
            $pdo = null;

            $message = $tableCount !== null
                ? "Conexão OK. O banco respondeu e possui {$tableCount} tabela(s)."
                : 'Conexão OK. O banco aceitou o usuário e respondeu ao teste.';

            return [
                'ok' => true,
                'message' => $message,
                'details' => [
                    'driver' => $driver,
                    'table_count' => $tableCount,
                ],
            ];
        } catch (PDOException $e) {
            return [
                'ok' => false,
                'message' => $this->sanitizeError($e->getMessage()),
                'details' => ['driver' => $driver],
            ];
        } catch (RuntimeException $e) {
            return [
                'ok' => false,
                'message' => $e->getMessage(),
                'details' => ['driver' => $driver],
            ];
        }
    }

    /**
     * @param array<string, mixed> $data
     */
    private function openPdo(array $data): PDO
    {
        $driver = (string) $data['db_driver'];
        $host = (string) $data['db_host'];
        $port = (string) $data['db_port'];
        $name = (string) $data['db_name'];
        $charset = (string) ($data['db_charset'] ?? 'utf8mb4');
        $ssl = !empty($data['db_ssl']);

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 8,
        ];

        if ($driver === 'pgsql') {
            $dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s', $host, $port, $name);
            if ($ssl) {
                $dsn .= ';sslmode=require';
            }
        } elseif ($driver === 'sqlsrv') {
            $dsn = sprintf('sqlsrv:Server=%s,%s;Database=%s', $host, $port, $name);
            if ($ssl && defined('PDO::SQLSRV_ATTR_ENCRYPT')) {
                $options[PDO::SQLSRV_ATTR_ENCRYPT] = true;
            }
        } else {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                $host,
                $port,
                $name,
                $charset
            );
            if ($ssl && defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) {
                $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
            }
        }

        return new PDO($dsn, (string) $data['db_user'], (string) $data['db_password'], $options);
    }

    private function countTables(PDO $pdo, string $driver, string $dbName): ?int
    {
        try {
            if ($driver === 'pgsql') {
                $stmt = $pdo->query(
                    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
                );
            } elseif ($driver === 'sqlsrv') {
                $stmt = $pdo->query('SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES');
            } else {
                $stmt = $pdo->prepare(
                    'SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = :schema'
                );
                $stmt->execute(['schema' => $dbName]);
            }

            if (!$stmt) {
                return null;
            }

            return (int) $stmt->fetchColumn();
        } catch (PDOException $e) {
            return null;
        }
    }

    /**
     * @param array<string, mixed> $data
     * @return array{ok: bool, message: string, details: array<string, mixed>}
     */
    private function testApi(array $data): array
    {
        $urlError = $this->validateHttpUrl((string) $data['api_base_url']);
        if ($urlError !== null) {
            return ['ok' => false, 'message' => $urlError, 'details' => []];
        }

        $url = $this->joinUrl((string) $data['api_base_url'], (string) $data['api_test_path']);
        $headers = $this->buildAuthHeaders($data);

        try {
            $result = $this->httpGet($url, $headers);
        } catch (RuntimeException $e) {
            return [
                'ok' => false,
                'message' => $this->sanitizeError($e->getMessage()),
                'details' => ['url' => $url],
            ];
        }

        $status = $result['status'];
        if ($status >= 200 && $status < 400) {
            return [
                'ok' => true,
                'message' => "Conexão OK. A API respondeu HTTP {$status} em {$url}.",
                'details' => [
                    'url' => $url,
                    'status' => $status,
                ],
            ];
        }

        return [
            'ok' => false,
            'message' => "A API respondeu HTTP {$status}. Verifique a URL, o caminho de teste e as credenciais.",
            'details' => [
                'url' => $url,
                'status' => $status,
            ],
        ];
    }

    /**
     * @param array<string, mixed> $data
     * @return list<string>
     */
    private function buildAuthHeaders(array $data): array
    {
        $headers = ['Accept: application/json', 'User-Agent: NeXora-DataSource/1.0'];
        $auth = (string) $data['api_auth_type'];

        if ($auth === 'bearer' && trim((string) $data['api_token']) !== '') {
            $headers[] = 'Authorization: Bearer ' . trim((string) $data['api_token']);
        } elseif ($auth === 'api_key' && trim((string) $data['api_token']) !== '') {
            $headerName = preg_replace('/[^A-Za-z0-9\-]/', '', (string) $data['api_key_header']) ?: 'X-API-Key';
            $headers[] = $headerName . ': ' . trim((string) $data['api_token']);
        } elseif ($auth === 'basic') {
            $headers[] = 'Authorization: Basic ' . base64_encode(
                (string) $data['api_username'] . ':' . (string) $data['api_password']
            );
        }

        return $headers;
    }

    /**
     * @param list<string> $headers
     * @return array{status: int, body: string}
     */
    private function httpGet(string $url, array $headers): array
    {
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_HTTPGET => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 15,
                CURLOPT_CONNECTTIMEOUT => 8,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_MAXREDIRS => 3,
                CURLOPT_HTTPHEADER => $headers,
            ]);

            $sslVerify = defined('OPENROUTER_SSL_VERIFY') ? OPENROUTER_SSL_VERIFY : true;
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, $sslVerify);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, $sslVerify ? 2 : 0);

            $body = curl_exec($ch);
            $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            if ($body === false) {
                throw new RuntimeException('Falha ao conectar na API: ' . $error);
            }

            return ['status' => $status, 'body' => (string) $body];
        }

        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => implode("\r\n", $headers),
                'timeout' => 15,
                'ignore_errors' => true,
            ],
        ]);

        $body = @file_get_contents($url, false, $context);
        if ($body === false) {
            throw new RuntimeException('Falha ao conectar na API');
        }

        $status = 0;
        if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
            $status = (int) $m[1];
        }

        return ['status' => $status, 'body' => $body];
    }

    private function joinUrl(string $base, string $path): string
    {
        $base = rtrim($base, '/');
        $path = trim($path);
        if ($path === '' || $path === '/') {
            return $base;
        }
        if (preg_match('#^https?://#i', $path)) {
            return $path;
        }

        return $base . '/' . ltrim($path, '/');
    }

    private function validateHttpUrl(string $url): ?string
    {
        $url = trim($url);
        if ($url === '') {
            return 'Informe a URL base da API';
        }

        $parts = parse_url($url);
        if (!is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
            return 'Informe uma URL válida, incluindo https://';
        }

        $scheme = strtolower((string) $parts['scheme']);
        if ($scheme !== 'https' && $scheme !== 'http') {
            return 'A URL da API deve começar com http:// ou https://';
        }

        return null;
    }

    private function defaultPort(string $driver): string
    {
        if ($driver === 'pgsql') {
            return '5432';
        }
        if ($driver === 'sqlsrv') {
            return '1433';
        }

        return '3306';
    }

    /** @param mixed $value */
    private function toBool($value): bool
    {
        if (is_bool($value)) {
            return $value;
        }
        if (is_numeric($value)) {
            return (int) $value === 1;
        }

        return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on'], true);
    }

    private function sanitizeError(string $message): string
    {
        $message = preg_replace('/password=[^;\s]+/i', 'password=***', $message) ?? $message;
        $message = preg_replace('/pwd=[^;\s]+/i', 'pwd=***', $message) ?? $message;

        return mb_substr($message, 0, 400);
    }
}
