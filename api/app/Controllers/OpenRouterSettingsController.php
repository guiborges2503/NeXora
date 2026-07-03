<?php

namespace App\Controllers;

use App\Repositories\OpenRouterSettingsRepository;
use App\Services\OpenRouterService;
use Shared\Database;
use Shared\Request;
use Shared\Response;

class OpenRouterSettingsController
{
    public function show(): Response
    {
        $db = Database::getInstance()->getConnection();
        $repo = new OpenRouterSettingsRepository($db);
        $settings = $repo->get();

        $apiKey = trim($settings['api_key']);
        $envKey = trim((string) OPENROUTER_API_KEY);
        $envModel = trim((string) OPENROUTER_DEFAULT_MODEL) ?: 'openai/gpt-4o-mini';

        $resolvedKey = $apiKey !== '' ? $apiKey : $envKey;
        $resolvedModel = $settings['default_model'];
        if ($apiKey === '' && $envKey !== '' && $envModel !== '') {
            $resolvedModel = $envModel;
        }

        if ($apiKey === '' && $envKey !== '') {
            $source = 'env';
        } elseif ($apiKey !== '') {
            $source = 'database';
        } else {
            $source = 'none';
        }

        return Response::success([
            'api_key' => $resolvedKey,
            'default_model' => $resolvedModel !== '' ? $resolvedModel : 'openai/gpt-4o-mini',
            'has_api_key' => $resolvedKey !== '',
            'api_key_masked' => $this->maskApiKey($resolvedKey),
            'source' => $source,
            'updated_at' => $settings['updated_at'],
            'updated_by' => $settings['updated_by'],
        ]);
    }

    public function update(Request $request, int $userId): Response
    {
        $payload = $request->getBody();
        $apiKey = trim((string) ($payload['api_key'] ?? ''));
        $defaultModel = trim((string) ($payload['default_model'] ?? ''));

        if ($defaultModel === '') {
            return Response::validationError(['default_model' => 'Informe o modelo padrão']);
        }

        $db = Database::getInstance()->getConnection();
        $repo = new OpenRouterSettingsRepository($db);
        $repo->save($apiKey, $defaultModel, $userId);
        $settings = $repo->get();

        return Response::success([
            'api_key' => $apiKey,
            'default_model' => $settings['default_model'],
            'has_api_key' => $apiKey !== '',
            'api_key_masked' => $this->maskApiKey($apiKey),
            'source' => $apiKey !== '' ? 'database' : 'none',
            'updated_at' => $settings['updated_at'],
            'updated_by' => $settings['updated_by'],
        ], 200, 'Configuração OpenRouter salva com sucesso');
    }

    public function clear(int $userId): Response
    {
        $db = Database::getInstance()->getConnection();
        $repo = new OpenRouterSettingsRepository($db);
        $repo->clear($userId);

        return Response::success([
            'api_key' => '',
            'default_model' => 'openai/gpt-4o-mini',
            'has_api_key' => trim((string) OPENROUTER_API_KEY) !== '',
            'api_key_masked' => $this->maskApiKey(trim((string) OPENROUTER_API_KEY)),
            'source' => trim((string) OPENROUTER_API_KEY) !== '' ? 'env' : 'none',
            'updated_at' => date('Y-m-d H:i:s'),
            'updated_by' => $userId,
        ], 200, 'Configuração OpenRouter removida do banco');
    }

    public function test(Request $request): Response
    {
        $payload = $request->getBody();
        $apiKey = trim((string) ($payload['api_key'] ?? ''));

        if ($apiKey === '') {
            $db = Database::getInstance()->getConnection();
            $repo = new OpenRouterSettingsRepository($db);
            $settings = $repo->get();
            $apiKey = trim($settings['api_key']);
        }

        if ($apiKey === '') {
            $apiKey = trim((string) OPENROUTER_API_KEY);
        }

        if ($apiKey === '') {
            return Response::validationError(['api_key' => 'Informe a chave da API antes de testar']);
        }

        $service = new OpenRouterService();
        $result = $service->testConnection($apiKey);

        if (!$result['ok']) {
            return Response::error($result['message'], 422);
        }

        return Response::success([
            'model_count' => $result['model_count'],
        ], 200, $result['message']);
    }

    private function maskApiKey(string $apiKey): string
    {
        $apiKey = trim($apiKey);
        if ($apiKey === '') {
            return '';
        }

        if (strlen($apiKey) <= 8) {
            return str_repeat('*', strlen($apiKey));
        }

        return substr($apiKey, 0, 8) . str_repeat('*', max(4, strlen($apiKey) - 12)) . substr($apiKey, -4);
    }
}
