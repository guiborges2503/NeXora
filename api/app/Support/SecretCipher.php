<?php

namespace App\Support;

final class SecretCipher
{
    private const PREFIX = 'enc:v1:';

    public static function encrypt(string $plain): string
    {
        $plain = trim($plain);
        if ($plain === '') {
            return '';
        }

        $key = self::key();
        $iv = random_bytes(16);
        $cipher = openssl_encrypt($plain, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
        if ($cipher === false) {
            throw new \RuntimeException('Falha ao proteger credencial');
        }

        return self::PREFIX . base64_encode($iv . $cipher);
    }

    public static function decrypt(string $stored): string
    {
        $stored = trim($stored);
        if ($stored === '') {
            return '';
        }

        if (strpos($stored, self::PREFIX) !== 0) {
            return $stored;
        }

        $raw = base64_decode(substr($stored, strlen(self::PREFIX)), true);
        if ($raw === false || strlen($raw) < 17) {
            return '';
        }

        $iv = substr($raw, 0, 16);
        $cipher = substr($raw, 16);
        $plain = openssl_decrypt($cipher, 'AES-256-CBC', self::key(), OPENSSL_RAW_DATA, $iv);

        return $plain === false ? '' : $plain;
    }

    public static function mask(string $value, int $prefix = 4, int $suffix = 2): string
    {
        $value = trim($value);
        if ($value === '') {
            return '';
        }

        $len = strlen($value);
        if ($len <= $prefix + $suffix) {
            return str_repeat('•', $len);
        }

        return substr($value, 0, $prefix) . str_repeat('•', max(4, $len - $prefix - $suffix)) . substr($value, -$suffix);
    }

    private static function key(): string
    {
        $secret = defined('JWT_SECRET') ? (string) JWT_SECRET : 'nexora-data-source';

        return hash('sha256', $secret . '|nexora-company-data-source', true);
    }
}
