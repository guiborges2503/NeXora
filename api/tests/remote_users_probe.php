<?php

$base = $argv[1] ?? 'http://127.0.0.1:8000/api';

function request(string $method, string $url, ?array $body = null, ?string $token = null): array
{
    $ch = curl_init($url);
    $headers = ['Content-Type: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 20,
    ]);

    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }

    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'status' => $status,
        'raw' => $raw,
        'json' => json_decode((string) $raw, true),
    ];
}

echo "Base: {$base}\n\n";

$health = request('GET', rtrim($base, '/') . '/health.php');
echo "health HTTP {$health['status']}\n";
echo substr((string) $health['raw'], 0, 500) . "\n\n";

$login = request('POST', rtrim($base, '/') . '/auth_login.php', [
    'email' => 'admin@nexora.local',
    'password' => 'admin123',
]);
echo "login HTTP {$login['status']}\n";
echo substr((string) $login['raw'], 0, 400) . "\n\n";

$token = $login['json']['data']['token'] ?? null;
if (!$token) {
    exit(1);
}

$users = request('GET', rtrim($base, '/') . '/users.php', null, $token);
echo "users HTTP {$users['status']}\n";
echo (string) $users['raw'] . "\n";
