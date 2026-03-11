<?php
/**
 * Configurações do banco de dados e aplicação - TCC
 *
 * Para produção, use variáveis de ambiente ou um arquivo .env
 * Nunca commite credenciais reais no repositório
 */

define('PAGE_TITULO', 'TCC');
define('COPYRIGHT', 'TCC©');
define('VERSION', '1.0.0');
define('NOME_APP', 'tcc');

define('SESSAO', 'TCC');
define('NAME_SESSION', 'tcc_web');

// Banco de dados - Desenvolvimento (WAMP/XAMPP padrão)
// Em produção, use getenv() ou variáveis de ambiente
define('DB_NAME', getenv('DB_NAME') ?: 'tcc_db');
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_CHARSET', 'utf8mb4');
