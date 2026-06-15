<?php

namespace App\Controllers;

use App\Repositories\DashboardRepository;
use Shared\Database;
use Shared\Request;
use Shared\Response;

class DashboardsController
{
    public function index(): Response
    {
        $db = Database::getInstance()->getConnection();
        $items = (new DashboardRepository($db))->listAll();

        return Response::success($items);
    }

    public function show(int $id): Response
    {
        $db = Database::getInstance()->getConnection();
        $repo = new DashboardRepository($db);
        $dashboard = $repo->findById($id);

        if ($dashboard === null) {
            return Response::notFound('Dashboard não encontrado');
        }

        return Response::success($dashboard);
    }

    public function store(Request $request): Response
    {
        $payload = $request->getBody();
        $name = trim((string) ($payload['name'] ?? ''));
        $description = trim((string) ($payload['description'] ?? ''));
        $embedUrl = trim((string) ($payload['embed_url'] ?? ''));
        $category = trim((string) ($payload['category'] ?? 'other'));
        $isPublic = !empty($payload['is_public']) ? 1 : 0;
        $ownerId = $request->getAuthUserId();
        if ($ownerId <= 0) {
            $ownerId = (int) ($payload['owner_id'] ?? 0);
        }
        $allowedRoles = is_array($payload['allowed_roles'] ?? null) ? $payload['allowed_roles'] : [];

        $errors = $this->validatePayload($name, $embedUrl, $category, $allowedRoles);
        if (!empty($errors)) {
            return Response::validationError($errors);
        }

        $db = Database::getInstance()->getConnection();
        $repo = new DashboardRepository($db);
        if ($ownerId <= 0) {
            $ownerId = $repo->getDefaultOwnerId();
        }

        $db->beginTransaction();
        try {
            $id = $repo->create($name, $description, $embedUrl, $category, $ownerId, $isPublic, $allowedRoles);
            $created = $repo->findById($id);
            $db->commit();
            return Response::success($created, 201, 'Dashboard criado com sucesso');
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }
    }

    public function update(int $id, Request $request): Response
    {
        $payload = $request->getBody();
        $db = Database::getInstance()->getConnection();
        $repo = new DashboardRepository($db);
        $existing = $repo->findById($id);
        if ($existing === null) {
            return Response::notFound('Dashboard não encontrado');
        }

        $name = trim((string) ($payload['name'] ?? $existing['name']));
        $description = trim((string) ($payload['description'] ?? $existing['description']));
        $embedUrl = trim((string) ($payload['embed_url'] ?? $existing['embed_url']));
        $category = trim((string) ($payload['category'] ?? $existing['category']));
        $isPublic = isset($payload['is_public']) ? (!empty($payload['is_public']) ? 1 : 0) : (int) $existing['is_public'];
        $allowedRoles = is_array($payload['allowed_roles'] ?? null)
            ? $payload['allowed_roles']
            : (is_array($existing['allowed_roles'] ?? null) ? $existing['allowed_roles'] : []);

        $errors = $this->validatePayload($name, $embedUrl, $category, $allowedRoles);
        if (!empty($errors)) {
            return Response::validationError($errors);
        }

        $db->beginTransaction();
        try {
            $repo->update($id, $name, $description, $embedUrl, $category, $isPublic, $allowedRoles);
            $updated = $repo->findById($id);
            $db->commit();
            return Response::success($updated, 200, 'Dashboard atualizado com sucesso');
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }
    }

    public function incrementViews(int $id): Response
    {
        $db = Database::getInstance()->getConnection();
        $repo = new DashboardRepository($db);
        $existing = $repo->findById($id);
        if ($existing === null) {
            return Response::notFound('Dashboard não encontrado');
        }

        $repo->incrementViews($id);
        $updated = $repo->findById($id);
        return Response::success($updated, 200, 'Visualização registrada');
    }

    public function destroy(int $id): Response
    {
        $db = Database::getInstance()->getConnection();
        $repo = new DashboardRepository($db);
        $existing = $repo->findById($id);
        if ($existing === null) {
            return Response::notFound('Dashboard não encontrado');
        }

        $repo->deleteById($id);
        return Response::success(null, 200, 'Dashboard excluído com sucesso');
    }

    private function validatePayload(string $name, string $embedUrl, string $category, array $allowedRoles): array
    {
        $errors = [];

        if ($name === '' || strlen($name) < 3) {
            $errors['name'] = 'Nome deve ter ao menos 3 caracteres';
        }

        if ($embedUrl === '' || filter_var($embedUrl, FILTER_VALIDATE_URL) === false) {
            $errors['embed_url'] = 'URL do BI inválida';
        }

        if (!in_array($category, ['commercial', 'marketing', 'finance', 'hr', 'operations', 'other'], true)) {
            $errors['category'] = 'Categoria inválida';
        }

        foreach ($allowedRoles as $role) {
            if (!in_array($role, ['admin', 'manager', 'viewer'], true)) {
                $errors['allowed_roles'] = 'Perfis de acesso inválidos';
                break;
            }
        }

        return $errors;
    }
}
