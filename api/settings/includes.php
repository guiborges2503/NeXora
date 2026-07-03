<?php
/**
 * Includes centralizados - TCC API
 * Carrega todas as dependências necessárias para os endpoints
 */

include_once __DIR__ . '/env.php';
include_once __DIR__ . '/app_config.php';
include_once __DIR__ . '/settings.php';
require_once __DIR__ . '/../database/db_dialect.php';

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
function setLastDbConnectionError(?string $message): void
{
    $GLOBALS['nexora_last_db_error'] = $message;
}

function getLastDbConnectionError(): ?string
{
    return $GLOBALS['nexora_last_db_error'] ?? null;
}

function createPDOConnection()
{
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    try {
        if (DB_DRIVER !== 'mysql') {
            throw new PDOException('Apenas MySQL é suportado. Defina DB_DRIVER=mysql em api/settings/settings.php');
        }

        if (
            function_exists('getEnvironment')
            && getEnvironment() === 'development'
            && DB_HOST === ''
        ) {
            throw new PDOException(
                'DB_REMOTE_HOST não configurado. No PC, use o MySQL remoto da Hostinger: '
                . 'painel → Bancos de dados → MySQL remoto → habilite seu IP e copie o host '
                . '(ex.: srv1234.hstgr.io). Defina em api/.env ou api/settings/settings.php.'
            );
        }

        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST,
            DB_PORT,
            DB_NAME,
            DB_CHARSET
        );

        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        setLastDbConnectionError($e->getMessage());
        $logFile = __DIR__ . '/erro_conexao.log';
        @file_put_contents(
            $logFile,
            sprintf(
                "%s - Erro de conexão (%s): %s%s",
                date('Y-m-d H:i:s'),
                DB_DRIVER,
                $e->getMessage(),
                PHP_EOL
            ),
            FILE_APPEND
        );
        return null;
    }
}

/**
 * Valida se todas as tabelas obrigatórias existem (resultado em cache por requisição).
 *
 * @return array{
 *     ok: bool,
 *     required_count: int,
 *     present_count: int,
 *     missing: string[],
 *     present: string[],
 *     schema_source: string
 * }
 */
function validateDatabaseSchema(PDO $pdo): array
{
    static $cachedResult = null;

    if ($cachedResult !== null) {
        return $cachedResult;
    }

    $service = new \App\Services\DatabaseSchemaService();
    $cachedResult = $service->validate($pdo);

    return $cachedResult;
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
