<?php

namespace App\Controllers;

use App\Repositories\PasswordResetRepository;
use App\Repositories\UserRepository;
use App\Services\AuthService;
use App\Services\JwtService;
use App\Services\PasswordResetService;
use App\Validators\UserValidator;
use Shared\Database;
use Shared\Logger;
use Shared\Request;
use Shared\Response;
use RuntimeException;
use Throwable;

class AuthController
{
    public function register(Request $request): Response
    {
        $payload = $request->getBody();
        $errors = UserValidator::validateRegisterPayload($payload);

        if (!empty($errors)) {
            return Response::validationError($errors);
        }

        try {
            $db = Database::getInstance()->getConnection();
            $service = new AuthService(new UserRepository($db));
            $user = $service->register(
                (string) $payload['name'],
                (string) $payload['email'],
                (string) $payload['password']
            );

            return Response::success($user, 201, 'Usuário criado com sucesso');
        } catch (RuntimeException $e) {
            return Response::error($e->getMessage(), 409);
        }
    }

    public function login(Request $request): Response
    {
        $payload = $request->getBody();
        $errors = UserValidator::validateLoginPayload($payload);

        if (!empty($errors)) {
            return Response::validationError($errors);
        }

        try {
            $db = Database::getInstance()->getConnection();
            $service = new AuthService(new UserRepository($db));
            $user = $service->login(
                (string) $payload['email'],
                (string) $payload['password']
            );
            $user['token'] = JwtService::issue($user);

            return Response::success($user, 200, 'Login realizado');
        } catch (RuntimeException $e) {
            return Response::unauthorized($e->getMessage());
        }
    }

    public function forgotPassword(Request $request): Response
    {
        $payload = $request->getBody();
        $errors = UserValidator::validateForgotPasswordPayload($payload);

        if (!empty($errors)) {
            return Response::validationError($errors);
        }

        try {
            $db = Database::getInstance()->getConnection();
            $service = new PasswordResetService(
                new UserRepository($db),
                new PasswordResetRepository($db)
            );
            $service->requestReset((string) $payload['email']);

            return Response::success(
                null,
                200,
                'Se o e-mail existir em nossa base, você receberá instruções para redefinir a senha.'
            );
        } catch (Throwable $e) {
            Logger::getInstance()->error('auth forgotPassword: ' . $e->getMessage());
            return Response::error('Erro interno', 500);
        }
    }

    public function resetPassword(Request $request): Response
    {
        $payload = $request->getBody();
        $errors = UserValidator::validateResetPasswordPayload($payload);

        if (!empty($errors)) {
            return Response::validationError($errors);
        }

        try {
            $db = Database::getInstance()->getConnection();
            $service = new PasswordResetService(
                new UserRepository($db),
                new PasswordResetRepository($db)
            );
            $service->resetPassword(
                (string) $payload['token'],
                (string) $payload['password']
            );

            return Response::success(null, 200, 'Senha redefinida com sucesso. Faça login com a nova senha.');
        } catch (RuntimeException $e) {
            return Response::error($e->getMessage(), 400);
        } catch (Throwable $e) {
            Logger::getInstance()->error('auth resetPassword: ' . $e->getMessage());
            return Response::error('Erro interno', 500);
        }
    }
}
