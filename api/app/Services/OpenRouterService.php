<?php

namespace App\Services;

use RuntimeException;

class OpenRouterService
{
    private const CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';

    /**
     * @param array<int, array{role:string,content:string}> $messages
     */
    public function chatCompletion(
        array $messages,
        ?string $apiKey = null,
        ?string $model = null,
        bool $jsonMode = false
    ): string {
        $key = trim((string) ($apiKey ?: OPENROUTER_API_KEY));
        if ($key === '') {
            throw new RuntimeException('Chave OpenRouter não configurada. Defina OPENROUTER_API_KEY ou informe api_key.');
        }

        $body = [
            'model' => trim((string) ($model ?: OPENROUTER_DEFAULT_MODEL)),
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
