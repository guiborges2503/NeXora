<?php

namespace App\Services;

use RuntimeException;

class JwtService
{
    /**
     * @param array{id:int|string,email:string,role?:string} $user
     */
    public static function issue(array $user): string
    {
        $now = time();
        $payload = [
            'sub' => (int) $user['id'],
            'email' => (string) $user['email'],
            'role' => (string) ($user['role'] ?? 'viewer'),
            'iat' => $now,
            'exp' => $now + JWT_TTL_SECONDS,
        ];

        return self::encode($payload);
    }

    /**
     * @return array{sub:int,email:string,role:string,iat:int,exp:int}|null
     */
    public static function decode(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;
        $headerJson = self::base64UrlDecode($encodedHeader);
        $payloadJson = self::base64UrlDecode($encodedPayload);

        if ($headerJson === null || $payloadJson === null) {
            return null;
        }

        $header = json_decode($headerJson, true);
        $payload = json_decode($payloadJson, true);

        if (!is_array($header) || !is_array($payload)) {
            return null;
        }

        if (($header['alg'] ?? '') !== 'HS256') {
            return null;
        }

        $expectedSignature = self::base64UrlEncode(
            hash_hmac('sha256', $encodedHeader . '.' . $encodedPayload, JWT_SECRET, true)
        );

        if (!hash_equals($expectedSignature, $encodedSignature)) {
            return null;
        }

        $exp = (int) ($payload['exp'] ?? 0);
        if ($exp <= time()) {
            return null;
        }

        $sub = (int) ($payload['sub'] ?? 0);
        if ($sub <= 0) {
            return null;
        }

        return [
            'sub' => $sub,
            'email' => (string) ($payload['email'] ?? ''),
            'role' => (string) ($payload['role'] ?? 'viewer'),
            'iat' => (int) ($payload['iat'] ?? 0),
            'exp' => $exp,
        ];
    }

    /**
     * @param array<string, mixed> $payload
     */
    private static function encode(array $payload): string
    {
        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        $encodedHeader = self::base64UrlEncode(json_encode($header, JSON_UNESCAPED_UNICODE));
        $encodedPayload = self::base64UrlEncode(json_encode($payload, JSON_UNESCAPED_UNICODE));

        if ($encodedHeader === null || $encodedPayload === null) {
            throw new RuntimeException('Falha ao gerar token');
        }

        $signature = self::base64UrlEncode(
            hash_hmac('sha256', $encodedHeader . '.' . $encodedPayload, JWT_SECRET, true)
        );

        if ($signature === null) {
            throw new RuntimeException('Falha ao assinar token');
        }

        return $encodedHeader . '.' . $encodedPayload . '.' . $signature;
    }

    private static function base64UrlEncode(string $data): ?string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): ?string
    {
        $remainder = strlen($data) % 4;
        if ($remainder > 0) {
            $data .= str_repeat('=', 4 - $remainder);
        }

        $decoded = base64_decode(strtr($data, '-_', '+/'), true);

        return $decoded === false ? null : $decoded;
    }
}
