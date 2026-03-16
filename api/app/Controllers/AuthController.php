<?php

namespace App\Controllers;

use App\Repositories\UserRepository;
use App\Services\AuthService;
use App\Validators\UserValidator;
use Shared\Database;
use Shared\Request;
use Shared\Response;
use RuntimeException;

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

            return Response::success($user, 200, 'Login realizado');
        } catch (RuntimeException $e) {
            return Response::unauthorized($e->getMessage());
        }
    }
}
