<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\SqlValidator;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\TestDox;
use PHPUnit\Framework\TestCase;
use RuntimeException;

/**
 * Testes unitários do validador de SQL gerado pela IA.
 *
 * Requisito: RF-08 — toda consulta gerada pela IA deve ser validada antes da
 * execução: somente SELECT, uma instrução, apenas tabelas de negócio
 * permitidas e no máximo 500 linhas.
 * Risco: R-03 — IA gerar consulta que altera ou apaga dados do banco.
 */
#[CoversClass(SqlValidator::class)]
final class SqlValidatorTest extends TestCase
{
    /** Tabelas de negócio liberadas para a IA (espelha BusinessSchemaService). */
    private const ALLOWED_TABLES = ['sales', 'products', 'customers', 'regions'];

    private SqlValidator $validator;

    protected function setUp(): void
    {
        $this->validator = new SqlValidator(self::ALLOWED_TABLES, 500);
    }

    /** @return array<string, array{string}> */
    public static function comandosDeAlteracao(): array
    {
        return [
            'INSERT' => ["INSERT INTO sales (quantity) VALUES (1)"],
            'UPDATE' => ["UPDATE products SET unit_price = 0 WHERE id = 1"],
            'DELETE' => ["DELETE FROM sales"],
            'DROP'   => ["DROP TABLE sales"],
            'TRUNCATE' => ["TRUNCATE TABLE sales"],
            'ALTER'  => ["ALTER TABLE sales ADD COLUMN x INT"],
        ];
    }

    // UT-01 — CT-027 / RF-08
    #[DataProvider('comandosDeAlteracao')]
    #[TestDox('UT-01: rejeita comando de alteração de dados ($sql)')]
    public function testRejeitaComandosDeAlteracao(string $sql): void
    {
        $this->expectException(RuntimeException::class);

        $this->validator->validateAndPrepare($sql);
    }

    // UT-01 (complemento) — palavra proibida dentro de um SELECT
    #[TestDox('UT-01: rejeita SELECT que contém palavra-chave proibida (DELETE em subconsulta)')]
    public function testRejeitaSelectComPalavraChaveProibida(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Palavra-chave SQL não permitida: DELETE');

        $this->validator->validateAndPrepare(
            "SELECT * FROM sales WHERE id IN (DELETE FROM sales)"
        );
    }

    // UT-02 — RF-08
    #[TestDox('UT-02: rejeita mais de uma instrução separada por ponto e vírgula')]
    public function testRejeitaMaisDeUmaInstrucao(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Apenas uma instrução SELECT é permitida');

        $this->validator->validateAndPrepare('SELECT * FROM sales; DROP TABLE users');
    }

    // UT-03 — RF-08 / R-03
    #[TestDox('UT-03: rejeita consulta a tabela fora da lista permitida (users)')]
    public function testRejeitaTabelaNaoPermitidaNoFrom(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Tabela não permitida: users');

        $this->validator->validateAndPrepare('SELECT email, password_hash FROM users');
    }

    // UT-03 (complemento) — tabela proibida em JOIN
    #[TestDox('UT-03: rejeita tabela fora da lista permitida usada em JOIN')]
    public function testRejeitaTabelaNaoPermitidaNoJoin(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Tabela não permitida: users');

        $this->validator->validateAndPrepare(
            'SELECT s.id FROM sales s JOIN users u ON u.id = s.customer_id'
        );
    }

    // UT-04 — CT-028 / RF-08
    #[TestDox('UT-04: acrescenta LIMIT 500 quando a consulta não informa limite')]
    public function testAcrescentaLimiteQuandoAusente(): void
    {
        $sql = $this->validator->validateAndPrepare('SELECT id, total_amount FROM sales');

        $this->assertStringEndsWith(' LIMIT 500', $sql);
    }

    // UT-04 (complemento) — limite dentro do permitido é mantido
    #[TestDox('UT-04: mantém o LIMIT informado quando está dentro do máximo (LIMIT 10)')]
    public function testMantemLimiteDentroDoMaximo(): void
    {
        $sql = $this->validator->validateAndPrepare('SELECT id FROM sales LIMIT 10');

        $this->assertSame('SELECT id FROM sales LIMIT 10', $sql);
    }

    // UT-05 — RF-08 (caminho válido)
    #[TestDox('UT-05: aceita SELECT válido sobre tabelas permitidas e normaliza espaços')]
    public function testAceitaSelectValido(): void
    {
        $sql = $this->validator->validateAndPrepare(
            "SELECT r.name, SUM(s.total_amount) AS total\n" .
            "  FROM sales s\n" .
            "  JOIN regions r ON r.id = s.region_id\n" .
            " GROUP BY r.name"
        );

        $this->assertSame(
            'SELECT r.name, SUM(s.total_amount) AS total FROM sales s JOIN regions r ON r.id = s.region_id GROUP BY r.name LIMIT 500',
            $sql
        );
    }

    // UT-05 (complemento) — valor limite: SQL vazio
    #[TestDox('UT-05: rejeita SQL vazio ou só com espaços')]
    public function testRejeitaSqlVazio(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('SQL vazio');

        $this->validator->validateAndPrepare('   ');
    }
}
