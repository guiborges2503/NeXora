<?php

namespace App\Controllers;

use App\Repositories\DashboardFavoriteRepository;
use Shared\Database;
use Shared\Request;
use Shared\Response;

class DashboardFavoritesController
{
    public function index(int $userId): Response
    {
        if ($userId <= 0) {
            return Response::validationError(['user_id' => 'Parâmetro user_id é obrigatório']);
        }

        $db = Database::getInstance()->getConnection();
        $repo = new DashboardFavoriteRepository($db);

        if (!$repo->userExists($userId)) {
            return Response::notFound('Usuário não encontrado');
        }

        $favoriteDashboardIds = $repo->listDashboardIdsByUserId($userId);
        return Response::success($favoriteDashboardIds);
    }

    public function store(Request $request, int $authUserId): Response
    {
        $dashboardId = (int) $request->getBodyParam('dashboard_id', 0);
        $userId = $authUserId;

        $errors = $this->validateIds($userId, $dashboardId);
        if (!empty($errors)) {
            return Response::validationError($errors);
        }

        $db = Database::getInstance()->getConnection();
        $repo = new DashboardFavoriteRepository($db);

        if (!$repo->userExists($userId)) {
            return Response::notFound('Usuário não encontrado');
        }

        if (!$repo->dashboardExists($dashboardId)) {
            return Response::notFound('Dashboard não encontrado');
        }

        $repo->add($userId, $dashboardId);
        return Response::success(
            [
                'user_id' => $userId,
                'dashboard_id' => $dashboardId,
            ],
            201,
            'Dashboard favoritado com sucesso'
        );
    }

    public function destroy(int $userId, int $dashboardId): Response
    {
        $errors = $this->validateIds($userId, $dashboardId);
        if (!empty($errors)) {
            return Response::validationError($errors);
        }

        $db = Database::getInstance()->getConnection();
        $repo = new DashboardFavoriteRepository($db);
        $repo->remove($userId, $dashboardId);

        return Response::success(null, 200, 'Dashboard removido dos favoritos');
    }

    private function validateIds(int $userId, int $dashboardId): array
    {
        $errors = [];
        if ($userId <= 0) {
            $errors['user_id'] = 'Parâmetro user_id é obrigatório';
        }
        if ($dashboardId <= 0) {
            $errors['dashboard_id'] = 'Parâmetro dashboard_id é obrigatório';
        }
        return $errors;
    }
}
