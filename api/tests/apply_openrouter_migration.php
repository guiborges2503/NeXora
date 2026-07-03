<?php

include_once __DIR__ . '/../settings/includes.php';

$pdo = getConexaoDB1();
if (!$pdo) {
    fwrite(STDERR, 'DB FAIL' . PHP_EOL);
    exit(1);
}

$sql = file_get_contents(__DIR__ . '/../../database/migrations/add_openrouter_settings.sql');
$statements = array_filter(array_map('trim', explode(';', $sql)));

foreach ($statements as $stmt) {
    if ($stmt === '' || stripos($stmt, 'SET ') === 0) {
        continue;
    }
    $pdo->exec($stmt);
}

$result = validateDatabaseSchema($pdo);
echo $result['ok'] ? 'Migration OK' . PHP_EOL : 'Schema incomplete' . PHP_EOL;
exit($result['ok'] ? 0 : 1);
