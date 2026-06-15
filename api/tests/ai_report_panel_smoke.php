<?php

require __DIR__ . '/../settings/includes.php';

use App\Services\AiReportGeneratorService;
use Shared\Database;

$prompt = 'Vendas totais por região em gráfico de barras Ranking de vendedores nos últimos 3 meses Faturamento por produto em tabela';

$db = Database::getInstance()->getConnection();
$service = new AiReportGeneratorService($db);

$legacyDefinition = [
    'layout' => 'dashboard',
    'title' => 'Vendas totais por região',
    'description' => 'Total de vendas agrupado por região',
    'category' => 'commercial',
    'business_rules' => $prompt,
    'widgets' => [[
        'id' => 'w1',
        'title' => 'Vendas totais por região',
        'chart_type' => 'bar',
        'sql' => 'SELECT r.name AS region_name, ROUND(SUM(s.total_amount), 2) AS total_vendas
                  FROM sales s INNER JOIN regions r ON r.id = s.region_id
                  GROUP BY r.name ORDER BY total_vendas DESC',
        'x_key' => 'region_name',
        'y_key' => 'total_vendas',
        'span' => 'half',
    ]],
];

$result = $service->executeDefinition($legacyDefinition, $prompt);

echo 'Widgets: ' . count($result['widgets']) . PHP_EOL;
echo 'KPIs: ' . count($result['kpis']) . PHP_EOL;
foreach ($result['widgets'] as $widget) {
    echo '- ' . $widget['title'] . ' (' . $widget['chart_type'] . ')' . PHP_EOL;
}
