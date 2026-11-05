-- =============================================================================
-- NeXora — banco LOCAL de testes (Projeto P2 / Testes e Qualidade de Software)
--
-- Executado com usuário administrador do MySQL (root do WAMP ou do CI).
-- Recria o banco do zero: NUNCA aponte este script para o banco de produção.
--
-- Credenciais abaixo são FICTÍCIAS e valem apenas para o MySQL local/CI.
-- =============================================================================

DROP DATABASE IF EXISTS nexora_test;
CREATE DATABASE nexora_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'nexora_test'@'localhost' IDENTIFIED BY 'nexora_test_local';
CREATE USER IF NOT EXISTS 'nexora_test'@'127.0.0.1' IDENTIFIED BY 'nexora_test_local';
CREATE USER IF NOT EXISTS 'nexora_test'@'%' IDENTIFIED BY 'nexora_test_local';
GRANT ALL PRIVILEGES ON nexora_test.* TO 'nexora_test'@'localhost';
GRANT ALL PRIVILEGES ON nexora_test.* TO 'nexora_test'@'127.0.0.1';
GRANT ALL PRIVILEGES ON nexora_test.* TO 'nexora_test'@'%';
FLUSH PRIVILEGES;
