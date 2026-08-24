<?php

namespace App\Controllers;

use App\Repositories\CompanyDataSourceRepository;
use App\Services\CompanyDataSourceService;
use Shared\Database;
use Shared\Request;
use Shared\Response;

class CompanyDataSourcesController
{
    public function index(): Response
    {
        $repo = $this->repo();
        $service = new CompanyDataSourceService();
        $items = [];
        foreach ($repo->listAll() as $row) {
            $items[] = $service->toPublic($row);
        }

        return Response::success([
            'items' => $items,
            'count' => count($items),
        ]);
    }

    public function show(int $id): Response
    {
        $row = $this->repo()->findById($id);
        if ($row === null) {
            return Response::notFound('Fonte de dados não encontrada');
        }

        return Response::success((new CompanyDataSourceService())->toPublic($row));
    }

    public function store(Request $request, int $userId): Response
    {
        $service = new CompanyDataSourceService();
        $data = $service->normalizePayload($request->getBody(), false);
        $errors = $service->validate($data, true);
        if ($errors !== []) {
            return Response::validationError($errors);
        }

        $repo = $this->repo();
        $id = $repo->create($data, $userId);
        $row = $repo->findById($id);

        return Response::success(
            $service->toPublic($row ?? []),
            201,
            'Fonte de dados salva com sucesso'
        );
    }

    public function update(int $id, Request $request, int $userId): Response
    {
        $repo = $this->repo();
        $stored = $repo->findById($id);
        if ($stored === null) {
            return Response::notFound('Fonte de dados não encontrada');
        }

        $service = new CompanyDataSourceService();
        $data = $service->normalizePayload($request->getBody(), true);
        $errors = $service->validate($data, false);
        if ($errors !== []) {
            return Response::validationError($errors);
        }

        $repo->update($id, $data, $userId);
        $row = $repo->findById($id);

        return Response::success(
            $service->toPublic($row ?? []),
            200,
            'Fonte de dados atualizada com sucesso'
        );
    }

    public function destroy(int $id): Response
    {
        $repo = $this->repo();
        if ($repo->findById($id) === null) {
            return Response::notFound('Fonte de dados não encontrada');
        }

        $repo->delete($id);

        return Response::success(['id' => $id], 200, 'Fonte de dados removida');
    }

    public function setDefault(int $id): Response
    {
        $repo = $this->repo();
        try {
            $repo->setDefault($id);
        } catch (\RuntimeException $e) {
            return Response::notFound($e->getMessage());
        }

        $row = $repo->findById($id);

        return Response::success(
            (new CompanyDataSourceService())->toPublic($row ?? []),
            200,
            'Fonte padrão atualizada'
        );
    }

    public function test(Request $request): Response
    {
        $payload = $request->getBody();
        $id = (int) ($payload['id'] ?? $request->getQueryParam('id', 0));
        $service = new CompanyDataSourceService();
        $repo = $this->repo();
        $stored = $id > 0 ? $repo->findById($id) : null;

        $data = $service->normalizePayload($payload, $stored !== null);
        $data = $service->mergeSecrets($data, $stored);

        if ($stored !== null && trim((string) ($payload['name'] ?? '')) === '') {
            $data['name'] = (string) $stored['name'];
            $data['connection_type'] = (string) ($payload['connection_type'] ?? $stored['connection_type']);
            if ($data['connection_type'] === 'database' && $data['db_host'] === '') {
                foreach (['db_driver', 'db_host', 'db_port', 'db_name', 'db_user', 'db_ssl', 'db_charset'] as $key) {
                    if ($data[$key] === '' || $data[$key] === false) {
                        $data[$key] = $stored[$key];
                    }
                }
            }
            if ($data['connection_type'] === 'api' && $data['api_base_url'] === '') {
                foreach (['api_base_url', 'api_auth_type', 'api_key_header', 'api_username', 'api_test_path'] as $key) {
                    if ($data[$key] === '') {
                        $data[$key] = $stored[$key];
                    }
                }
            }
        }

        $errors = $service->validate($data, true);
        if ($errors !== []) {
            return Response::validationError($errors);
        }

        $result = $service->testConnection($data);

        if ($id > 0 && $stored !== null) {
            $repo->recordTestResult($id, $result['ok'], $result['message']);
        }

        if (!$result['ok']) {
            return Response::error($result['message'], 422);
        }

        return Response::success([
            'ok' => true,
            'message' => $result['message'],
            'driver' => $result['details']['driver'] ?? null,
            'table_count' => $result['details']['table_count'] ?? null,
            'url' => $result['details']['url'] ?? null,
            'status' => $result['details']['status'] ?? null,
        ], 200, $result['message']);
    }

    private function repo(): CompanyDataSourceRepository
    {
        return new CompanyDataSourceRepository(Database::getInstance()->getConnection());
    }
}
