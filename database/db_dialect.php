<?php

/**
 * Helpers SQL usados em runtime pela API (MySQL).
 */

/**
 * Converte funções SQLite comuns em consultas SELECT para sintaxe MySQL.
 */
function adaptSqliteSelectToMysql(string $sql): string
{
    $sql = preg_replace_callback(
        "/strftime\s*\(\s*'([^']+)'\s*,\s*([^)]+)\)/i",
        static function (array $matches): string {
            $format = $matches[1];
            $expr = trim($matches[2]);
            if (preg_match("/^'now'$/i", $expr)) {
                $expr = 'CURDATE()';
            }

            return "DATE_FORMAT({$expr}, '{$format}')";
        },
        $sql
    );

    $sql = preg_replace(
        "/date\s*\(\s*'now'\s*,\s*'-(\d+)\s+months?'\s*\)/i",
        'DATE_SUB(CURDATE(), INTERVAL $1 MONTH)',
        $sql
    );
    $sql = preg_replace(
        "/date\s*\(\s*'now'\s*,\s*'-(\d+)\s+days?'\s*\)/i",
        'DATE_SUB(CURDATE(), INTERVAL $1 DAY)',
        $sql
    );
    $sql = preg_replace(
        "/date\s*\(\s*'now'\s*,\s*'\+(\d+)\s+months?'\s*\)/i",
        'DATE_ADD(CURDATE(), INTERVAL $1 MONTH)',
        $sql
    );
    $sql = preg_replace(
        "/date\s*\(\s*'now'\s*,\s*'\+(\d+)\s+days?'\s*\)/i",
        'DATE_ADD(CURDATE(), INTERVAL $1 DAY)',
        $sql
    );
    $sql = preg_replace(
        "/date\s*\(\s*'now'\s*,\s*'start of month'\s*\)/i",
        "DATE_FORMAT(CURDATE(), '%Y-%m-01')",
        $sql
    );
    $sql = preg_replace("/date\s*\(\s*'now'\s*\)/i", 'CURDATE()', $sql);
    $sql = preg_replace("/datetime\s*\(\s*'now'\s*\)/i", 'NOW()', $sql);

    return $sql;
}

function insertIgnoreSql(string $table, string $columns, string $placeholders): string
{
    return "INSERT IGNORE INTO {$table} ({$columns}) VALUES ({$placeholders})";
}

function sqlOrderByDateTime(string $column, string $direction = 'DESC'): string
{
    return "{$column} {$direction}";
}

function sqlCountAuditToday(): string
{
    return 'SELECT COUNT(*) FROM audit_logs WHERE DATE(created_at) = CURDATE()';
}

function sqlCountAuditSinceDays(int $days): string
{
    return "SELECT COUNT(*) FROM audit_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL {$days} DAY)";
}
