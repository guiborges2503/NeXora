<?php

namespace App\Services;

use PDO;

class DatabaseSchemaService
{
    /** @var string[]|null */
    private static ?array $requiredTables = null;

    /**
     * @return string[]
     */
    public function getRequiredTables(): array
    {
        if (self::$requiredTables === null) {
            $path = __DIR__ . '/../../database/required_tables.php';
            if (!is_readable($path)) {
                throw new \RuntimeException('Arquivo de tabelas obrigatórias não encontrado: database/required_tables.php');
            }

            $tables = require $path;
            if (!is_array($tables)) {
                throw new \RuntimeException('database/required_tables.php deve retornar um array de nomes de tabelas');
            }

            self::$requiredTables = array_values(array_unique(array_map('strval', $tables)));
        }

        return self::$requiredTables;
    }

    /**
     * @return array{
     *     ok: bool,
     *     required_count: int,
     *     present_count: int,
     *     missing: string[],
     *     present: string[],
     *     schema_source: string
     * }
     */
    public function validate(PDO $pdo): array
    {
        $required = $this->getRequiredTables();
        $present = $this->fetchExistingTables($pdo, $required);
        $missing = array_values(array_diff($required, $present));

        sort($missing);
        sort($present);

        return [
            'ok' => count($missing) === 0,
            'required_count' => count($required),
            'present_count' => count($present),
            'missing' => $missing,
            'present' => $present,
            'schema_source' => 'database/install_mysql.sql',
        ];
    }

    /**
     * @param string[] $required
     * @return string[]
     */
    private function fetchExistingTables(PDO $pdo, array $required): array
    {
        if ($required === []) {
            return [];
        }

        $placeholders = implode(', ', array_fill(0, count($required), '?'));
        $sql = "
            SELECT TABLE_NAME
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME IN ($placeholders)
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_merge([DB_NAME], $required));

        $found = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $found[] = (string) $row['TABLE_NAME'];
        }

        return $found;
    }
}
