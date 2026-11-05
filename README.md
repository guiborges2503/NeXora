# NeXora: Projeto P2 de Testes e Qualidade de Software

Plataforma web de Business Intelligence com suporte a IA, desenvolvida como TCC e usada
como sistema em teste no **Projeto Integrado P2** da disciplina *Testes e Qualidade de
Software* (UNISAGRADO, Ciência da Computação, 2026, Prof. Dr. Elvio Gilberto da Silva).

> Todo o trabalho de testes fica na branch **`p2-testes`**. Os testes rodam **somente** no
> banco local `nexora_test`, com dados fictícios. Nunca use o ambiente de produção.

---

## 1. Integrantes

| Nome | RA | Papel no projeto |
|---|---|---|
| _preencher_ | _preencher_ | Coordenação e planejamento |
| _preencher_ | _preencher_ | Análise e execução manual |
| _preencher_ | _preencher_ | Automação e qualidade |

Turma: _preencher_. Grupo: _preencher_.

## 2. Sistema e versão testada

- **Nome:** NeXora
- **Versão:** 1.0.0 (constante `VERSION` em `api/settings/settings.php`)
- **Commit testado:** informar o hash em cada execução (`git rev-parse --short HEAD`)

## 3. Repositório

- Código: <https://github.com/guiborges2503/NeXora>
- Branch do projeto de testes: `p2-testes`

## 4. Tecnologias

| Camada | Tecnologia |
|---|---|
| Front-end | React 18, TypeScript, Vite 6, Tailwind CSS 4 |
| Back-end | API em PHP (Controllers, Services, Repositories), PDO, JWT |
| Banco | MySQL (InnoDB) |
| IA | OpenRouter (modelo `openai/gpt-4o-mini`), simulado nos testes automatizados |
| Visualização | Power BI por link de incorporação (links fictícios nos testes) |
| Testes unitários | PHPUnit 10.5 |

## 5. Pré-requisitos

| Software | Versão usada | Observação |
|---|---|---|
| Windows + WAMP | WampServer 3 (Apache 2.4, MySQL 9.1) | Apache servindo `C:\wamp64\www\NeXora` |
| PHP | **8.2** (`C:\wamp64\bin\php\php8.2.26`) | O PHP 7.4 do PATH não roda o PHPUnit 10 |
| Composer | 2.x | |
| Node.js / npm | 22.x / 10.x | |
| Git + Git Bash | 2.x | Os scripts `.sh` rodam no Git Bash |
| Navegador | Chrome, Edge ou Firefox atualizado | |

## 6. Instalação

```bash
git clone https://github.com/guiborges2503/NeXora.git C:/wamp64/www/NeXora
cd C:/wamp64/www/NeXora
git checkout p2-testes
npm install
/c/wamp64/bin/php/php8.2.26/php.exe /c/ProgramData/ComposerSetup/bin/composer.phar install
```

## 7. Configuração

O código-fonte não contém nenhuma senha. A configuração vem de `api/.env`, que fica fora do git.

```bash
cp api/.env.testing.example api/.env
```

Esse arquivo aponta a API para o banco local `nexora_test` (veja a seção 8).

## 8. Banco e dados de teste

O script abaixo **apaga e recria** o banco `nexora_test` no MySQL local. Use-o antes de cada
ciclo de execução para restaurar o ambiente:

```bash
bash scripts/reset-test-db.sh
```

Ele executa, nesta ordem:

1. `database/test/00_create_database.sql`: recria o banco e o usuário local `nexora_test`
2. `database/install_mysql.sql`: cria as 22 tabelas
3. `database/scripts/seed_admin.sql`: perfis, permissões e administrador padrão
4. `database/test/seed_test_data.sql`: massa fictícia determinística

Massa esperada: **5 regiões, 5 produtos, 6 clientes, 600 vendas e 2 dashboards** (um para
todos os perfis e um só para Administrador). As 600 vendas permitem testar o limite de 500
linhas (CT-028).

## 9. Execução do sistema

1. Inicie o WampServer (ícone verde). A API fica em `http://127.0.0.1/NeXora/api`.
2. Confira a API e o banco:
   ```bash
   curl http://127.0.0.1/NeXora/api/health.php
   ```
   A resposta deve conter `"db_name":"nexora_test"` e `"schema":{"ok":true,...}`.
3. Inicie o front-end:
   ```bash
   npm run dev
   ```
4. Acesse `http://127.0.0.1:5173/auth/login`.

## 10. Execução dos testes

| Nível | Comando | Resultado |
|---|---|---|
| Unitário (PHPUnit) | `/c/wamp64/bin/php/php8.2.26/php.exe vendor/bin/phpunit --testdox` | `tests/results/phpunit-junit.xml` e `phpunit-testdox.txt` |
| Integração/API (Postman/Newman) | _a configurar_ | |
| Sistema/interface (Selenium) | _a configurar_ | |

Mapa dos testes unitários (veja a aba *Automacao* da planilha):

| ID | Arquivo | Requisito / caso |
|---|---|---|
| UT-01 a UT-05 | `tests/unit/SqlValidatorTest.php` | RF-08, CT-027, CT-028 |
| UT-06 | `tests/unit/SecretCipherTest.php` | RF-05, RNF-02, CT-021 |

## 11. Pipeline CI/CD

- **Ferramenta:** GitHub Actions. Arquivo: `.github/workflows/testes.yml`
- **Execuções:** <https://github.com/guiborges2503/NeXora/actions/workflows/testes.yml>
- **Gatilhos:** push nas branches `p2-testes` e `main`, abertura ou atualização de pull
  request para essas branches, e execução manual (*Run workflow*).
- **Etapas:**
  1. Obter o código e configurar o PHP 8.2
  2. `composer install`
  3. Subir um MySQL 8.4 temporário e rodar `scripts/reset-test-db.sh`
  4. Rodar o PHPUnit
  5. Verificar a API (`health.php` ligado ao `nexora_test`)
  6. Publicar o resumo na página da execução e os relatórios como artefato
     (`resultados-testes-N`)

O pipeline não usa nenhuma credencial real. O banco é criado e descartado a cada execução.

## 12. Localização dos documentos

Os documentos do projeto (plano, casos, execuções, defeitos, métricas, relatório) ficam na
pasta do Google Drive da disciplina, na estrutura `00_IDENTIFICACAO_E_README` a
`16_BACKUP_ENTREGA`. A planilha de controle é `P2_TQS_NeXora_Planejamento.xlsx`.

## 13. Credenciais fictícias de teste

Valem **somente** para o banco local `nexora_test`. Todas usam a senha `Teste@123`.

| E-mail | Perfil | Status |
|---|---|---|
| `admin.teste@nexora.local` | Administrador | Ativo |
| `gestor.teste@nexora.local` | Gestor | Ativo |
| `visualizador.teste@nexora.local` | Visualizador | Ativo |
| `inativo.teste@nexora.local` | Visualizador | **Inativo** |
| `admin@nexora.local` (senha `admin123`) | Administrador | Ativo (criado por `seed_admin.sql`) |

O usuário local do MySQL é `nexora_test` / `nexora_test_local`.

## 14. Problemas conhecidos

| Problema | Solução |
|---|---|
| `composer install` falha com *SSL certificate problem: self-signed certificate* (rede com inspeção de SSL) | Exportar os certificados raiz do Windows para um `.pem` e usar `COMPOSER_CAFILE=<arquivo>` mais `php -d openssl.cafile=<arquivo> -d curl.cainfo=<arquivo>` |
| PHPUnit reclama da versão do PHP | Use o PHP 8.2 do WAMP, não o 7.4 do PATH |
| `health.php` mostra `db_name` de produção | O arquivo `api/.env` não existe. Copie `api/.env.testing.example` (seção 7) |
| `Access denied for user 'nexora_test'` | Rode `bash scripts/reset-test-db.sh` de novo |

## 15. Contato do grupo

_preencher (e-mails institucionais dos integrantes)_
