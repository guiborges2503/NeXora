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
    /** @var string[] */
    private array $sensitiveKeys = [
        'password',
        'current_password',
        'new_password',
        'token',
        'authorization',
        'email',
    ];

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
        $safeContext = $this->sanitizeContext($context);
        $contextStr = !empty($safeContext) ? ' ' . json_encode($safeContext, JSON_UNESCAPED_UNICODE) : '';
        $logMessage = "[{$timestamp}] [{$level}] {$message}{$contextStr}" . PHP_EOL;

        $logFile = $this->logDir . '/app.log';
        file_put_contents($logFile, $logMessage, FILE_APPEND);

        if ($level === 'ERROR') {
            $errorLogFile = $this->logDir . '/error.log';
            file_put_contents($errorLogFile, $logMessage, FILE_APPEND);
        }

        error_log(trim($logMessage));
    }

    private function sanitizeContext(array $context): array
    {
        $sanitized = [];
        foreach ($context as $key => $value) {
            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeContext($value);
                continue;
            }

            if ($this->isSensitiveKey((string) $key)) {
                $sanitized[$key] = '[REDACTED]';
                continue;
            }

            $sanitized[$key] = $value;
        }

        return $sanitized;
    }

    private function isSensitiveKey(string $key): bool
    {
        return in_array(strtolower($key), $this->sensitiveKeys, true);
    }

    private function __clone() {}

    public function __wakeup()
    {
        throw new \Exception("Não é possível deserializar singleton");
    }
}
