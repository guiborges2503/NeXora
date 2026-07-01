<?php

namespace App\Services;

use App\Repositories\PasswordResetRepository;
use App\Repositories\UserRepository;
use RuntimeException;
use Shared\MailDelivery;
use Shared\Logger;

class PasswordResetService
{
    private const TOKEN_BYTES = 32;
    private const TTL_SECONDS = 3600;

    /** @var UserRepository */
    private $users;

    /** @var PasswordResetRepository */
    private $tokens;

    public function __construct(UserRepository $users, PasswordResetRepository $tokens)
    {
        $this->users = $users;
        $this->tokens = $tokens;
    }

    /**
     * Solicita reset: não revela se o e-mail existe (sempre retorna sem erro).
     */
    public function requestReset(string $email): void
    {
        $email = $this->normalizeEmail($email);
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return;
        }

        $user = $this->users->findByEmail($email);
        if ($user === null || (string) ($user['status'] ?? '') !== 'active') {
            return;
        }

        $userId = (int) $user['id'];
        $rawToken = bin2hex(random_bytes(self::TOKEN_BYTES));
        $tokenHash = hash('sha256', $rawToken, false);

        $this->tokens->deleteByUserId($userId);
        $expiresAt = date('Y-m-d H:i:s', time() + self::TTL_SECONDS);
        $this->tokens->insert($userId, $tokenHash, $expiresAt);

        $base = rtrim(FRONTEND_PUBLIC_URL, '/');
        $link = $base . '/auth/reset-password?token=' . rawurlencode($rawToken);

        $name = htmlspecialchars((string) ($user['name'] ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $subject = 'Redefinição de senha — NeXora';
        $html = '<p>Olá' . ($name !== '' ? ', ' . $name : '') . '.</p>'
            . '<p>Recebemos um pedido para redefinir a senha da sua conta na NeXora.</p>'
            . '<p><a href="' . htmlspecialchars($link, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')
            . '">Clique aqui para criar uma nova senha</a>.</p>'
            . '<p>O link expira em aproximadamente 1 hora. Se você não solicitou, ignore este e-mail.</p>';

        $sent = MailDelivery::sendHtml($email, $subject, $html);

        if (!$sent) {
            Logger::getInstance()->error('PasswordResetService: falha ao enviar e-mail', ['email' => $email]);
            if (defined('DEBUG_MODE') && DEBUG_MODE) {
                $logPath = dirname(__DIR__, 3) . '/database/data/password_reset_debug.log';
                @file_put_contents(
                    $logPath,
                    date('c') . " email={$email} reset_link={$link}\n",
                    FILE_APPEND
                );
            }
        }
    }

    public function resetPassword(string $rawToken, string $newPassword): void
    {
        $rawToken = strtolower(trim($rawToken));
        if (!preg_match('/^[a-f0-9]{64}$/', $rawToken)) {
            throw new RuntimeException('Token inválido ou expirado');
        }

        if (strlen($newPassword) < 6) {
            throw new RuntimeException('A nova senha deve ter ao menos 6 caracteres');
        }

        $tokenHash = hash('sha256', $rawToken, false);
        $row = $this->tokens->findValidByTokenHash($tokenHash);
        if ($row === null) {
            throw new RuntimeException('Token inválido ou expirado');
        }

        $userId = (int) $row['user_id'];
        $user = $this->users->findById($userId);
        if ($user === null || (string) ($user['status'] ?? '') !== 'active') {
            throw new RuntimeException('Token inválido ou expirado');
        }

        $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
        if ($passwordHash === false) {
            throw new RuntimeException('Falha ao processar nova senha');
        }

        $this->users->updatePassword($userId, $passwordHash);
        $this->tokens->deleteByUserId($userId);
    }

    private function normalizeEmail(string $email): string
    {
        $email = trim($email);
        return function_exists('mb_strtolower') ? mb_strtolower($email) : strtolower($email);
    }
}
