# API NeXora - Backend PHP com SQLite

Estrutura base de backend em PHP usando SQLite como banco padrão local, com separação por camadas (Controller, Service, Repository) e scripts de migração/seed.

## Estrutura

```
api/
├── app/
│   ├── Controllers/
│   ├── Services/
│   ├── Repositories/
│   └── Validators/
├── database/
│   ├── data/                # Arquivo .sqlite (não versionado)
│   ├── migrations/          # SQL de estrutura
│   ├── seeders/             # SQL de dados iniciais
│   ├── migrate.php          # Runner de migrations
│   └── seed.php             # Runner de seed
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

Por padrão, o backend usa SQLite:

- `DB_DRIVER=sqlite`
- `SQLITE_PATH=api/database/data/nexora.sqlite`

Você pode trocar para MySQL alterando as variáveis de ambiente (`DB_DRIVER=mysql` e demais variáveis `DB_*`).

## Como iniciar a base de dados

Na raiz do projeto:

```bash
php api/database/migrate.php
php api/database/seed.php
```

Isso cria tabelas centrais:

- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `dashboards`
- `alerts`
- `audit_logs`

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
