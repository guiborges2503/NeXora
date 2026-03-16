<?php

include_once __DIR__ . '/../settings/includes.php';

use Shared\Database;

function applyMigration(PDO $db, string $filename, string $sql): void
{
    $db->exec($sql);

    $stmt = $db->prepare('INSERT INTO migrations (filename, applied_at) VALUES (:filename, :applied_at)');
    $stmt->execute([
        'filename' => $filename,
        'applied_at' => date('Y-m-d H:i:s'),
    ]);
}

try {
    $db = Database::getInstance()->getConnection();
    $db->exec(
        "CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL UNIQUE,
            applied_at TEXT NOT NULL
        )"
    );

    $migrationsDir = __DIR__ . '/migrations';
    $files = glob($migrationsDir . '/*.sql') ?: [];
    sort($files);

    $count = 0;
    foreach ($files as $filePath) {
        $filename = basename($filePath);
        $check = $db->prepare('SELECT 1 FROM migrations WHERE filename = :filename LIMIT 1');
        $check->execute(['filename' => $filename]);

        if ($check->fetchColumn()) {
            continue;
        }

        $sql = file_get_contents($filePath);
        if ($sql === false) {
            throw new RuntimeException("Não foi possível ler a migration {$filename}");
        }

        $db->beginTransaction();
        try {
            applyMigration($db, $filename, $sql);
            $db->commit();
            $count++;
            echo "[OK] Migration aplicada: {$filename}" . PHP_EOL;
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }
    }

    if ($count === 0) {
        echo "Nenhuma migration pendente." . PHP_EOL;
    } else {
        echo "Total de migrations aplicadas: {$count}" . PHP_EOL;
    }
} catch (Throwable $e) {
    fwrite(STDERR, "[ERRO] " . $e->getMessage() . PHP_EOL);
    exit(1);
}
