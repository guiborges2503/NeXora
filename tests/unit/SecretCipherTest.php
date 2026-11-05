<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Support\SecretCipher;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\TestDox;
use PHPUnit\Framework\TestCase;

/**
 * Testes unitários da cifragem de credenciais das fontes de dados.
 *
 * Requisitos: RF-05 (credenciais armazenadas cifradas) e RNF-02 (segredos não
 * ficam em texto puro). Caso manual relacionado: CT-021. Risco: R-07.
 */
#[CoversClass(SecretCipher::class)]
final class SecretCipherTest extends TestCase
{
    private const SENHA_FICTICIA = 'SenhaFicticia#2026';

    // UT-06 — CT-021 / RF-05
    #[TestDox('UT-06: cifra a senha com o prefixo enc:v1: e sem o valor em texto puro')]
    public function testCifraComPrefixoESemTextoPuro(): void
    {
        $cifrado = SecretCipher::encrypt(self::SENHA_FICTICIA);

        $this->assertStringStartsWith('enc:v1:', $cifrado);
        $this->assertStringNotContainsString(self::SENHA_FICTICIA, $cifrado);
    }

    #[TestDox('UT-06: decifra para o valor original')]
    public function testDecifraParaValorOriginal(): void
    {
        $cifrado = SecretCipher::encrypt(self::SENHA_FICTICIA);

        $this->assertSame(self::SENHA_FICTICIA, SecretCipher::decrypt($cifrado));
    }

    #[TestDox('UT-06: duas cifragens da mesma senha geram valores diferentes (IV aleatório)')]
    public function testCifragensDiferentesParaMesmaSenha(): void
    {
        $this->assertNotSame(
            SecretCipher::encrypt(self::SENHA_FICTICIA),
            SecretCipher::encrypt(self::SENHA_FICTICIA)
        );
    }

    #[TestDox('UT-06: valor vazio continua vazio ao cifrar e decifrar')]
    public function testValorVazio(): void
    {
        $this->assertSame('', SecretCipher::encrypt('   '));
        $this->assertSame('', SecretCipher::decrypt(''));
    }

    #[TestDox('UT-06: conteúdo cifrado adulterado não revela a senha')]
    public function testConteudoAdulteradoNaoRevelaSenha(): void
    {
        $this->assertSame('', SecretCipher::decrypt('enc:v1:@@@nao-e-base64@@@'));
    }

    #[TestDox('UT-06: máscara exibe só o início e o fim da chave')]
    public function testMascaraOcultaMeioDaChave(): void
    {
        $mascarado = SecretCipher::mask('sk-or-v1-abcdef123456');

        $this->assertStringStartsWith('sk-o', $mascarado);
        $this->assertStringEndsWith('56', $mascarado);
        $this->assertStringNotContainsString('abcdef1234', $mascarado);
    }
}
