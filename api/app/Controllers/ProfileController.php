<?php

namespace App\Controllers;

use App\Repositories\UserProfileRepository;
use Shared\Database;
use Shared\Request;
use Shared\Response;

class ProfileController
{
    public function show(int $userId): Response
    {
        if ($userId <= 0) {
            return Response::validationError(['user_id' => 'Parâmetro user_id é obrigatório']);
        }

        $db = Database::getInstance()->getConnection();
        $repo = new UserProfileRepository($db);
        $profile = $repo->findByUserId($userId);

        if ($profile === null) {
            return Response::notFound('Usuário não encontrado');
        }

        return Response::success($profile);
    }

    public function updateProfile(int $userId, Request $request): Response
    {
        if ($userId <= 0) {
            return Response::validationError(['user_id' => 'Parâmetro user_id é obrigatório']);
        }

        $payload = $request->getBody();
        $firstName = trim((string) ($payload['first_name'] ?? ''));
        $lastName = trim((string) ($payload['last_name'] ?? ''));
        $email = trim((string) ($payload['email'] ?? ''));
        $phone = trim((string) ($payload['phone'] ?? ''));
        $jobTitle = trim((string) ($payload['job_title'] ?? ''));
        $avatarUrl = trim((string) ($payload['avatar_url'] ?? ''));

        $errors = [];
        if ($firstName === '') {
            $errors['first_name'] = 'Nome é obrigatório';
        }
        if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            $errors['email'] = 'E-mail inválido';
        }
        if ($avatarUrl !== '' && filter_var($avatarUrl, FILTER_VALIDATE_URL) === false) {
            $errors['avatar_url'] = 'URL da foto inválida';
        }
        if (!empty($errors)) {
            return Response::validationError($errors);
        }

        $db = Database::getInstance()->getConnection();
        $repo = new UserProfileRepository($db);
        $existing = $repo->findByUserId($userId);
        if ($existing === null) {
            return Response::notFound('Usuário não encontrado');
        }

        if ($repo->existsEmailForAnotherUser($email, $userId)) {
            return Response::error('E-mail já cadastrado para outro usuário', 409);
        }

        $db->beginTransaction();
        try {
            $repo->updateProfile($userId, $firstName, $lastName, $email, $phone, $jobTitle, $avatarUrl);
            $updated = $repo->findByUserId($userId);
            $db->commit();

            return Response::success($updated, 200, 'Perfil atualizado com sucesso');
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }
    }

    public function updatePassword(int $userId, Request $request): Response
    {
        if ($userId <= 0) {
            return Response::validationError(['user_id' => 'Parâmetro user_id é obrigatório']);
        }

        $payload = $request->getBody();
        $currentPassword = (string) ($payload['current_password'] ?? '');
        $newPassword = (string) ($payload['new_password'] ?? '');

        $errors = [];
        if ($currentPassword === '') {
            $errors['current_password'] = 'Senha atual é obrigatória';
        }
        if (strlen($newPassword) < 6) {
            $errors['new_password'] = 'Nova senha deve ter ao menos 6 caracteres';
        }
        if (!empty($errors)) {
            return Response::validationError($errors);
        }

        $db = Database::getInstance()->getConnection();
        $repo = new UserProfileRepository($db);
        $existingHash = $repo->getPasswordHashByUserId($userId);
        if ($existingHash === null) {
            return Response::notFound('Usuário não encontrado');
        }

        if (!password_verify($currentPassword, $existingHash)) {
            return Response::error('Senha atual incorreta', 422);
        }

        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        if ($newHash === false) {
            return Response::error('Falha ao processar nova senha', 500);
        }

        $repo->updatePassword($userId, $newHash);
        return Response::success(null, 200, 'Senha atualizada com sucesso');
    }

    public function verifyCurrentPassword(int $userId, Request $request): Response
    {
        if ($userId <= 0) {
            return Response::validationError(['user_id' => 'Parâmetro user_id é obrigatório']);
        }

        $currentPassword = (string) $request->getBodyParam('current_password', '');
        if ($currentPassword === '') {
            return Response::validationError(['current_password' => 'Senha atual é obrigatória']);
        }

        $db = Database::getInstance()->getConnection();
        $repo = new UserProfileRepository($db);
        $existingHash = $repo->getPasswordHashByUserId($userId);
        if ($existingHash === null) {
            return Response::notFound('Usuário não encontrado');
        }

        if (!password_verify($currentPassword, $existingHash)) {
            return Response::error('Senha atual incorreta', 422);
        }

        return Response::success(['valid' => true], 200, 'Senha atual validada');
    }
}
