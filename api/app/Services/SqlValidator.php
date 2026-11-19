<?php

namespace App\Services;

use RuntimeException;

class SqlValidator
{
    /** @var string[] */
    private $allowedTables;

    /** @var int */
    private $maxRows;

    /**
     * @param string[] $allowedTables
     */
    public function __construct(array $allowedTables, int $maxRows = 500)
    {
        $this->allowedTables = array_map('strtolower', $allowedTables);
        $this->maxRows = $maxRows;
    }

    public function validateAndPrepare(string $sql): string
    {
        $normalized = adaptSqliteSelectToMysql(trim($sql));
        $normalized = preg_replace('/\s+/', ' ', $normalized) ?? $normalized;

        if ($normalized === '') {
            throw new RuntimeException('SQL vazio');
        }

        if (strpos($normalized, ';') !== false) {
            throw new RuntimeException('Apenas uma instrução SELECT é permitida');
        }

        if (!preg_match('/^SELECT\s/i', $normalized)) {
            throw new RuntimeException('Apenas consultas SELECT são permitidas');
        }

        $blocked = [
            'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'REPLACE',
            'ATTACH', 'DETACH', 'PRAGMA', 'VACUUM', 'REINDEX', 'TRUNCATE',
        ];

        foreach ($blocked as $keyword) {
            if (preg_match('/\b' . $keyword . '\b/i', $normalized)) {
                throw new RuntimeException('Palavra-chave SQL não permitida: ' . $keyword);
            }
        }

        $referencedTables = $this->extractTables($normalized);
        foreach ($referencedTables as $table) {
            if (!in_array($table, $this->allowedTables, true)) {
                throw new RuntimeException('Tabela não permitida: ' . $table);
            }
        }

        return $this->applyRowLimit($normalized);
    }

    /**
     * Garante o teto de linhas (RF-08): sem LIMIT, acrescenta o máximo;
     * com LIMIT acima do máximo, reduz para o máximo; abaixo, mantém.
     */
    private function applyRowLimit(string $sql): string
    {
        $pattern = '/\bLIMIT\s+(\d+)/i';

        if (!preg_match($pattern, $sql)) {
            return $sql . ' LIMIT ' . $this->maxRows;
        }

        $maxRows = $this->maxRows;

        return preg_replace_callback(
            $pattern,
            static function (array $match) use ($maxRows): string {
                return (int) $match[1] > $maxRows ? 'LIMIT ' . $maxRows : $match[0];
            },
            $sql
        ) ?? $sql;
    }

    /**
     * @return string[]
     */
    private function extractTables(string $sql): array
    {
        $tables = [];
        $pattern = '/\b(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)/i';
        if (preg_match_all($pattern, $sql, $matches)) {
            foreach ($matches[1] as $table) {
                $tables[] = strtolower((string) $table);
            }
        }

        return array_values(array_unique($tables));
    }
}
