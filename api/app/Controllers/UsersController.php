<?php

namespace App\Controllers;

use App\Repositories\UserRepository;
use Shared\Database;
use Shared\Request;
use Shared\Response;
use RuntimeException;

class UsersController
{
    public function index(): Response
    {
        $db = Database::getInstance()->getConnection();
        $users = (new UserRepository($db))->listAll();

        return Response::success($users);
    }

    public function store(Request $request): Response
    {
        $payload = $request->getBody();

        $name = trim((string) ($payload['name'] ?? ''));
        $email = trim((string) ($payload['email'] ?? ''));
        $password = (string) ($payload['password'] ?? '');
        $status = (string) ($payload['status'] ?? 'active');
        $role = (string) ($payload['role'] ?? 'viewer');

        $errors = $this->validateUserPayload($name, $email, $password, $status, $role, true);
        if (!empty($errors)) {
            return Response::validationError($errors);
        }

        $db = Database::getInstance()->getConnection();
        $users = new UserRepository($db);

        if ($users->findByEmail($email) !== null) {
            return Response::error('E-mail já cadastrado', 409);
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        if ($passwordHash === false) {
            return Response::error('Falha ao processar senha', 500);
        }

        $db->beginTransaction();
        try {
            $userId = $users->create($name, $email, $passwordHash, $status);
            $users->setRoleByName($userId, $role);
            $db->commit();
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        $created = $users->findById($userId);
        return Response::success($created, 201, 'Usuário criado com sucesso');
    }

    public function update(int $id, Request $request): Response
    {
        $payload = $request->getBody();
        $db = Database::getInstance()->getConnection();
        $users = new UserRepository($db);

        $existing = $users->findById($id);
        if ($existing === null) {
            return Response::notFound('Usuário não encontrado');
        }

        $name = trim((string) ($payload['name'] ?? $existing['name']));
        $email = trim((string) ($payload['email'] ?? $existing['email']));
        $status = (string) ($payload['status'] ?? $existing['status']);
        $role = (string) ($payload['role'] ?? $existing['role']);
        $password = (string) ($payload['password'] ?? '');

        $errors = $this->validateUserPayload($name, $email, $password, $status, $role, false);
        if (!empty($errors)) {
            return Response::validationError($errors);
        }

        if ($users->existsEmailForAnotherUser($email, $id)) {
            return Response::error('E-mail já cadastrado para outro usuário', 409);
        }

        if ($existing['role'] === 'admin' && $role !== 'admin') {
            $adminCount = $users->countUsersByRoleName('admin');
            if ($adminCount <= 1) {
                return Response::error('Não é possível remover o último administrador', 422);
            }
        }

        if ($existing['role'] === 'admin' && $status !== 'active') {
            $adminCount = $users->countUsersByRoleName('admin');
            if ($adminCount <= 1) {
                return Response::error('Não é possível inativar o último administrador', 422);
            }
        }

        $db->beginTransaction();
        try {
            $users->update($id, $name, $email, $status);

            if ($password !== '') {
                $passwordHash = password_hash($password, PASSWORD_DEFAULT);
                if ($passwordHash === false) {
                    throw new RuntimeException('Falha ao processar senha');
                }
                $users->updatePassword($id, $passwordHash);
            }

            $users->setRoleByName($id, $role);
            $db->commit();
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        $updated = $users->findById($id);
        return Response::success($updated, 200, 'Usuário atualizado com sucesso');
    }

    public function updateStatus(int $id, Request $request): Response
    {
        $payload = $request->getBody();
        $status = (string) ($payload['status'] ?? '');

        if (!in_array($status, ['active', 'inactive'], true)) {
            return Response::validationError(['status' => 'Status inválido']);
        }

        $db = Database::getInstance()->getConnection();
        $users = new UserRepository($db);
        $existing = $users->findById($id);
        if ($existing === null) {
            return Response::notFound('Usuário não encontrado');
        }

        if ($existing['role'] === 'admin' && $status !== 'active') {
            $adminCount = $users->countUsersByRoleName('admin');
            if ($adminCount <= 1) {
                return Response::error('Não é possível inativar o último administrador', 422);
            }
        }

        $users->update($id, (string) $existing['name'], (string) $existing['email'], $status);
        $updated = $users->findById($id);

        return Response::success($updated, 200, 'Status atualizado com sucesso');
    }

    public function destroy(int $id): Response
    {
        $db = Database::getInstance()->getConnection();
        $users = new UserRepository($db);

        $existing = $users->findById($id);
        if ($existing === null) {
            return Response::notFound('Usuário não encontrado');
        }

        if ($existing['role'] === 'admin') {
            $adminCount = $users->countUsersByRoleName('admin');
            if ($adminCount <= 1) {
                return Response::error('Não é possível excluir o último administrador', 422);
            }
        }

        $users->deleteById($id);
        return Response::success(null, 200, 'Usuário excluído com sucesso');
    }

    private function validateUserPayload(
        string $name,
        string $email,
        string $password,
        string $status,
        string $role,
        bool $isCreate
    ): array {
        $errors = [];

        if ($name === '' || strlen($name) < 3) {
            $errors['name'] = 'Nome deve ter ao menos 3 caracteres';
        }

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'E-mail inválido';
        }

        if (!in_array($status, ['active', 'inactive'], true)) {
            $errors['status'] = 'Status inválido';
        }

        if (!in_array($role, ['admin', 'manager', 'viewer'], true)) {
            $errors['role'] = 'Perfil inválido';
        }

        if ($isCreate && strlen($password) < 6) {
            $errors['password'] = 'Senha deve ter ao menos 6 caracteres';
        }

        if (!$isCreate && $password !== '' && strlen($password) < 6) {
            $errors['password'] = 'Senha deve ter ao menos 6 caracteres';
        }

        return $errors;
    }
}
