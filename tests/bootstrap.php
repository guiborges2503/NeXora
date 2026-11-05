<?php

/**
 * Bootstrap dos testes automatizados (Projeto P2 / TQS).
 *
 * Os testes unitários não acessam banco, rede nem interface: carregam apenas
 * o autoload do Composer e definem as constantes que as classes precisam.
 */

require_once __DIR__ . '/../vendor/autoload.php';

if (!defined('JWT_SECRET')) {
    define('JWT_SECRET', 'nexora-test-secret-p2-tqs');
}
