# API NeXora - Backend PHP com MySQL

Backend em PHP com MySQL, separado por camadas (Controller, Service, Repository).

## Estrutura

```
database/
├── install_mysql.sql        # Cria todas as tabelas (importar no phpMyAdmin)
└── db_dialect.php           # Helpers SQL em runtime (relatórios IA)

api/
├── app/
│   ├── Controllers/
│   ├── Services/
│   ├── Repositories/
│   └── Validators/
├── settings/
├── shared/
├── logs/
├── auth_login.php
├── auth_register.php
├── users.php
├── app_info.php
├── health.php
└── _endpoint_template.php
```

## Banco de Dados

O schema MySQL já deve existir no servidor. Configure apenas `api/.env`:

```env
DB_DRIVER=mysql
DB_HOST=...
DB_NAME=...
DB_USER=...
DB_PASS=...
```

A API **não executa** esse script automaticamente — apenas conecta ao banco existente.

Para criar as tabelas, importe `database/install_mysql.sql` no phpMyAdmin.

## Endpoints disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/health.php` | `GET` | Health check da API e status da conexão |
| `/api/app_info.php` | `GET` | Informações básicas da aplicação |
| `/api/auth_register.php` | `POST` | Cadastro de usuário |
| `/api/auth_login.php` | `POST` | Login de usuário |
| `/api/users.php` | `GET` | Listagem de usuários |

## Payloads de exemplo

### `POST /api/auth_register.php`

```json
{
  "name": "Maria Silva",
  "email": "maria@empresa.com",
  "password": "123456"
}
```

### `POST /api/auth_login.php`

```json
{
  "email": "admin@nexora.local",
  "password": "admin123"
}
```

## Padrão de implementação

1. Endpoint (`api/*.php`) valida método HTTP e trata exceções.
2. Controller recebe `Request` e retorna `Response`.
3. Service aplica regras de negócio.
4. Repository acessa o banco via PDO.

Esse padrão facilita crescimento para módulos de permissões, dashboards, alertas e auditoria.
