<?php
/**
 * Includes centralizados - TCC API
 * Carrega todas as dependências necessárias para os endpoints
 */

include_once __DIR__ . '/app_config.php';
include_once __DIR__ . '/settings.php';

// Autoload para classes Shared
require_once __DIR__ . '/../shared/autoload.php';

date_default_timezone_set('America/Sao_Paulo');

$isCliMode = (php_sapi_name() === 'cli');

if (!$isCliMode) {
    header("Content-Type: text/html; charset=utf-8");
    header("X-Frame-Options: DENY");
    header("X-Content-Type-Options: nosniff");
    header("X-XSS-Protection: 1; mode=block");
}

/**
 * Cria conexão PDO com o banco de dados
 */
function createPDOConnection()
{
    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        DB_HOST,
        DB_PORT,
        DB_NAME,
        DB_CHARSET
    );

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => true,
    ];

    try {
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        $logFile = __DIR__ . '/erro_conexao.log';
        @file_put_contents(
            $logFile,
            sprintf("%s - Erro de conexão: %s%s", date('Y-m-d H:i:s'), $e->getMessage(), PHP_EOL),
            FILE_APPEND
        );
        return null;
    }
}

/**
 * Singleton da conexão principal
 */
function getConexaoDB1()
{
    static $conexaoDB = null;
    if ($conexaoDB === null) {
        $conexaoDB = createPDOConnection();
    }
    return $conexaoDB;
}
