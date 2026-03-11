<?php
/**
 * Classe Response - Padroniza respostas HTTP
 * Padrão Nortrek - Todas as APIs devem usar esta classe
 */
namespace Shared;

class Response
{
    private bool $success;
    /** @var mixed */
    private $data;
    private ?string $message;
    private int $statusCode;
    private array $errors;

    /**
     * @param mixed $data
     */
    public function __construct(
        bool $success = true,
        $data = null,
        ?string $message = null,
        int $statusCode = 200,
        array $errors = []
    ) {
        $this->success = $success;
        $this->data = $data;
        $this->message = $message;
        $this->statusCode = $statusCode;
        $this->errors = $errors;
    }

    /** @param mixed $data */
    public static function success($data = null, int $statusCode = 200, ?string $message = null): self
    {
        return new self(true, $data, $message, $statusCode);
    }

    public static function error(string $message, int $statusCode = 400, array $errors = []): self
    {
        return new self(false, null, $message, $statusCode, $errors);
    }

    public static function validationError(array $errors, ?string $message = 'Erros de validação'): self
    {
        return new self(false, null, $message, 422, $errors);
    }

    public static function notFound(?string $message = 'Recurso não encontrado'): self
    {
        return new self(false, null, $message, 404);
    }

    public static function unauthorized(?string $message = 'Não autorizado'): self
    {
        return new self(false, null, $message, 401);
    }

    public static function forbidden(?string $message = 'Acesso negado'): self
    {
        return new self(false, null, $message, 403);
    }

    public function send(): void
    {
        while (ob_get_level() > 0) {
            @ob_end_clean();
        }

        if (function_exists('setCorsHeaders')) {
            setCorsHeaders();
        } else {
            $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
            if (!empty($origin) && (strpos($origin, 'localhost') !== false || strpos($origin, '127.0.0.1') !== false)) {
                header("Access-Control-Allow-Origin: $origin");
            } else {
                header("Access-Control-Allow-Origin: http://localhost:5173");
            }
            header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, PATCH, DELETE");
            header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
            header("Access-Control-Allow-Credentials: true");
        }

        http_response_code($this->statusCode);
        header('Content-Type: application/json; charset=utf-8');

        $response = ['success' => $this->success];
        if ($this->message !== null) {
            $response['message'] = $this->message;
        }
        if ($this->data !== null) {
            $response['data'] = $this->data;
        }
        if (!empty($this->errors)) {
            $response['errors'] = $this->errors;
        }

        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public function toArray(): array
    {
        $response = ['success' => $this->success];
        if ($this->message !== null) {
            $response['message'] = $this->message;
        }
        if ($this->data !== null) {
            $response['data'] = $this->data;
        }
        if (!empty($this->errors)) {
            $response['errors'] = $this->errors;
        }
        return $response;
    }

    public function isSuccess(): bool
    {
        return $this->success;
    }

    /** @return mixed */
    public function getData()
    {
        return $this->data;
    }

    public function getMessage(): ?string
    {
        return $this->message;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}
