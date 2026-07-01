<?php

namespace App\Services;

use App\Prompts\NexoraAiReportEnginePrompt;
use PDO;
use RuntimeException;

class AiReportGeneratorService
{
    /** @var OpenRouterService */
    private $openRouter;

    /** @var BusinessSchemaService */
    private $schema;

    /** @var SqlValidator */
    private $sqlValidator;

    /** @var PDO */
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->openRouter = new OpenRouterService();
        $this->schema = new BusinessSchemaService();
        $this->sqlValidator = new SqlValidator($this->schema->getAllowedTables(), AI_REPORT_MAX_ROWS);
    }

    /**
     * @param array<int, array{role:string,content:string}> $conversation
     * @return array{definition:array<string,mixed>,dashboard:array<string,mixed>}
     */
    public function generate(string $prompt, array $conversation = [], ?string $apiKey = null, ?string $model = null): array
    {
        $prompt = trim($prompt);
        if ($prompt === '') {
            throw new RuntimeException('Descreva o relatório que deseja criar');
        }

        $messages = $this->buildMessages($prompt, $conversation);
        $raw = $this->openRouter->chatCompletion($messages, $apiKey, $model, true);

        try {
            return $this->buildResultFromRaw($raw, $prompt);
        } catch (RuntimeException $firstError) {
            $widgetHint = $this->countRequestedAnalyses($prompt);
            $repairMessages = array_merge($messages, [
                ['role' => 'assistant', 'content' => $raw],
                [
                    'role' => 'user',
                    'content' => 'Corrija o JSON DSL. Retorne um painel executivo com '
                        . "pelo menos {$widgetHint} widgets distintos (cada pedido = 1 widget), "
                        . '2 a 4 KPIs, layout grid 12 colunas, insights[], recommendations[]. '
                        . 'OBRIGATÓRIO: cada widget e cada KPI deve ter campo "sql" com SELECT MySQL válido. '
                        . 'Não use apenas "dataset" ou "metric" sem SQL. '
                        . 'Mantenha widgets/kpis/charts na raiz do JSON (dashboard{} é só título/descrição). '
                        . 'Campos: dashboard{}, layout{}, filters[], kpis[], widgets[], insights[], recommendations[].',
                ],
            ]);

            $repairedRaw = $this->openRouter->chatCompletion($repairMessages, $apiKey, $model, true);

            try {
                return $this->buildResultFromRaw($repairedRaw, $prompt);
            } catch (RuntimeException $secondError) {
                throw new RuntimeException(
                    $firstError->getMessage() . ' (correção: ' . $secondError->getMessage() . ')'
                );
            }
        }
    }

    /**
     * @param array<string, mixed> $definition
     * @return array{widgets:array<int,array<string,mixed>>,kpis:array<int,array<string,mixed>>,rows?:array<int,array<string,mixed>>}
     */
    public function executeDefinition(array $definition, string $promptContext = ''): array
    {
        $context = trim($promptContext);
        if ($context === '') {
            $context = trim((string) ($definition['business_rules'] ?? $definition['description'] ?? ''));
        }

        $dashboard = $this->normalizeToDashboard($definition, 'Relatório');
        if ($context !== '') {
            $dashboard = $this->ensureDashboardCompleteness($dashboard, $context);
        }

        return $this->executeDashboard($dashboard);
    }

    /**
     * @param array<int, array{role:string,content:string}> $conversation
     * @return array<int, array{role:string,content:string}>
     */
    private function buildMessages(string $prompt, array $conversation): array
    {
        $messages = [
            ['role' => 'system', 'content' => $this->buildSystemPrompt($prompt)],
        ];

        foreach ($conversation as $turn) {
            $role = (string) ($turn['role'] ?? '');
            $content = trim((string) ($turn['content'] ?? ''));
            if ($role !== 'user' || $content === '') {
                continue;
            }
            $messages[] = ['role' => 'user', 'content' => $content];
        }

        $last = end($messages);
        if (!is_array($last) || ($last['role'] ?? '') !== 'user' || trim((string) ($last['content'] ?? '')) !== $prompt) {
            $messages[] = ['role' => 'user', 'content' => $prompt];
        }

        return $messages;
    }

    /**
     * @return array{definition:array<string,mixed>,dashboard:array<string,mixed>}
     */
    private function buildResultFromRaw(string $raw, string $prompt): array
    {
        $parsed = $this->parseDefinition($raw);
        $dashboard = $this->normalizeToDashboard($parsed, $prompt);
        $dashboard = $this->ensureDashboardCompleteness($dashboard, $prompt);
        $executed = $this->executeDashboard($dashboard);

        $widgetCount = count($executed['widgets']);
        $expected = $this->countRequestedAnalyses($prompt);
        if ($widgetCount < $expected && $expected > 1) {
            throw new RuntimeException(
                "O painel gerou {$widgetCount} visualização(ões), mas o pedido sugere {$expected}. "
                . 'Tente separar cada pedido com vírgula ou quebra de linha.'
            );
        }

        if ($widgetCount === 0) {
            throw new RuntimeException('Nenhum widget foi gerado para o painel');
        }

        $dashboard['layout'] = 'dashboard';
        $dashboard['widget_count'] = $widgetCount;

        // Persist widget SQL nos metadados salvos
        $dashboard['widgets'] = array_map(function (array $executedWidget) {
            $widget = [
                'id' => $executedWidget['id'],
                'title' => $executedWidget['title'],
                'description' => $executedWidget['description'] ?? '',
                'chart_type' => $executedWidget['chart_type'],
                'sql' => $executedWidget['sql'],
                'x_key' => $executedWidget['x_key'],
                'y_key' => $executedWidget['y_key'],
                'span' => $executedWidget['span'],
            ];
            foreach (['series_key', 'x', 'y', 'w', 'h', 'color'] as $key) {
                if (!empty($executedWidget[$key])) {
                    $widget[$key] = $executedWidget[$key];
                }
            }
            return $widget;
        }, $executed['widgets']);

        return [
            'definition' => $dashboard,
            'dashboard' => $executed,
        ];
    }

    private function buildSystemPrompt(string $userPrompt): string
    {
        $schema = $this->schema->getSchemaDescription();
        $expectedWidgets = max(1, $this->countRequestedAnalyses($userPrompt));

        return NexoraAiReportEnginePrompt::build($schema, $expectedWidgets);
    }

    private function countRequestedAnalyses(string $prompt): int
    {
        $intents = $this->detectAnalysisIntents($prompt);
        if (count($intents) > 1) {
            return count($intents);
        }

        $parts = $this->splitAnalysisRequests($prompt);

        return max(1, min(6, count($parts)));
    }

    /**
     * @return string[]
     */
    private function splitAnalysisRequests(string $prompt): array
    {
        $normalized = trim($prompt);
        if ($normalized === '') {
            return [];
        }

        $parts = preg_split('/[\n\r]+|,|;|•|·|(?<=\.)\s+/u', $normalized) ?: [];
        $parts = array_values(array_filter(array_map('trim', $parts), function ($part) {
            return strlen($part) >= 10;
        }));

        if (count($parts) > 1) {
            return $parts;
        }

        $single = $parts[0] ?? $normalized;
        $splitByIntent = preg_split(
            '/(?=\branking\b|\bfaturamento\b|\bvendas\b|\btotal\b|\bproduto\b|\btabela\b)/iu',
            $single
        ) ?: [];

        $splitByIntent = array_values(array_filter(array_map('trim', $splitByIntent), function ($part) {
            return strlen($part) >= 10;
        }));

        return count($splitByIntent) > 1 ? $splitByIntent : [$single];
    }

    /**
     * @return string[]
     */
    private function detectAnalysisIntents(string $prompt): array
    {
        $intents = [];

        if (preg_match('/regi[aã]o|regional/iu', $prompt)) {
            $intents[] = 'region_sales';
        }

        if (preg_match('/vendedor|seller|ranking/iu', $prompt)) {
            $intents[] = 'seller_ranking';
        }

        if (preg_match('/produto|product/iu', $prompt)) {
            $intents[] = 'product_revenue';
        }

        if (preg_match('/cliente|customer/iu', $prompt)) {
            $intents[] = 'customer_revenue';
        }

        if (preg_match('/categoria/iu', $prompt)) {
            $intents[] = 'category_revenue';
        }

        return array_values(array_unique($intents));
    }

    /**
     * @param array<string, mixed> $dashboard
     * @return array<string, mixed>
     */
    private function ensureDashboardCompleteness(array $dashboard, string $prompt): array
    {
        $intents = $this->detectAnalysisIntents($prompt);
        $widgets = is_array($dashboard['widgets'] ?? null) ? $dashboard['widgets'] : [];

        foreach ($intents as $intent) {
            if ($this->hasWidgetForIntent($widgets, $intent)) {
                continue;
            }
            $widgets[] = $this->buildTemplateWidget($intent);
        }

        if (count($widgets) <= 1) {
            $requests = $this->splitAnalysisRequests($prompt);
            if (count($requests) > count($widgets)) {
                foreach ($requests as $index => $requestText) {
                    if ($index < count($widgets)) {
                        continue;
                    }
                    $widgets[] = $this->buildTemplateWidgetFromText($requestText, $index + 1);
                }
            }
        }

        $dashboard['widgets'] = $widgets;

        if (empty($dashboard['kpis']) || !is_array($dashboard['kpis'])) {
            $dashboard['kpis'] = $this->defaultKpis();
        }

        if (count($widgets) > 1 && stripos((string) ($dashboard['title'] ?? ''), 'regi') !== false) {
            $dashboard['title'] = 'Painel Comercial Integrado';
        }

        if (count($widgets) > 1) {
            $dashboard['layout'] = 'dashboard';
            $dashboard['description'] = trim((string) ($dashboard['description'] ?? ''));
            if ($dashboard['description'] === '' || strlen($dashboard['description']) < 20) {
                $dashboard['description'] = 'Painel gerado com múltiplas visualizações conforme solicitado.';
            }
        }

        return $dashboard;
    }

    /**
     * @param array<int, array<string, mixed>> $widgets
     */
    private function hasWidgetForIntent(array $widgets, string $intent): bool
    {
        foreach ($widgets as $widget) {
            if ($this->widgetMatchesIntent($widget, $intent)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param array<string, mixed> $widget
     */
    private function widgetMatchesIntent(array $widget, string $intent): bool
    {
        $sql = strtolower((string) ($widget['sql'] ?? ''));
        $title = strtolower((string) ($widget['title'] ?? ''));

        switch ($intent) {
            case 'region_sales':
                return strpos($sql, 'regions') !== false
                    || strpos($sql, 'region') !== false
                    || strpos($title, 'regi') !== false;
            case 'seller_ranking':
                return strpos($sql, 'seller_name') !== false
                    || strpos($title, 'vendedor') !== false
                    || strpos($title, 'ranking') !== false;
            case 'product_revenue':
                return strpos($sql, 'products') !== false
                    || strpos($sql, 'product') !== false
                    || strpos($title, 'produto') !== false;
            case 'customer_revenue':
                return strpos($sql, 'customers') !== false
                    || strpos($title, 'cliente') !== false;
            case 'category_revenue':
                return strpos($sql, 'category') !== false
                    || strpos($title, 'categoria') !== false;
            default:
                return false;
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function buildTemplateWidget(string $intent): array
    {
        switch ($intent) {
            case 'seller_ranking':
                return [
                    'id' => 'w_sellers',
                    'title' => 'Ranking de vendedores (últimos 3 meses)',
                    'description' => 'Desempenho por vendedor no trimestre recente',
                    'chart_type' => 'horizontal_bar',
                    'sql' => "SELECT seller_name, ROUND(SUM(total_amount), 2) AS total_vendas
                              FROM sales
                              WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
                              GROUP BY seller_name
                              ORDER BY total_vendas DESC
                              LIMIT 10",
                    'x_key' => 'seller_name',
                    'y_key' => 'total_vendas',
                    'span' => 'half',
                ];
            case 'product_revenue':
                return [
                    'id' => 'w_products',
                    'title' => 'Faturamento por produto',
                    'description' => 'Detalhamento de receita e quantidade por produto',
                    'chart_type' => 'table',
                    'sql' => 'SELECT p.name AS produto, p.category AS categoria,
                                     ROUND(SUM(s.total_amount), 2) AS faturamento,
                                     SUM(s.quantity) AS quantidade
                              FROM sales s
                              INNER JOIN products p ON p.id = s.product_id
                              GROUP BY p.id, p.name, p.category
                              ORDER BY faturamento DESC',
                    'x_key' => 'produto',
                    'y_key' => 'faturamento',
                    'span' => 'full',
                ];
            case 'customer_revenue':
                return [
                    'id' => 'w_customers',
                    'title' => 'Faturamento por cliente',
                    'description' => 'Receita consolidada por cliente',
                    'chart_type' => 'table',
                    'sql' => 'SELECT c.name AS cliente, c.segment AS segmento,
                                     ROUND(SUM(s.total_amount), 2) AS faturamento
                              FROM sales s
                              INNER JOIN customers c ON c.id = s.customer_id
                              GROUP BY c.id, c.name, c.segment
                              ORDER BY faturamento DESC
                              LIMIT 20',
                    'x_key' => 'cliente',
                    'y_key' => 'faturamento',
                    'span' => 'full',
                ];
            case 'category_revenue':
                return [
                    'id' => 'w_categories',
                    'title' => 'Faturamento por categoria',
                    'description' => 'Comparativo entre categorias de produto',
                    'chart_type' => 'bar',
                    'sql' => 'SELECT p.category AS categoria, ROUND(SUM(s.total_amount), 2) AS faturamento
                              FROM sales s
                              INNER JOIN products p ON p.id = s.product_id
                              GROUP BY p.category
                              ORDER BY faturamento DESC',
                    'x_key' => 'categoria',
                    'y_key' => 'faturamento',
                    'span' => 'half',
                ];
            case 'region_sales':
            default:
                return [
                    'id' => 'w_regions',
                    'title' => 'Vendas totais por região',
                    'description' => 'Distribuição de faturamento por região',
                    'chart_type' => 'bar',
                    'sql' => 'SELECT r.name AS region_name, ROUND(SUM(s.total_amount), 2) AS total_vendas
                              FROM sales s
                              INNER JOIN regions r ON r.id = s.region_id
                              GROUP BY r.name
                              ORDER BY total_vendas DESC',
                    'x_key' => 'region_name',
                    'y_key' => 'total_vendas',
                    'span' => 'half',
                ];
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function buildTemplateWidgetFromText(string $requestText, int $index): array
    {
        $text = mb_strtolower($requestText);

        if (strpos($text, 'vendedor') !== false || strpos($text, 'ranking') !== false) {
            return $this->buildTemplateWidget('seller_ranking');
        }

        if (strpos($text, 'produto') !== false || strpos($text, 'tabela') !== false) {
            return $this->buildTemplateWidget('product_revenue');
        }

        if (strpos($text, 'regi') !== false) {
            return $this->buildTemplateWidget('region_sales');
        }

        return [
            'id' => 'w' . $index,
            'title' => ucfirst(trim($requestText)),
            'description' => 'Visualização gerada a partir do pedido',
            'chart_type' => 'bar',
            'sql' => 'SELECT r.name AS region_name, ROUND(SUM(s.total_amount), 2) AS total_vendas
                      FROM sales s INNER JOIN regions r ON r.id = s.region_id
                      GROUP BY r.name ORDER BY total_vendas DESC',
            'x_key' => 'region_name',
            'y_key' => 'total_vendas',
            'span' => 'half',
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function defaultKpis(): array
    {
        return [
            [
                'id' => 'kpi_total',
                'label' => 'Faturamento total',
                'sql' => 'SELECT ROUND(SUM(total_amount), 2) AS value FROM sales',
                'value_key' => 'value',
                'format' => 'currency',
            ],
            [
                'id' => 'kpi_qty',
                'label' => 'Itens vendidos',
                'sql' => 'SELECT SUM(quantity) AS value FROM sales',
                'value_key' => 'value',
                'format' => 'number',
            ],
            [
                'id' => 'kpi_ticket',
                'label' => 'Ticket médio',
                'sql' => 'SELECT ROUND(AVG(total_amount), 2) AS value FROM sales',
                'value_key' => 'value',
                'format' => 'currency',
            ],
            [
                'id' => 'kpi_sellers',
                'label' => 'Vendedores ativos',
                'sql' => 'SELECT COUNT(DISTINCT seller_name) AS value FROM sales',
                'value_key' => 'value',
                'format' => 'number',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function parseDefinition(string $raw): array
    {
        $candidates = [trim($raw)];

        if (preg_match('/```(?:json)?\s*([\s\S]*?)```/i', $raw, $matches)) {
            $candidates[] = trim($matches[1]);
        }

        if (preg_match('/\{[\s\S]*\}/', $raw, $matches)) {
            $candidates[] = trim($matches[0]);
        }

        foreach ($candidates as $candidate) {
            if ($candidate === '') {
                continue;
            }

            $decoded = json_decode($candidate, true);
            if (is_array($decoded)) {
                return $this->unwrapDefinition($decoded);
            }
        }

        throw new RuntimeException('A IA não retornou JSON válido para o relatório');
    }

    /**
     * @param array<string, mixed> $decoded
     * @return array<string, mixed>
     */
    private function unwrapDefinition(array $decoded): array
    {
        if (isset($decoded['definition']) && is_array($decoded['definition'])) {
            return $this->mergeDslEnvelope($decoded, $decoded['definition']);
        }

        if (isset($decoded['report']) && is_array($decoded['report'])) {
            return $this->mergeDslEnvelope($decoded, $decoded['report']);
        }

        if (isset($decoded['dashboard']) && is_array($decoded['dashboard'])) {
            $dashboard = $decoded['dashboard'];
            if ($this->hasExecutableContent($dashboard)) {
                return $this->mergeDslEnvelope($decoded, $dashboard);
            }

            // DSL: dashboard{} é só metadados; widgets/kpis/charts ficam na raiz
            return $decoded;
        }

        return $decoded;
    }

    /**
     * @param array<string, mixed> $envelope
     * @param array<string, mixed> $primary
     * @return array<string, mixed>
     */
    private function mergeDslEnvelope(array $envelope, array $primary): array
    {
        $merged = array_merge($envelope, $primary);
        unset($merged['definition'], $merged['report']);

        if (isset($envelope['dashboard']) && is_array($envelope['dashboard']) && !$this->hasExecutableContent($envelope['dashboard'])) {
            $meta = $envelope['dashboard'];
            foreach (['title', 'description', 'theme', 'category', 'business_rules'] as $key) {
                if (empty($merged[$key]) && !empty($meta[$key])) {
                    $merged[$key] = $meta[$key];
                }
            }
            if (!empty($meta['layout']) && !is_array($meta['layout'])) {
                $merged['layout_style'] = $meta['layout'];
            }
        }

        return $merged;
    }

    /**
     * @param array<string, mixed> $definition
     */
    private function hasExecutableContent(array $definition): bool
    {
        if ($this->extractSql($definition) !== '') {
            return true;
        }

        foreach (['widgets', 'kpis', 'charts', 'tables'] as $key) {
            if (!empty($definition[$key]) && is_array($definition[$key])) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param array<string, mixed> $definition
     * @return array<string, mixed>
     */
    /**
     * @param array<string, mixed> $definition
     * @return array<string, mixed>
     */
    private function preprocessDslDefinition(array $definition): array
    {
        if (isset($definition['dashboard']) && is_array($definition['dashboard'])) {
            $meta = $definition['dashboard'];
            foreach (['title', 'description', 'theme'] as $key) {
                if (empty($definition[$key]) && !empty($meta[$key])) {
                    $definition[$key] = $meta[$key];
                }
            }
            if (!empty($meta['layout']) && !is_array($meta['layout'])) {
                $definition['layout_style'] = $meta['layout'];
            }
        }

        $widgets = is_array($definition['widgets'] ?? null) ? $definition['widgets'] : [];
        foreach (['charts', 'tables'] as $section) {
            if (empty($definition[$section]) || !is_array($definition[$section])) {
                continue;
            }
            foreach ($definition[$section] as $item) {
                if (!is_array($item)) {
                    continue;
                }
                if ($section === 'tables' && empty($item['chart_type']) && empty($item['type'])) {
                    $item['type'] = 'table';
                }
                $widgets[] = $item;
            }
        }

        $kpis = is_array($definition['kpis'] ?? null) ? $definition['kpis'] : [];
        $chartWidgets = [];
        foreach ($widgets as $widget) {
            if (!is_array($widget)) {
                continue;
            }
            $type = strtolower(trim((string) ($widget['type'] ?? '')));
            if ($type === 'kpi') {
                $sql = $this->extractSql($widget);
                if ($sql !== '') {
                    $kpis[] = [
                        'id' => $widget['id'] ?? ('kpi_' . (count($kpis) + 1)),
                        'label' => $widget['title'] ?? $widget['label'] ?? 'KPI',
                        'sql' => $sql,
                        'value_key' => $widget['value_key'] ?? 'value',
                        'format' => $widget['format'] ?? 'number',
                    ];
                }
                continue;
            }
            if (empty($widget['chart_type']) && $type !== '') {
                $widget['chart_type'] = $this->mapWidgetTypeToChartType($type);
            }
            $chartWidgets[] = $widget;
        }

        $definition['widgets'] = $chartWidgets;
        if (!empty($kpis)) {
            $definition['kpis'] = $kpis;
        }

        return $definition;
    }

    private function mapWidgetTypeToChartType(string $type): string
    {
        $map = [
            'line_chart' => 'line',
            'line' => 'line',
            'area_chart' => 'area',
            'area' => 'area',
            'stacked_area' => 'area',
            'bar_chart' => 'bar',
            'bar' => 'bar',
            'horizontal_bar' => 'horizontal_bar',
            'ranking' => 'horizontal_bar',
            'donut' => 'donut',
            'pie_chart' => 'pie',
            'pie' => 'pie',
            'table' => 'table',
            'heatmap' => 'heatmap',
        ];

        return $map[strtolower(trim($type))] ?? 'bar';
    }

    /**
     * @param array<string, mixed> $widget
     */
    private function inferSpanFromGrid(array $widget): string
    {
        $span = trim((string) ($widget['span'] ?? ''));
        if (in_array($span, ['half', 'full'], true)) {
            return $span;
        }

        $w = (int) ($widget['w'] ?? 0);
        $type = strtolower(trim((string) ($widget['type'] ?? $widget['chart_type'] ?? '')));

        if ($type === 'table' || $w >= 8 || $w === 12) {
            return 'full';
        }

        return 'half';
    }

    /**
     * @param array<string, mixed> $definition
     * @return array<string, mixed>
     */
    private function extractDslMetadata(array $definition): array
    {
        $layout = $definition['layout'] ?? null;
        $gridLayout = ['type' => 'grid', 'columns' => 12];
        $layoutStyle = trim((string) ($definition['layout_style'] ?? 'executive'));

        if (is_array($layout) && ($layout['type'] ?? '') === 'grid') {
            $gridLayout = $layout;
        } elseif (is_string($layout) && $layout !== 'dashboard' && $layoutStyle === 'executive') {
            $layoutStyle = $layout;
        }

        return [
            'insights' => $this->normalizeStringList($definition['insights'] ?? []),
            'recommendations' => $this->normalizeStringList($definition['recommendations'] ?? []),
            'filters' => is_array($definition['filters'] ?? null) ? $definition['filters'] : [],
            'grid_layout' => $gridLayout,
            'theme' => trim((string) ($definition['theme'] ?? 'professional')),
            'layout_style' => $layoutStyle,
        ];
    }

    /**
     * @param mixed $items
     * @return string[]
     */
    private function normalizeStringList($items): array
    {
        if (!is_array($items)) {
            return [];
        }

        $result = [];
        foreach ($items as $item) {
            if (is_string($item)) {
                $text = trim($item);
                if ($text !== '') {
                    $result[] = $text;
                }
            }
        }

        return $result;
    }

    /**
     * @param array<string, mixed> $definition
     * @return array<string, mixed>
     */
    private function normalizeToDashboard(array $definition, string $fallbackTitle): array
    {
        $definition = $this->preprocessDslDefinition($definition);
        $metadata = $this->extractDslMetadata($definition);

        if (!empty($definition['widgets']) && is_array($definition['widgets'])) {
            $widgets = [];
            $index = 1;
            foreach ($definition['widgets'] as $widget) {
                if (!is_array($widget)) {
                    continue;
                }
                $normalized = $this->normalizeWidget($widget, $index++);
                if ($normalized !== null) {
                    $widgets[] = $normalized;
                }
            }

            return array_merge([
                'layout' => 'dashboard',
                'title' => trim((string) ($definition['title'] ?? $fallbackTitle)),
                'description' => trim((string) ($definition['description'] ?? $fallbackTitle)),
                'category' => $this->normalizeCategory((string) ($definition['category'] ?? 'commercial')),
                'business_rules' => trim((string) ($definition['business_rules'] ?? $fallbackTitle)),
                'kpis' => $this->normalizeKpis($definition['kpis'] ?? []),
                'widgets' => $widgets,
            ], $metadata);
        }

        $sql = $this->extractSql($definition);
        if ($sql === '') {
            throw new RuntimeException('A IA não gerou SQL para o relatório');
        }

        $widget = $this->normalizeWidget([
            'id' => 'w1',
            'title' => (string) ($definition['title'] ?? 'Relatório'),
            'description' => (string) ($definition['description'] ?? ''),
            'chart_type' => (string) ($definition['chart_type'] ?? 'bar'),
            'sql' => $sql,
            'x_key' => (string) ($definition['x_key'] ?? ''),
            'y_key' => (string) ($definition['y_key'] ?? ''),
            'span' => ((string) ($definition['chart_type'] ?? 'bar')) === 'table' ? 'full' : 'half',
        ], 1);

        if ($widget === null) {
            throw new RuntimeException('Widget inválido no relatório');
        }

        return array_merge([
            'layout' => 'dashboard',
            'title' => trim((string) ($definition['title'] ?? $fallbackTitle)),
            'description' => trim((string) ($definition['description'] ?? $fallbackTitle)),
            'category' => $this->normalizeCategory((string) ($definition['category'] ?? 'commercial')),
            'business_rules' => trim((string) ($definition['business_rules'] ?? $fallbackTitle)),
            'kpis' => $this->normalizeKpis($definition['kpis'] ?? []),
            'widgets' => [$widget],
        ], $metadata);
    }

    /**
     * @param array<string, mixed> $widget
     * @return array<string, mixed>|null
     */
    private function normalizeWidget(array $widget, int $index): ?array
    {
        $sql = $this->resolveWidgetSql($widget);
        if ($sql === '') {
            return null;
        }

        $rawType = trim((string) ($widget['type'] ?? ''));
        $chartType = trim((string) ($widget['chart_type'] ?? ''));
        if ($chartType === '' && $rawType !== '') {
            $chartType = $this->mapWidgetTypeToChartType($rawType);
        }
        if (!in_array($chartType, ['bar', 'line', 'pie', 'table', 'area', 'donut', 'horizontal_bar', 'heatmap'], true)) {
            $chartType = 'bar';
        }

        $span = $this->inferSpanFromGrid($widget);

        $normalized = [
            'id' => trim((string) ($widget['id'] ?? ('w' . $index))),
            'title' => trim((string) ($widget['title'] ?? ('Visualização ' . $index))),
            'description' => trim((string) ($widget['description'] ?? '')),
            'chart_type' => $chartType,
            'sql' => $sql,
            'x_key' => trim((string) ($widget['x_key'] ?? $widget['xKey'] ?? $widget['label_key'] ?? '')),
            'y_key' => trim((string) ($widget['y_key'] ?? $widget['yKey'] ?? $widget['value_key'] ?? '')),
            'span' => $span,
        ];

        $seriesKey = trim((string) ($widget['series_key'] ?? $widget['seriesKey'] ?? ''));
        if ($seriesKey !== '') {
            $normalized['series_key'] = $seriesKey;
        }

        foreach (['x', 'y', 'w', 'h'] as $gridKey) {
            if (isset($widget[$gridKey])) {
                $normalized[$gridKey] = (int) $widget[$gridKey];
            }
        }

        return $normalized;
    }

    /**
     * @param mixed $kpis
     * @return array<int, array<string, mixed>>
     */
    private function normalizeKpis($kpis): array
    {
        if (!is_array($kpis)) {
            return [];
        }

        $result = [];
        $index = 1;
        foreach ($kpis as $kpi) {
            if (!is_array($kpi)) {
                continue;
            }
            $sql = $this->extractSql($kpi);
            if ($sql === '') {
                $sql = $this->resolveSqlFromHint(
                    strtolower((string) ($kpi['label'] ?? $kpi['title'] ?? '')),
                    'kpi'
                );
            }
            if ($sql === '') {
                continue;
            }
            $entry = [
                'id' => trim((string) ($kpi['id'] ?? ('kpi' . $index))),
                'label' => trim((string) ($kpi['label'] ?? $kpi['title'] ?? ('Indicador ' . $index))),
                'sql' => $sql,
                'value_key' => trim((string) ($kpi['value_key'] ?? $kpi['valueKey'] ?? 'value')),
                'format' => trim((string) ($kpi['format'] ?? 'number')),
            ];
            foreach (['comparison_percent', 'trend', 'icon', 'color', 'description'] as $metaKey) {
                if (!empty($kpi[$metaKey])) {
                    $entry[$metaKey] = $kpi[$metaKey];
                }
            }
            $result[] = $entry;
            $index++;
            if ($index > 6) {
                break;
            }
        }

        return $result;
    }

    /**
     * @param array<string, mixed> $dashboard
     * @return array{widgets:array<int,array<string,mixed>>,kpis:array<int,array<string,mixed>>}
     */
    private function executeDashboard(array $dashboard): array
    {
        $executedWidgets = [];
        foreach ($dashboard['widgets'] as $widget) {
            $sql = $this->sqlValidator->validateAndPrepare((string) $widget['sql']);
            $rows = $this->executeQuery($sql);
            if (empty($rows)) {
                throw new RuntimeException('Widget "' . $widget['title'] . '" não retornou dados');
            }

            $widgetWithKeys = $this->inferKeysFromRows($widget, $rows);
            $widgetWithKeys['sql'] = $sql;
            $widgetWithKeys['rows'] = $rows;
            $executedWidgets[] = $widgetWithKeys;
        }

        $executedKpis = [];
        foreach ($dashboard['kpis'] as $kpi) {
            try {
                $sql = $this->sqlValidator->validateAndPrepare((string) $kpi['sql']);
                $rows = $this->executeQuery($sql);
                $valueKey = (string) ($kpi['value_key'] ?? 'value');
                $value = $rows[0][$valueKey] ?? ($rows[0][array_key_first($rows[0])] ?? 0);
                $executedKpis[] = [
                    'id' => $kpi['id'],
                    'label' => $kpi['label'],
                    'format' => $kpi['format'],
                    'value' => $value,
                ];
                foreach (['comparison_percent', 'trend', 'icon', 'color', 'description'] as $metaKey) {
                    if (isset($kpi[$metaKey])) {
                        $executedKpis[count($executedKpis) - 1][$metaKey] = $kpi[$metaKey];
                    }
                }
            } catch (\Throwable $e) {
                continue;
            }
        }

        if (empty($executedKpis) && !empty($executedWidgets)) {
            $executedKpis = $this->buildFallbackKpis($executedWidgets);
        }

        return [
            'widgets' => $executedWidgets,
            'kpis' => $executedKpis,
        ];
    }

    /**
     * @param array<int, array<string, mixed>> $widgets
     * @return array<int, array<string, mixed>>
     */
    private function buildFallbackKpis(array $widgets): array
    {
        $kpis = [];
        $kpis[] = [
            'id' => 'kpi_widgets',
            'label' => 'Visualizações',
            'format' => 'number',
            'value' => count($widgets),
        ];

        $first = $widgets[0]['rows'][0] ?? null;
        if (is_array($first)) {
            foreach ($first as $key => $val) {
                if (is_numeric($val)) {
                    $kpis[] = [
                        'id' => 'kpi_' . $key,
                        'label' => ucfirst(str_replace('_', ' ', (string) $key)),
                        'format' => 'number',
                        'value' => $val,
                    ];
                    break;
                }
            }
        }

        return array_slice($kpis, 0, 4);
    }

    /**
     * @param array<string, mixed> $definition
     */
    private function extractSql(array $definition): string
    {
        $keys = ['sql', 'query', 'sql_query', 'SQL', 'select', 'statement', 'data_query'];
        foreach ($keys as $key) {
            if (!empty($definition[$key]) && is_string($definition[$key])) {
                $value = trim($definition[$key]);
                if ($this->looksLikeSelect($value)) {
                    return $value;
                }
            }
        }

        if (!empty($definition['dataset']) && is_string($definition['dataset'])) {
            $value = trim($definition['dataset']);
            if ($this->looksLikeSelect($value)) {
                return $value;
            }
        }

        foreach (['data_source', 'dataSource', 'source'] as $nestedKey) {
            if (!empty($definition[$nestedKey]) && is_array($definition[$nestedKey])) {
                $nested = $this->extractSql($definition[$nestedKey]);
                if ($nested !== '') {
                    return $nested;
                }
            }
        }

        return '';
    }

    /**
     * @param array<string, mixed> $widget
     */
    private function resolveWidgetSql(array $widget): string
    {
        $sql = $this->extractSql($widget);
        if ($sql !== '') {
            return $sql;
        }

        $hint = strtolower(trim((string) (
            $widget['dataset']
            ?? $widget['metric']
            ?? $widget['title']
            ?? $widget['description']
            ?? ''
        )));

        if ($hint === '') {
            return '';
        }

        return $this->resolveSqlFromHint($hint, (string) ($widget['type'] ?? $widget['chart_type'] ?? ''));
    }

    private function looksLikeSelect(string $value): bool
    {
        return stripos($value, 'SELECT') === 0 || stripos($value, 'WITH') === 0;
    }

    private function resolveSqlFromHint(string $hint, string $type): string
    {
        $templates = [
            'receita_mensal' => "SELECT DATE_FORMAT(sale_date, '%Y-%m') AS mes, ROUND(SUM(total_amount), 2) AS receita FROM sales GROUP BY mes ORDER BY mes",
            'receita_total' => 'SELECT ROUND(SUM(total_amount), 2) AS value FROM sales',
            'faturamento_total' => 'SELECT ROUND(SUM(total_amount), 2) AS value FROM sales',
            'vendas_por_regiao' => 'SELECT r.name AS regiao, ROUND(SUM(s.total_amount), 2) AS receita FROM sales s INNER JOIN regions r ON r.id = s.region_id GROUP BY r.name ORDER BY receita DESC',
            'ranking_vendedores' => "SELECT seller_name, ROUND(SUM(total_amount), 2) AS total_vendas FROM sales WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) GROUP BY seller_name ORDER BY total_vendas DESC LIMIT 10",
            'top_produtos' => 'SELECT p.name AS produto, p.category AS categoria, ROUND(SUM(s.total_amount), 2) AS faturamento, SUM(s.quantity) AS quantidade FROM sales s INNER JOIN products p ON p.id = s.product_id GROUP BY p.id, p.name, p.category ORDER BY faturamento DESC LIMIT 20',
            'faturamento_por_produto' => 'SELECT p.name AS produto, ROUND(SUM(s.total_amount), 2) AS faturamento FROM sales s INNER JOIN products p ON p.id = s.product_id GROUP BY p.id, p.name ORDER BY faturamento DESC',
            'faturamento_por_cliente' => 'SELECT c.name AS cliente, ROUND(SUM(s.total_amount), 2) AS faturamento FROM sales s INNER JOIN customers c ON c.id = s.customer_id GROUP BY c.id, c.name ORDER BY faturamento DESC LIMIT 20',
            'ticket_medio' => 'SELECT ROUND(AVG(total_amount), 2) AS value FROM sales',
            'itens_vendidos' => 'SELECT SUM(quantity) AS value FROM sales',
        ];

        $normalized = preg_replace('/[^a-z0-9_]+/u', '_', $hint) ?? $hint;
        $normalized = trim($normalized, '_');

        if (isset($templates[$normalized])) {
            return $templates[$normalized];
        }

        if (strpos($hint, 'vendedor') !== false || strpos($hint, 'ranking') !== false || $type === 'horizontal_bar') {
            return $templates['ranking_vendedores'];
        }

        if (strpos($hint, 'regi') !== false) {
            return $templates['vendas_por_regiao'];
        }

        if (strpos($hint, 'produto') !== false || strpos($hint, 'tabela') !== false || $type === 'table') {
            return $templates['top_produtos'];
        }

        if (strpos($hint, 'cliente') !== false) {
            return $templates['faturamento_por_cliente'];
        }

        if (strpos($hint, 'mensal') !== false || strpos($hint, 'evolu') !== false || strpos($hint, 'tend') !== false) {
            return $templates['receita_mensal'];
        }

        if (strpos($hint, 'receita') !== false || strpos($hint, 'faturamento') !== false) {
            return $templates['receita_total'];
        }

        if (strpos($hint, 'quantidade') !== false || strpos($hint, 'itens') !== false) {
            return $templates['itens_vendidos'];
        }

        if (strpos($hint, 'ticket') !== false) {
            return $templates['ticket_medio'];
        }

        return '';
    }

    private function normalizeCategory(string $category): string
    {
        return in_array($category, ['commercial', 'marketing', 'finance', 'hr', 'operations', 'other'], true)
            ? $category
            : 'commercial';
    }

    /**
     * @param array<string, mixed> $definition
     * @param array<int, array<string, mixed>> $rows
     * @return array<string, mixed>
     */
    private function inferKeysFromRows(array $definition, array $rows): array
    {
        if (empty($rows)) {
            return $definition;
        }

        $columns = array_keys($rows[0]);
        if (($definition['chart_type'] ?? '') === 'table') {
            return $definition;
        }

        if (($definition['x_key'] ?? '') === '') {
            $definition['x_key'] = (string) $columns[0];
        }

        if (($definition['y_key'] ?? '') === '') {
            $definition['y_key'] = $this->findNumericColumn($rows, $columns) ?? (string) ($columns[1] ?? $columns[0]);
        }

        if (!$this->columnExistsInRows($rows, (string) $definition['x_key'])) {
            $definition['x_key'] = (string) $columns[0];
        }

        if (!$this->columnExistsInRows($rows, (string) $definition['y_key'])) {
            $definition['y_key'] = $this->findNumericColumn($rows, $columns) ?? (string) ($columns[1] ?? $columns[0]);
        }

        return $definition;
    }

    /**
     * @param array<int, array<string, mixed>> $rows
     * @param string[] $columns
     */
    private function findNumericColumn(array $rows, array $columns): ?string
    {
        foreach ($columns as $column) {
            if (is_numeric($rows[0][$column] ?? null)) {
                return (string) $column;
            }
        }

        return null;
    }

    /**
     * @param array<int, array<string, mixed>> $rows
     */
    private function columnExistsInRows(array $rows, string $column): bool
    {
        return $column !== '' && array_key_exists($column, $rows[0]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function executeQuery(string $sql): array
    {
        try {
            $stmt = $this->db->query($sql);
        } catch (\Throwable $e) {
            throw new RuntimeException('Erro ao executar SQL: ' . $e->getMessage());
        }

        if ($stmt === false) {
            throw new RuntimeException('Falha ao executar consulta do relatório');
        }

        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }
}
