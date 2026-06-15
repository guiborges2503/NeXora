<?php

namespace App\Services;

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
                    'content' => 'Corrija o JSON. Retorne um PAINEL (layout dashboard) com '
                        . "pelo menos {$widgetHint} widgets distintos (cada pedido = 1 widget), "
                        . '2 a 4 KPIs no topo, e cada widget com sql SELECT próprio. '
                        . 'Campos: title, description, category, business_rules, kpis[], widgets[].',
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
            return [
                'id' => $executedWidget['id'],
                'title' => $executedWidget['title'],
                'description' => $executedWidget['description'] ?? '',
                'chart_type' => $executedWidget['chart_type'],
                'sql' => $executedWidget['sql'],
                'x_key' => $executedWidget['x_key'],
                'y_key' => $executedWidget['y_key'],
                'span' => $executedWidget['span'],
            ];
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

        return <<<PROMPT
Você é um analista sênior de BI da plataforma NeXora.
Gere um PAINEL PROFISSIONAL completo em JSON (sem markdown), atendendo TODOS os pedidos do usuário.

O usuário pediu aproximadamente {$expectedWidgets} análise(s). Crie UM widget SQL distinto para CADA pedido (não agrupe tudo em um único gráfico).

Estrutura OBRIGATÓRIA:
{
  "layout": "dashboard",
  "title": "título executivo do painel",
  "description": "resumo executivo",
  "category": "commercial|marketing|finance|hr|operations|other",
  "business_rules": "regras de negócio aplicadas",
  "kpis": [
    {
      "id": "kpi1",
      "label": "Faturamento total",
      "sql": "SELECT ROUND(SUM(total_amount),2) AS value FROM sales",
      "value_key": "value",
      "format": "currency|number|percent"
    }
  ],
  "widgets": [
    {
      "id": "w1",
      "title": "título do bloco",
      "description": "o que mostra",
      "chart_type": "bar|line|pie|table",
      "sql": "SELECT ...",
      "x_key": "coluna rotulo",
      "y_key": "coluna numerica",
      "span": "half|full"
    }
  ]
}

Regras:
- layout sempre "dashboard".
- widgets: mínimo {$expectedWidgets} itens, cada um com sql SELECT próprio.
- Use chart_type "table" quando o pedido mencionar tabela/listagem.
- Use chart_type "bar" para rankings/comparativos, "line" para evolução temporal.
- span "full" para tabelas; "half" para gráficos compactos.
- kpis: 2 a 4 indicadores resumidos no topo (totais, ticket médio, quantidade, etc.).
- SQL SQLite, somente tabelas permitidas, aliases legíveis.
- Para últimos 3 meses: sale_date >= date('now','-3 months').
- x_key e y_key devem existir no resultado de cada widget (exceto tabelas).

{$schema}
PROMPT;
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
                    'chart_type' => 'bar',
                    'sql' => "SELECT seller_name, ROUND(SUM(total_amount), 2) AS total_vendas
                              FROM sales
                              WHERE sale_date >= date('now', '-3 months')
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
            return $decoded['definition'];
        }

        if (isset($decoded['report']) && is_array($decoded['report'])) {
            return $decoded['report'];
        }

        if (isset($decoded['dashboard']) && is_array($decoded['dashboard'])) {
            return $decoded['dashboard'];
        }

        return $decoded;
    }

    /**
     * @param array<string, mixed> $definition
     * @return array<string, mixed>
     */
    private function normalizeToDashboard(array $definition, string $fallbackTitle): array
    {
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

            return [
                'layout' => 'dashboard',
                'title' => trim((string) ($definition['title'] ?? $fallbackTitle)),
                'description' => trim((string) ($definition['description'] ?? $fallbackTitle)),
                'category' => $this->normalizeCategory((string) ($definition['category'] ?? 'commercial')),
                'business_rules' => trim((string) ($definition['business_rules'] ?? $fallbackTitle)),
                'kpis' => $this->normalizeKpis($definition['kpis'] ?? []),
                'widgets' => $widgets,
            ];
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

        return [
            'layout' => 'dashboard',
            'title' => trim((string) ($definition['title'] ?? $fallbackTitle)),
            'description' => trim((string) ($definition['description'] ?? $fallbackTitle)),
            'category' => $this->normalizeCategory((string) ($definition['category'] ?? 'commercial')),
            'business_rules' => trim((string) ($definition['business_rules'] ?? $fallbackTitle)),
            'kpis' => $this->normalizeKpis($definition['kpis'] ?? []),
            'widgets' => [$widget],
        ];
    }

    /**
     * @param array<string, mixed> $widget
     * @return array<string, mixed>|null
     */
    private function normalizeWidget(array $widget, int $index): ?array
    {
        $sql = $this->extractSql($widget);
        if ($sql === '') {
            return null;
        }

        $chartType = trim((string) ($widget['chart_type'] ?? 'bar'));
        if (!in_array($chartType, ['bar', 'line', 'pie', 'table'], true)) {
            $chartType = 'bar';
        }

        $span = trim((string) ($widget['span'] ?? ''));
        if (!in_array($span, ['half', 'full'], true)) {
            $span = $chartType === 'table' ? 'full' : 'half';
        }

        return [
            'id' => trim((string) ($widget['id'] ?? ('w' . $index))),
            'title' => trim((string) ($widget['title'] ?? ('Visualização ' . $index))),
            'description' => trim((string) ($widget['description'] ?? '')),
            'chart_type' => $chartType,
            'sql' => $sql,
            'x_key' => trim((string) ($widget['x_key'] ?? $widget['xKey'] ?? $widget['label_key'] ?? '')),
            'y_key' => trim((string) ($widget['y_key'] ?? $widget['yKey'] ?? $widget['value_key'] ?? '')),
            'span' => $span,
        ];
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
                continue;
            }
            $result[] = [
                'id' => trim((string) ($kpi['id'] ?? ('kpi' . $index))),
                'label' => trim((string) ($kpi['label'] ?? ('Indicador ' . $index))),
                'sql' => $sql,
                'value_key' => trim((string) ($kpi['value_key'] ?? $kpi['valueKey'] ?? 'value')),
                'format' => trim((string) ($kpi['format'] ?? 'number')),
            ];
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
        $keys = ['sql', 'query', 'sql_query', 'SQL', 'select', 'statement'];
        foreach ($keys as $key) {
            if (!empty($definition[$key]) && is_string($definition[$key])) {
                return trim($definition[$key]);
            }
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
