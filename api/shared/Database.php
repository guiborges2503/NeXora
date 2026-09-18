<?php
/**
 * Classe Database - Singleton para gerenciamento de conexões PDO
 * Padrão Nortrek - Compatível com getConexaoDB1()
 */
namespace Shared;

use PDO;
use PDOException;

class Database
{
    private static ?Database $instance = null;
    private ?PDO $connection = null;

    private function __construct()
    {
    }

    public static function getInstance(): Database
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection(): PDO
    {
        if ($this->connection === null) {
            require_once __DIR__ . '/../settings/includes.php';
            $this->connection = getConexaoDB1();

            if ($this->connection === null) {
                $detail = function_exists('getLastDbConnectionError') ? getLastDbConnectionError() : null;
                throw new \RuntimeException(self::connectionErrorMessage($detail));
            }

            $schema = validateDatabaseSchema($this->connection);
            if (!$schema['ok']) {
                throw new \RuntimeException(
                    'Schema incompleto. Tabelas faltando: ' . implode(', ', $schema['missing'])
                    . '. Importe database/install_mysql.sql no phpMyAdmin.'
                );
            }
        }

        return $this->connection;
    }

    public function beginTransaction(): bool
    {
        return $this->getConnection()->beginTransaction();
    }

    public function commit(): bool
    {
        return $this->getConnection()->commit();
    }

    public function rollBack(): bool
    {
        return $this->getConnection()->rollBack();
    }

    public function inTransaction(): bool
    {
        return $this->getConnection()->inTransaction();
    }

    public function prepare(string $sql): \PDOStatement
    {
        return $this->getConnection()->prepare($sql);
    }

    public function query(string $sql): \PDOStatement
    {
        return $this->getConnection()->query($sql);
    }

    public function lastInsertId(?string $name = null): string
    {
        return $this->getConnection()->lastInsertId($name);
    }

    private static function connectionErrorMessage(?string $detail): string
    {
        $detail = trim((string) $detail);
        $isDev = function_exists('getEnvironment') && getEnvironment() === 'development';

        if ($isDev && $detail !== '') {
            if (stripos($detail, 'Access denied') !== false) {
                $ip = null;
                if (preg_match("/@'([^']+)'/", $detail, $matches)) {
                    $ip = $matches[1];
                }

                $ipHint = $ip ? " Libere o IP {$ip}" : ' Libere o IP deste computador';

                return 'O MySQL da Hostinger recusou o acesso remoto.'
                    . $ipHint
                    . ' (ou % ) em Bancos de dados → MySQL remoto. O NeXora no WAMP usa esse MySQL, não um banco local.';
            }

            if (
                stripos($detail, '2002') !== false
                || stripos($detail, 'timed out') !== false
                || stripos($detail, 'não respondeu') !== false
                || stripos($detail, 'failed to respond') !== false
            ) {
                $host = defined('DB_HOST') ? DB_HOST : 'srv806.hstgr.io';

                return "Não foi possível alcançar o MySQL remoto ({$host}:3306). "
                    . 'No hPanel, confirme o host em Bancos de dados → MySQL remoto, '
                    . 'libere seu IP (ou %) e verifique firewall/VPN. '
                    . 'Detalhe: ' . $detail;
            }
        }

        return 'Falha ao conectar ao banco de dados';
    }

    private function __clone() {}

    public function __wakeup()
    {
        throw new \Exception("Não é possível deserializar singleton");
    }
}
