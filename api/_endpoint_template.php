<?php
/**
 * TEMPLATE DE ENDPOINT - Copie e renomeie para criar novas APIs
 * Padrão Nortrek - Siga este modelo para manter consistência
 *
 * Uso:
 * 1. Copie este arquivo e renomeie (ex: usuarios.php)
 * 2. Ajuste o método HTTP permitido
 * 3. Implemente a lógica no try/catch
 * 4. Use Request para entrada e Response para saída
 */
include_once __DIR__ . "/settings/includes.php";
include_once __DIR__ . "/cors.php";

header("Content-Type: application/json; charset=utf-8");
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Exemplo: permitir apenas GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    \Shared\Response::error('Método não permitido', 405)->send();
}

try {
    $request = new \Shared\Request();

    // Exemplo: parâmetros da query string
    // $id = $request->getQueryParam('id');

    // Exemplo: corpo JSON (POST/PUT)
    // $body = $request->getBody();
    // $nome = $request->getBodyParam('nome');

    // Exemplo: usar Database
    // $db = \Shared\Database::getInstance()->getConnection();
    // $stmt = $db->prepare('SELECT * FROM tabela WHERE id = :id');
    // $stmt->execute(['id' => $id]);
    // $result = $stmt->fetch(PDO::FETCH_ASSOC);

    // Exemplo: resposta de sucesso
    \Shared\Response::success([
        'message' => 'Endpoint funcionando',
    ])->send();
} catch (Exception $e) {
    \Shared\Logger::getInstance()->error('endpoint_template: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
    ]);
    \Shared\Response::error('Erro interno do servidor', 500)->send();
}
