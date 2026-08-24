<?php

include_once __DIR__ . '/../settings/includes.php';

$pdo = getConexaoDB1();
if (!$pdo) {
    fwrite(STDERR, 'DB FAIL' . PHP_EOL);
    exit(1);
}

$sql = file_get_contents(__DIR__ . '/../../database/migrations/add_company_data_sources.sql');
$statements = array_filter(array_map('trim', explode(';', $sql)));

foreach ($statements as $stmt) {
    if ($stmt === '' || stripos($stmt, 'SET ') === 0) {
        continue;
    }
    try {
        $pdo->exec($stmt);
    } catch (PDOException $e) {
        $duplicate = stripos($e->getMessage(), 'Duplicate') !== false
            || stripos($e->getMessage(), 'already exists') !== false;
        if (!$duplicate) {
            throw $e;
        }
    }
}

$result = validateDatabaseSchema($pdo);
echo $result['ok'] ? 'Migration OK' . PHP_EOL : 'Schema incomplete: ' . implode(', ', $result['missing']) . PHP_EOL;
exit($result['ok'] ? 0 : 1);
