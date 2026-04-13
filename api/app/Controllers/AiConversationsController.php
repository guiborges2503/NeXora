<?php

namespace App\Controllers;

use App\Repositories\AiConversationRepository;
use Shared\Database;
use Shared\Request;
use Shared\Response;

class AiConversationsController
{
    private const MAX_MESSAGES_JSON_BYTES = 512000;
    private const MAX_TITLE_LEN = 200;

    public function index(Request $request): Response
    {
        $userId = (int) $request->getQueryParam('user_id', 0);
        if ($userId <= 0) {
            return Response::validationError(['user_id' => 'Parâmetro user_id é obrigatório']);
        }

        $db = Database::getInstance()->getConnection();
        $repo = new AiConversationRepository($db);
        $items = $repo->listByUserId($userId);

        return Response::success($items);
    }

    public function show(int $id, Request $request): Response
    {
        $userId = (int) $request->getQueryParam('user_id', 0);
        if ($userId <= 0) {
            return Response::validationError(['user_id' => 'Parâmetro user_id é obrigatório']);
        }

        $db = Database::getInstance()->getConnection();
        $repo = new AiConversationRepository($db);
        $row = $repo->findByIdForUser($id, $userId);
        if ($row === null) {
            return Response::notFound('Conversa não encontrada');
        }

        return Response::success($row);
    }

    public function store(Request $request): Response
    {
        $payload = $request->getBody();
        $userId = (int) ($payload['user_id'] ?? 0);
        $title = trim((string) ($payload['title'] ?? ''));
        $messages = $payload['messages'] ?? null;

        $errors = $this->validateUserAndMessages($userId, $messages);
        if ($title === '') {
            $title = 'Nova conversa';
        }
        $title = $this->clipTitle($title);
        if (!empty($errors)) {
            return Response::validationError($errors);
        }

        $json = $this->encodeMessages($messages);
        if ($json === null) {
            return Response::validationError(['messages' => 'Payload de mensagens inválido ou muito grande']);
        }

        $db = Database::getInstance()->getConnection();
        $repo = new AiConversationRepository($db);
        $newId = $repo->create($userId, $title, $json);
        $created = $repo->findByIdForUser($newId, $userId);

        return Response::success($created, 201, 'Conversa criada');
    }

    public function update(int $id, Request $request): Response
    {
        $payload = $request->getBody();
        $userId = (int) ($payload['user_id'] ?? 0);
        if ($userId <= 0) {
            return Response::validationError(['user_id' => 'user_id é obrigatório no corpo']);
        }

        $db = Database::getInstance()->getConnection();
        $repo = new AiConversationRepository($db);
        $existing = $repo->findByIdForUser($id, $userId);
        if ($existing === null) {
            return Response::notFound('Conversa não encontrada');
        }

        $hasTitle = array_key_exists('title', $payload);
        $hasMessages = array_key_exists('messages', $payload);

        if (!$hasTitle && !$hasMessages) {
            return Response::validationError(['messages' => 'Informe title e/ou messages']);
        }

        $title = $hasTitle ? trim((string) $payload['title']) : (string) ($existing['title'] ?? '');
        if ($title === '') {
            $title = 'Nova conversa';
        }
        $title = $this->clipTitle($title);

        if ($hasMessages) {
            $errors = $this->validateUserAndMessages($userId, $payload['messages']);
            if (!empty($errors)) {
                return Response::validationError($errors);
            }
            $json = $this->encodeMessages($payload['messages']);
            if ($json === null) {
                return Response::validationError(['messages' => 'Payload de mensagens inválido ou muito grande']);
            }
            $ok = $repo->update($id, $userId, $title, $json);
        } else {
            $ok = $repo->updateTitle($id, $userId, $title);
        }

        if (!$ok) {
            return Response::error('Não foi possível atualizar', 500);
        }

        $updated = $repo->findByIdForUser($id, $userId);

        return Response::success($updated, 200, 'Conversa atualizada');
    }

    private function validateUserAndMessages(int $userId, $messages): array
    {
        $errors = [];
        if ($userId <= 0) {
            $errors['user_id'] = 'user_id inválido';
        }
        if (!is_array($messages)) {
            $errors['messages'] = 'messages deve ser um array';
        }

        return $errors;
    }

    /**
     * @param mixed $messages
     */
    private function encodeMessages($messages): ?string
    {
        if (!is_array($messages)) {
            return null;
        }
        $json = json_encode($messages, JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            return null;
        }
        if (strlen($json) > self::MAX_MESSAGES_JSON_BYTES) {
            return null;
        }

        return $json;
    }

    private function clipTitle(string $title): string
    {
        if (function_exists('mb_strlen') && function_exists('mb_substr')) {
            if (mb_strlen($title, 'UTF-8') > self::MAX_TITLE_LEN) {
                return mb_substr($title, 0, self::MAX_TITLE_LEN, 'UTF-8');
            }

            return $title;
        }
        if (strlen($title) > self::MAX_TITLE_LEN) {
            return substr($title, 0, self::MAX_TITLE_LEN);
        }

        return $title;
    }
}
