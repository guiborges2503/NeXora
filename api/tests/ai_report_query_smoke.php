<?php

require __DIR__ . '/../settings/includes.php';

use App\Services\AiReportGeneratorService;
use App\Services\SqlValidator;
use App\Services\BusinessSchemaService;
use Shared\Database;

$db = Database::getInstance()->getConnection();
$validator = new SqlValidator((new BusinessSchemaService())->getAllowedTables(), 500);

$sql = "SELECT r.name AS region_name, SUM(s.total_amount) AS total_vendas
        FROM sales s
        INNER JOIN regions r ON r.id = s.region_id
        GROUP BY r.name
        ORDER BY total_vendas DESC";

$safeSql = $validator->validateAndPrepare($sql);
$stmt = $db->query($safeSql);
$rows = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];

echo "[OK] SQL validator + query executada" . PHP_EOL;
echo "Linhas: " . count($rows) . PHP_EOL;
if (!empty($rows)) {
    echo json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
}
