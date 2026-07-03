<?php

include_once __DIR__ . '/../settings/includes.php';

$pdo = getConexaoDB1();
if (!$pdo) {
    fwrite(STDERR, 'DB FAIL: ' . (getLastDbConnectionError() ?? 'conexão indisponível') . PHP_EOL);
    exit(1);
}

$result = validateDatabaseSchema($pdo);

echo 'Banco: ' . DB_NAME . PHP_EOL;
echo 'Tabelas obrigatórias: ' . $result['required_count'] . PHP_EOL;
echo 'Tabelas encontradas: ' . $result['present_count'] . PHP_EOL;

if ($result['ok']) {
    echo 'Schema OK — todas as tabelas existem.' . PHP_EOL;
    exit(0);
}

echo 'Schema INCOMPLETO — faltam ' . count($result['missing']) . ' tabela(s):' . PHP_EOL;
foreach ($result['missing'] as $table) {
    echo '  - ' . $table . PHP_EOL;
}
echo PHP_EOL . 'Importe database/install_mysql.sql no phpMyAdmin.' . PHP_EOL;
exit(1);
