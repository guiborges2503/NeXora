<?php
/**
 * Classe Request - Encapsula requisições HTTP
 * Padrão Nortrek
 */
namespace Shared;

class Request
{
    private array $body = [];
    private array $queryParams = [];
    private array $headers = [];
    private ?int $userId = null;

    public function __construct()
    {
        $this->parseBody();
        $this->parseQueryParams();
        $this->parseHeaders();
    }

    private function parseBody(): void
    {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? ($_SERVER['HTTP_CONTENT_TYPE'] ?? '');
        $input = file_get_contents('php://input');

        if (strpos($contentType, 'application/json') !== false) {
            $this->body = json_decode($input, true) ?? [];
            return;
        }

        if (is_string($input) && trim($input) !== '') {
            $decoded = json_decode($input, true);
            if (is_array($decoded)) {
                $this->body = $decoded;
                return;
            }
        }

        if (!empty($_POST)) {
            $this->body = $_POST;
        } else {
            $this->body = [];
        }
    }

    private function parseQueryParams(): void
    {
        $this->queryParams = $_GET;
    }

    private function parseHeaders(): void
    {
        if (function_exists('getallheaders')) {
            $this->headers = getallheaders() ?: [];
        } else {
            foreach ($_SERVER as $key => $value) {
                if (strpos($key, 'HTTP_') === 0) {
                    $header = str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($key, 5)))));
                    $this->headers[$header] = $value;
                }
            }
        }
    }

    public function getBody(): array
    {
        return $this->body;
    }

    public function getBodyParam(string $key, $default = null)
    {
        return $this->body[$key] ?? $default;
    }

    public function getQueryParams(): array
    {
        return $this->queryParams;
    }

    public function getQueryParam(string $key, $default = null)
    {
        return $this->queryParams[$key] ?? $default;
    }

    public function getMethod(): string
    {
        return $_SERVER['REQUEST_METHOD'] ?? 'GET';
    }

    public function getPath(): string
    {
        return parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?? '';
    }

    public function getHeaders(): array
    {
        return $this->headers;
    }

    public function getHeader(string $key, ?string $default = null): ?string
    {
        return $this->headers[$key] ?? $default;
    }

    public function getUserId(): ?int
    {
        return $this->userId;
    }

    public function isGet(): bool
    {
        return $this->getMethod() === 'GET';
    }

    public function isPost(): bool
    {
        return $this->getMethod() === 'POST';
    }

    public function isPut(): bool
    {
        return $this->getMethod() === 'PUT';
    }

    public function isDelete(): bool
    {
        return $this->getMethod() === 'DELETE';
    }
}
