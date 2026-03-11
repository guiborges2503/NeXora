<?php
/**
 * Classe Logger - Sistema de logs simplificado
 * Padrão Nortrek
 */
namespace Shared;

class Logger
{
    private static ?Logger $instance = null;
    private string $logDir;
    private bool $debugMode;

    private function __construct()
    {
        $this->logDir = __DIR__ . '/../logs';
        $this->debugMode = defined('DEBUG_MODE') && DEBUG_MODE;

        if (!is_dir($this->logDir)) {
            mkdir($this->logDir, 0755, true);
        }
    }

    public static function getInstance(): Logger
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function info(string $message, array $context = []): void
    {
        $this->log('INFO', $message, $context);
    }

    public function error(string $message, array $context = []): void
    {
        $this->log('ERROR', $message, $context);
    }

    public function warning(string $message, array $context = []): void
    {
        $this->log('WARNING', $message, $context);
    }

    public function debug(string $message, array $context = []): void
    {
        if ($this->debugMode) {
            $this->log('DEBUG', $message, $context);
        }
    }

    private function log(string $level, string $message, array $context = []): void
    {
        $timestamp = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? ' ' . json_encode($context, JSON_UNESCAPED_UNICODE) : '';
        $logMessage = "[{$timestamp}] [{$level}] {$message}{$contextStr}" . PHP_EOL;

        $logFile = $this->logDir . '/app.log';
        file_put_contents($logFile, $logMessage, FILE_APPEND);

        if ($level === 'ERROR') {
            $errorLogFile = $this->logDir . '/error.log';
            file_put_contents($errorLogFile, $logMessage, FILE_APPEND);
        }

        error_log(trim($logMessage));
    }

    private function __clone() {}

    public function __wakeup()
    {
        throw new \Exception("Não é possível deserializar singleton");
    }
}
