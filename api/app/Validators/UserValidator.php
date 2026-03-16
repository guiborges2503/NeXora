<?php

namespace App\Validators;

class UserValidator
{
    public static function validateRegisterPayload(array $payload): array
    {
        $errors = [];

        $name = trim((string) ($payload['name'] ?? ''));
        $email = trim((string) ($payload['email'] ?? ''));
        $password = (string) ($payload['password'] ?? '');

        if ($name === '' || mb_strlen($name) < 3) {
            $errors['name'] = 'Nome deve ter ao menos 3 caracteres';
        }

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'E-mail inválido';
        }

        if (mb_strlen($password) < 6) {
            $errors['password'] = 'Senha deve ter ao menos 6 caracteres';
        }

        return $errors;
    }

    public static function validateLoginPayload(array $payload): array
    {
        $errors = [];

        $email = trim((string) ($payload['email'] ?? ''));
        $password = (string) ($payload['password'] ?? '');

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'E-mail inválido';
        }

        if ($password === '') {
            $errors['password'] = 'Senha é obrigatória';
        }

        return $errors;
    }
}
