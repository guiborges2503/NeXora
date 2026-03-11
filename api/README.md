# API TCC - Base Nortrek

Estrutura da API seguindo o padrão do projeto Nortrek para manter consistência.

## Estrutura de Pastas

```
api/
├── settings/           # Configurações
│   ├── app_config.php  # CORS, ambiente, URLs
│   ├── settings.php    # Banco de dados, constantes
│   └── includes.php    # Carregamento centralizado
├── shared/             # Classes base (padrão Nortrek)
│   ├── Database.php   # Singleton PDO
│   ├── Request.php    # Encapsula requisição HTTP
│   ├── Response.php   # Padroniza respostas JSON
│   ├── Logger.php     # Sistema de logs
│   └── autoload.php   # Autoload Shared
├── helpers/            # Funções auxiliares
├── logs/               # Logs da aplicação
├── cors.php            # Configuração CORS
├── app_info.php        # GET - Informações da aplicação
├── health.php          # GET - Health check
└── _endpoint_template.php  # Template para novos endpoints
```

## Padrão de Endpoint

Todo endpoint deve seguir esta estrutura:

```php
<?php
include_once __DIR__ . "/settings/includes.php";
include_once __DIR__ . "/cors.php";

header("Content-Type: application/json; charset=utf-8");
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {  // Ajustar método
    \Shared\Response::error('Método não permitido', 405)->send();
}

try {
    $request = new \Shared\Request();
    // ... lógica ...
    \Shared\Response::success($data)->send();
} catch (Exception $e) {
    \Shared\Logger::getInstance()->error('endpoint: ' . $e->getMessage());
    \Shared\Response::error('Erro interno', 500)->send();
}
```

## Classes Shared

### Response
- `Response::success($data, $statusCode, $message)` - Resposta de sucesso
- `Response::error($message, $statusCode, $errors)` - Resposta de erro
- `Response::validationError($errors, $message)` - Erro 422
- `Response::notFound($message)` - Erro 404
- `Response::unauthorized($message)` - Erro 401
- `Response::forbidden($message)` - Erro 403
- `->send()` - Envia JSON e encerra

### Request
- `getBody()` - Corpo da requisição (JSON ou POST)
- `getBodyParam($key, $default)` - Parâmetro do corpo
- `getQueryParam($key, $default)` - Query string
- `getMethod()` - GET, POST, etc.
- `getHeader($key)` - Header HTTP

### Database
- `Database::getInstance()->getConnection()` - Retorna PDO

### Logger
- `Logger::getInstance()->info($msg, $context)`
- `Logger::getInstance()->error($msg, $context)`
- `Logger::getInstance()->warning($msg, $context)`
- `Logger::getInstance()->debug($msg, $context)`

## Configuração

### Banco de dados (`settings/settings.php`)
- Use variáveis de ambiente em produção: `DB_NAME`, `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_PORT`
- Desenvolvimento: padrão root/sem senha em localhost

### CORS (`settings/app_config.php`)
- `CORS_ALLOWED_ORIGINS` - Origens permitidas
- `FRONTEND_BASE_URL` - URL do frontend

## Endpoints Base

| Endpoint      | Método | Descrição                    |
|---------------|--------|------------------------------|
| `/api/app_info.php` | GET  | Versão e informações da API   |
| `/api/health.php`   | GET  | Status da API e conexão DB   |

## Criar Novo Endpoint

1. Copie `_endpoint_template.php`
2. Renomeie (ex: `usuarios.php`)
3. Ajuste método HTTP e lógica
4. Acesse via `http://localhost/TCC/api/usuarios.php`
