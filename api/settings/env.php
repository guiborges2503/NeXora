<?php

/**
 * Carrega variáveis opcionais de api/.env (JWT, OpenRouter, e-mail).
 * O banco de dados NÃO usa .env — veja api/settings/settings.php.
 */
function loadApiEnvFile(): void
{
    static $loaded = false;
    if ($loaded) {
        return;
    }
    $loaded = true;

    $envPath = dirname(__DIR__) . '/.env';
    if (!is_readable($envPath)) {
        return;
    }

    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    if (isset($lines[0])) {
        $lines[0] = preg_replace('/^\xEF\xBB\xBF/', '', $lines[0]);
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || (isset($line[0]) && $line[0] === '#')) {
            continue;
        }

        $pos = strpos($line, '=');
        if ($pos === false) {
            continue;
        }

        $key = trim(substr($line, 0, $pos));
        $value = trim(substr($line, $pos + 1));
        if ($key === '') {
            continue;
        }

        $quotedDouble = strlen($value) >= 2 && $value[0] === '"' && substr($value, -1) === '"';
        $quotedSingle = strlen($value) >= 2 && $value[0] === "'" && substr($value, -1) === "'";
        if ($quotedDouble || $quotedSingle) {
            $value = substr($value, 1, -1);
        }

        // .env no servidor tem prioridade sobre variáveis vazias do painel de hospedagem
        putenv("{$key}={$value}");
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}

loadApiEnvFile();
