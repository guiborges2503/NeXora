<?php

namespace App\Controllers;

use App\Repositories\AiReportRepository;
use App\Services\AiReportGeneratorService;
use Shared\Database;
use Shared\Request;
use Shared\Response;
use RuntimeException;

class AiReportsController
{
    public function index(int $userId, string $userRole): Response
    {
        $db = Database::getInstance()->getConnection();
        $repo = new AiReportRepository($db);
        $items = $repo->listVisibleForUser($userId, $userRole);

        return Response::success($items);
    }

    public function show(int $id, int $userId, string $userRole): Response
    {
        $db = Database::getInstance()->getConnection();
        $repo = new AiReportRepository($db);
        $report = $repo->findById($id);

        if ($report === null) {
            return Response::notFound('Relatório não encontrado');
        }

        if (!$repo->canUserAccess($report, $userId, $userRole)) {
            return Response::forbidden('Você não tem permissão para ver este relatório');
        }

        try {
            $generator = new AiReportGeneratorService($db);
            $definition = is_array($report['definition']) ? $report['definition'] : [];
            $promptContext = (string) ($report['prompt_summary'] ?? '');
            $dashboard = $generator->executeDefinition($definition, $promptContext);
            $legacyRows = $dashboard['widgets'][0]['rows'] ?? [];
        } catch (RuntimeException $e) {
            return Response::error('Erro ao executar relatório: ' . $e->getMessage(), 422);
        }

        unset($report['definition_json'], $report['sql_query']);

        return Response::success([
            'report' => $report,
            'dashboard' => $dashboard,
            'rows' => $legacyRows,
            'definition' => $definition,
        ]);
    }

    public function cardPreview(int $id, int $userId, string $userRole): Response
    {
        $db = Database::getInstance()->getConnection();
        $repo = new AiReportRepository($db);
        $report = $repo->findById($id);

        if ($report === null) {
            return Response::notFound('Relatório não encontrado');
        }

        if (!$repo->canUserAccess($report, $userId, $userRole)) {
            return Response::forbidden('Você não tem permissão para ver este relatório');
        }

        try {
            $generator = new AiReportGeneratorService($db);
            $definition = is_array($report['definition']) ? $report['definition'] : [];
            $promptContext = (string) ($report['prompt_summary'] ?? '');
            $dashboard = $generator->executeDefinition($definition, $promptContext);
        } catch (RuntimeException $e) {
            return Response::error('Erro ao gerar prévia: ' . $e->getMessage(), 422);
        }

        $kpis = array_slice(is_array($dashboard['kpis'] ?? null) ? $dashboard['kpis'] : [], 0, 3);
        $widgets = array_slice(is_array($dashboard['widgets'] ?? null) ? $dashboard['widgets'] : [], 0, 2);

        $trimmedWidgets = [];
        foreach ($widgets as $widget) {
            if (!is_array($widget)) {
                continue;
            }
            $rows = is_array($widget['rows'] ?? null) ? $widget['rows'] : [];
            $widget['rows'] = array_slice($rows, 0, 8);
            $trimmedWidgets[] = $widget;
        }

        return Response::success([
            'chart_type' => (string) ($report['chart_type'] ?? 'dashboard'),
            'dashboard' => [
                'kpis' => $kpis,
                'widgets' => $trimmedWidgets,
            ],
        ]);
    }

    public function generate(Request $request): Response
    {
        $payload = $request->getBody();
        $prompt = trim((string) ($payload['prompt'] ?? ''));
        $conversation = is_array($payload['messages'] ?? null) ? $payload['messages'] : [];
        $apiKey = trim((string) ($payload['api_key'] ?? ''));
        $model = trim((string) ($payload['model'] ?? ''));

        try {
            $db = Database::getInstance()->getConnection();
            $generator = new AiReportGeneratorService($db);
            $result = $generator->generate(
                $prompt,
                $conversation,
                $apiKey !== '' ? $apiKey : null,
                $model !== '' ? $model : null
            );

            return Response::success([
                'definition' => $result['definition'],
                'dashboard' => $result['dashboard'],
                'rows' => $result['dashboard']['widgets'][0]['rows'] ?? [],
                'preview' => true,
            ], 200, 'Prévia do painel gerada');
        } catch (RuntimeException $e) {
            return Response::error($e->getMessage(), 422);
        }
    }

    public function store(Request $request, int $userId): Response
    {
        $payload = $request->getBody();
        $definition = is_array($payload['definition'] ?? null) ? $payload['definition'] : null;
        if ($definition === null) {
            return Response::validationError(['definition' => 'Definição do relatório é obrigatória']);
        }

        $promptSummary = trim((string) ($payload['prompt_summary'] ?? ($definition['business_rules'] ?? '')));
        $isPublic = !empty($payload['is_public']) ? 1 : 0;
        $allowedRoles = is_array($payload['allowed_roles'] ?? null) ? $payload['allowed_roles'] : ['admin', 'manager', 'viewer'];

        try {
            $db = Database::getInstance()->getConnection();
            $generator = new AiReportGeneratorService($db);
            $generator->executeDefinition($definition);

            $repo = new AiReportRepository($db);
            $reportId = $repo->create($userId, $definition, $promptSummary, $isPublic, $allowedRoles);
            $created = $repo->findById($reportId);
            if ($created === null) {
                return Response::error('Relatório criado, mas não foi possível carregá-lo', 500);
            }

            unset($created['definition_json'], $created['sql_query'], $created['definition']);

            return Response::success($created, 201, 'Relatório salvo com sucesso');
        } catch (RuntimeException $e) {
            return Response::error($e->getMessage(), 422);
        }
    }

    public function updateSharing(int $id, Request $request, int $userId, string $userRole): Response
    {
        $db = Database::getInstance()->getConnection();
        $repo = new AiReportRepository($db);
        $existing = $repo->findById($id);

        if ($existing === null) {
            return Response::notFound('Relatório não encontrado');
        }

        if ((int) $existing['owner_id'] !== $userId && $userRole !== 'admin') {
            return Response::forbidden('Somente o criador ou administrador pode alterar o compartilhamento');
        }

        $payload = $request->getBody();
        $isPublic = !empty($payload['is_public']) ? 1 : 0;
        $allowedRoles = is_array($payload['allowed_roles'] ?? null)
            ? $payload['allowed_roles']
            : ($existing['allowed_roles'] ?? ['admin', 'manager', 'viewer']);

        $repo->updateSharing($id, $isPublic, $allowedRoles);
        $updated = $repo->findById($id);
        if ($updated === null) {
            return Response::notFound('Relatório não encontrado');
        }

        unset($updated['definition_json'], $updated['sql_query'], $updated['definition']);

        return Response::success($updated, 200, 'Compartilhamento atualizado');
    }

    public function update(int $id, Request $request, int $userId, string $userRole): Response
    {
        $db = Database::getInstance()->getConnection();
        $repo = new AiReportRepository($db);
        $existing = $repo->findById($id);

        if ($existing === null) {
            return Response::notFound('Relatório não encontrado');
        }

        if ((int) $existing['owner_id'] !== $userId && $userRole !== 'admin') {
            return Response::forbidden('Somente o criador ou administrador pode editar este relatório');
        }

        $payload = $request->getBody();
        $definition = is_array($payload['definition'] ?? null) ? $payload['definition'] : null;
        if ($definition === null) {
            return Response::validationError(['definition' => 'Definição do relatório é obrigatória']);
        }

        $promptSummary = trim((string) ($payload['prompt_summary'] ?? ($definition['business_rules'] ?? ($existing['prompt_summary'] ?? ''))));
        $isPublic = array_key_exists('is_public', $payload)
            ? (!empty($payload['is_public']) ? 1 : 0)
            : (int) ($existing['is_public'] ?? 0);
        $allowedRoles = is_array($payload['allowed_roles'] ?? null)
            ? $payload['allowed_roles']
            : ($existing['allowed_roles'] ?? ['admin', 'manager', 'viewer']);

        try {
            $generator = new AiReportGeneratorService($db);
            $generator->executeDefinition($definition, $promptSummary);

            $repo->updateDefinition($id, $definition, $promptSummary, $isPublic, $allowedRoles);
            $updated = $repo->findById($id);
            if ($updated === null) {
                return Response::notFound('Relatório não encontrado');
            }

            unset($updated['definition_json'], $updated['sql_query'], $updated['definition']);

            return Response::success($updated, 200, 'Relatório atualizado com sucesso');
        } catch (RuntimeException $e) {
            return Response::error($e->getMessage(), 422);
        }
    }

    public function executePreview(Request $request): Response
    {
        $payload = $request->getBody();
        $definition = is_array($payload['definition'] ?? null) ? $payload['definition'] : null;
        if ($definition === null) {
            return Response::validationError(['definition' => 'Definição do relatório é obrigatória']);
        }

        $promptContext = trim((string) ($payload['prompt_summary'] ?? ($definition['business_rules'] ?? '')));

        try {
            $db = Database::getInstance()->getConnection();
            $generator = new AiReportGeneratorService($db);
            $dashboard = $generator->executeDefinition($definition, $promptContext);

            return Response::success([
                'dashboard' => $dashboard,
                'definition' => $definition,
            ], 200, 'Prévia atualizada');
        } catch (RuntimeException $e) {
            return Response::error($e->getMessage(), 422);
        }
    }

    public function destroy(int $id, int $userId, string $userRole): Response
    {
        $db = Database::getInstance()->getConnection();
        $repo = new AiReportRepository($db);
        $existing = $repo->findById($id);

        if ($existing === null) {
            return Response::notFound('Relatório não encontrado');
        }

        if ((int) $existing['owner_id'] !== $userId && $userRole !== 'admin') {
            return Response::forbidden('Somente o criador ou administrador pode excluir');
        }

        $repo->deleteById($id);

        return Response::success(null, 200, 'Relatório excluído com sucesso');
    }

    public function incrementViews(int $id, int $userId, string $userRole): Response
    {
        $db = Database::getInstance()->getConnection();
        $repo = new AiReportRepository($db);
        $existing = $repo->findById($id);

        if ($existing === null) {
            return Response::notFound('Relatório não encontrado');
        }

        if (!$repo->canUserAccess($existing, $userId, $userRole)) {
            return Response::forbidden('Você não tem permissão para ver este relatório');
        }

        $repo->incrementViews($id);
        $updated = $repo->findById($id);
        if ($updated === null) {
            return Response::notFound('Relatório não encontrado');
        }

        unset($updated['definition_json'], $updated['sql_query'], $updated['definition']);

        return Response::success($updated, 200, 'Visualização registrada');
    }
}
