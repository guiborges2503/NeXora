<?php

namespace App\Services;

use App\Repositories\OpenRouterSettingsRepository;
use RuntimeException;
use Shared\Database;

class OpenRouterService
{
    private const CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
    private const MODELS_URL = 'https://openrouter.ai/api/v1/models';

    /** @var array{api_key:string,default_model:string}|null */
    private static ?array $cachedDbSettings = null;

    /**
     * @param array<int, array{role:string,content:string}> $messages
     */
    public function chatCompletion(
        array $messages,
        ?string $apiKey = null,
        ?string $model = null,
        bool $jsonMode = false
    ): string {
        $key = $this->resolveApiKey($apiKey);
        if ($key === '') {
            throw new RuntimeException('Chave OpenRouter não configurada. Defina em Configurações → OpenRouter ou OPENROUTER_API_KEY.');
        }

        $body = [
            'model' => $this->resolveModel($model),
            'messages' => $messages,
            'temperature' => 0.2,
        ];

        if ($jsonMode) {
            $body['response_format'] = ['type' => 'json_object'];
        }

        $payload = json_encode($body, JSON_UNESCAPED_UNICODE);

        if ($payload === false) {
            throw new RuntimeException('Falha ao montar payload da IA');
        }

        $responseBody = $this->postJson(self::CHAT_URL, $payload, $key);
        $decoded = json_decode($responseBody, true);

        if (!is_array($decoded)) {
            throw new RuntimeException('Resposta inválida da OpenRouter');
        }

        if (!empty($decoded['error']['message'])) {
            throw new RuntimeException((string) $decoded['error']['message']);
        }

        $content = $decoded['choices'][0]['message']['content'] ?? null;
        if (!is_string($content) || trim($content) === '') {
            throw new RuntimeException('A IA não retornou conteúdo');
        }

        return trim($content);
    }

    public function resolveApiKey(?string $override = null): string
    {
        $override = trim((string) $override);
        if ($override !== '') {
            return $override;
        }

        $dbSettings = $this->getDbSettings();
        $dbKey = trim($dbSettings['api_key']);
        if ($dbKey !== '') {
            return $dbKey;
        }

        return trim((string) OPENROUTER_API_KEY);
    }

    public function resolveModel(?string $override = null): string
    {
        $override = trim((string) $override);
        if ($override !== '') {
            return $override;
        }

        $dbSettings = $this->getDbSettings();
        if (trim($dbSettings['api_key']) !== '') {
            return trim($dbSettings['default_model']) ?: 'openai/gpt-4o-mini';
        }

        $envModel = trim((string) OPENROUTER_DEFAULT_MODEL);
        if ($envModel !== '') {
            return $envModel;
        }

        return trim($dbSettings['default_model']) ?: 'openai/gpt-4o-mini';
    }

    /**
     * @return array{ok:bool,message:string,model_count:int}
     */
    public function testConnection(string $apiKey): array
    {
        $key = trim($apiKey);
        if ($key === '') {
            return [
                'ok' => false,
                'message' => 'Informe a chave da API antes de testar.',
                'model_count' => 0,
            ];
        }

        try {
            $body = $this->getJson(self::MODELS_URL, $key);
            $decoded = json_decode($body, true);
            if (!is_array($decoded)) {
                return [
                    'ok' => false,
                    'message' => 'Resposta inválida da OpenRouter.',
                    'model_count' => 0,
                ];
            }

            if (!empty($decoded['error']['message'])) {
                return [
                    'ok' => false,
                    'message' => (string) $decoded['error']['message'],
                    'model_count' => 0,
                ];
            }

            $list = $decoded['data'] ?? [];
            $modelCount = is_array($list) ? count($list) : 0;
            $message = $modelCount > 0
                ? "Conexão OK. A API respondeu e listou {$modelCount} modelos disponíveis."
                : 'Conexão OK. A chave foi aceita pela OpenRouter.';

            return [
                'ok' => true,
                'message' => $message,
                'model_count' => $modelCount,
            ];
        } catch (RuntimeException $e) {
            return [
                'ok' => false,
                'message' => $e->getMessage(),
                'model_count' => 0,
            ];
        }
    }

    /**
     * @return array{api_key:string,default_model:string}
     */
    private function getDbSettings(): array
    {
        if (self::$cachedDbSettings !== null) {
            return self::$cachedDbSettings;
        }

        try {
            $db = Database::getInstance()->getConnection();
            $repo = new OpenRouterSettingsRepository($db);
            $settings = $repo->get();
            self::$cachedDbSettings = [
                'api_key' => (string) ($settings['api_key'] ?? ''),
                'default_model' => (string) ($settings['default_model'] ?? 'openai/gpt-4o-mini'),
            ];
        } catch (\Throwable $e) {
            self::$cachedDbSettings = [
                'api_key' => '',
                'default_model' => 'openai/gpt-4o-mini',
            ];
        }

        return self::$cachedDbSettings;
    }

    private function getJson(string $url, string $apiKey): string
    {
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_HTTPHEADER => [
                    'Authorization: Bearer ' . $apiKey,
                    'HTTP-Referer: ' . (defined('FRONTEND_BASE_URL') ? FRONTEND_BASE_URL : 'http://localhost'),
                    'X-Title: NeXora',
                ],
            ]);
            $this->applyCurlSslOptions($ch);

            $body = curl_exec($ch);
            $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            if ($body === false) {
                throw new RuntimeException('Falha ao conectar na OpenRouter: ' . $error);
            }

            if ($status >= 400) {
                $decoded = json_decode($body, true);
                $message = is_array($decoded) ? ($decoded['error']['message'] ?? $body) : $body;
                throw new RuntimeException((string) $message);
            }

            return (string) $body;
        }

        $sslVerify = defined('OPENROUTER_SSL_VERIFY') ? OPENROUTER_SSL_VERIFY : true;
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => implode("\r\n", [
                    'Authorization: Bearer ' . $apiKey,
                    'HTTP-Referer: ' . (defined('FRONTEND_BASE_URL') ? FRONTEND_BASE_URL : 'http://localhost'),
                    'X-Title: NeXora',
                ]),
                'timeout' => 30,
            ],
            'ssl' => [
                'verify_peer' => $sslVerify,
                'verify_peer_name' => $sslVerify,
            ],
        ]);

        $body = @file_get_contents($url, false, $context);
        if ($body === false) {
            throw new RuntimeException('Falha ao conectar na OpenRouter');
        }

        return $body;
    }

    private function postJson(string $url, string $payload, string $apiKey): string
    {
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $payload,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 90,
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'Authorization: Bearer ' . $apiKey,
                    'HTTP-Referer: ' . (defined('FRONTEND_BASE_URL') ? FRONTEND_BASE_URL : 'http://localhost'),
                    'X-Title: NeXora',
                ],
            ]);
            $this->applyCurlSslOptions($ch);

            $body = curl_exec($ch);
            $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            if ($body === false) {
                throw new RuntimeException('Falha ao conectar na OpenRouter: ' . $error);
            }

            if ($status >= 400) {
                $decoded = json_decode($body, true);
                $message = is_array($decoded) ? ($decoded['error']['message'] ?? $body) : $body;
                throw new RuntimeException((string) $message);
            }

            return (string) $body;
        }

        $sslVerify = defined('OPENROUTER_SSL_VERIFY') ? OPENROUTER_SSL_VERIFY : true;
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => implode("\r\n", [
                    'Content-Type: application/json',
                    'Authorization: Bearer ' . $apiKey,
                    'HTTP-Referer: ' . (defined('FRONTEND_BASE_URL') ? FRONTEND_BASE_URL : 'http://localhost'),
                    'X-Title: NeXora',
                ]),
                'content' => $payload,
                'timeout' => 90,
            ],
            'ssl' => [
                'verify_peer' => $sslVerify,
                'verify_peer_name' => $sslVerify,
            ],
        ]);

        $body = @file_get_contents($url, false, $context);
        if ($body === false) {
            throw new RuntimeException('Falha ao conectar na OpenRouter');
        }

        return $body;
    }

    /**
     * @param resource $ch
     */
    private function applyCurlSslOptions($ch): void
    {
        if (defined('CURL_HTTP_VERSION_1_1')) {
            curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
        }

        $verify = defined('OPENROUTER_SSL_VERIFY') ? OPENROUTER_SSL_VERIFY : true;

        if (!$verify) {
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);

            return;
        }

        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

        $caFile = $this->resolveCaBundlePath();
        if ($caFile !== null) {
            curl_setopt($ch, CURLOPT_CAINFO, $caFile);
        }
    }

    private function resolveCaBundlePath(): ?string
    {
        $candidates = [];

        $fromEnv = getenv('CURL_CA_BUNDLE');
        if (is_string($fromEnv) && $fromEnv !== '') {
            $candidates[] = $fromEnv;
        }

        $curlCainfo = ini_get('curl.cainfo');
        if (is_string($curlCainfo) && $curlCainfo !== '') {
            $candidates[] = $curlCainfo;
        }

        $opensslCafile = ini_get('openssl.cafile');
        if (is_string($opensslCafile) && $opensslCafile !== '') {
            $candidates[] = $opensslCafile;
        }

        foreach ($candidates as $path) {
            if (is_file($path) && is_readable($path)) {
                return $path;
            }
        }

        return null;
    }
}
