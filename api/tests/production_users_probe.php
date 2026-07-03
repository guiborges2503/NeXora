<?php

$base = $argv[1] ?? 'https://nexora.conectaxcon.com.br/api';
$curl = 'curl.exe';

function runCurl(string $curl, string $method, string $url, ?string $jsonBody = null, ?string $token = null): array
{
    $args = [$curl, '-sS', '--max-time', '20', '-X', $method, $url, '-H', 'Content-Type: application/json'];
    if ($token) {
        $args[] = '-H';
        $args[] = 'Authorization: Bearer ' . $token;
    }
    if ($jsonBody !== null) {
        $args[] = '--data';
        $args[] = $jsonBody;
    }

    $cmd = implode(' ', array_map('escapeshellarg', $args));
    $raw = shell_exec($cmd);

    return ['raw' => $raw ?? '', 'json' => json_decode((string) ($raw ?? ''), true)];
}

echo "Base: {$base}\n\n";

$health = runCurl($curl, 'GET', rtrim($base, '/') . '/health.php');
echo "health:\n{$health['raw']}\n\n";

$loginBody = json_encode(['email' => 'admin@nexora.local', 'password' => 'admin123']);
$login = runCurl($curl, 'POST', rtrim($base, '/') . '/auth_login.php', $loginBody);
echo "login:\n{$login['raw']}\n\n";

$token = $login['json']['data']['token'] ?? null;
if ($token) {
    $users = runCurl($curl, 'GET', rtrim($base, '/') . '/users.php', null, $token);
    echo "users:\n{$users['raw']}\n";
}
