<?php

require __DIR__ . '/../settings/includes.php';

use App\Services\AiReportGeneratorService;
use Shared\Database;

/**
 * Simula resposta DSL da IA com dashboard{} só metadados (bug que descartava widgets).
 */
$dslResponse = json_encode([
    'dashboard' => [
        'title' => 'Painel Comercial',
        'description' => 'Visão executiva de vendas',
        'layout' => 'executive',
        'theme' => 'professional',
    ],
    'layout' => ['type' => 'grid', 'columns' => 12],
    'kpis' => [
        [
            'id' => 'kpi1',
            'label' => 'Receita Total',
            'sql' => 'SELECT ROUND(SUM(total_amount), 2) AS value FROM sales',
            'value_key' => 'value',
            'format' => 'currency',
        ],
    ],
    'widgets' => [
        [
            'id' => 'w1',
            'type' => 'bar_chart',
            'title' => 'Vendas por região',
            'sql' => 'SELECT r.name AS regiao, ROUND(SUM(s.total_amount), 2) AS receita
                      FROM sales s INNER JOIN regions r ON r.id = s.region_id
                      GROUP BY r.name ORDER BY receita DESC',
            'x_key' => 'regiao',
            'y_key' => 'receita',
            'w' => 6,
            'h' => 4,
        ],
    ],
    'insights' => ['Região Sul lidera em receita.'],
    'recommendations' => ['Investir na região Norte.'],
    'category' => 'commercial',
    'business_rules' => 'teste unwrap dsl',
], JSON_UNESCAPED_UNICODE);

$db = Database::getInstance()->getConnection();
$service = new AiReportGeneratorService($db);

$reflection = new ReflectionClass($service);
$parse = $reflection->getMethod('parseDefinition');
$parse->setAccessible(true);

/** @var array<string,mixed> $parsed */
$parsed = $parse->invoke($service, $dslResponse);

if (empty($parsed['widgets']) || empty($parsed['kpis'])) {
    fwrite(STDERR, 'FAIL: widgets ou kpis perdidos após unwrap' . PHP_EOL);
    exit(1);
}

$build = $reflection->getMethod('buildResultFromRaw');
$build->setAccessible(true);

try {
    /** @var array{definition:array<string,mixed>,dashboard:array<string,mixed>} $result */
    $result = $build->invoke($service, $dslResponse, 'Vendas por região');
} catch (Throwable $e) {
    fwrite(STDERR, 'FAIL: ' . $e->getMessage() . PHP_EOL);
    exit(1);
}

echo 'OK unwrap DSL' . PHP_EOL;
echo 'Widgets: ' . count($result['dashboard']['widgets']) . PHP_EOL;
echo 'KPIs: ' . count($result['dashboard']['kpis']) . PHP_EOL;
echo 'Insights: ' . count($result['definition']['insights'] ?? []) . PHP_EOL;
