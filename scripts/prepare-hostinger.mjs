import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const apiSrc = path.join(root, "api");
const apiDest = path.join(distDir, "api");

const excludedPaths = new Set([
  ".env",
  "tests",
  "database",
  "logs/erro_conexao.log",
  "settings/erro_conexao.log",
]);

function isExcluded(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  if (excludedPaths.has(normalized)) {
    return true;
  }

  return [...excludedPaths].some(
    (entry) => normalized.startsWith(`${entry}/`) || normalized === entry
  );
}

function copyDirectory(source, destination, relativeBase = "") {
  fs.mkdirSync(destination, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const relativePath = relativeBase ? `${relativeBase}/${entry.name}` : entry.name;
    if (isExcluded(relativePath)) {
      continue;
    }

    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(from, to, relativePath);
      continue;
    }

    fs.copyFileSync(from, to);
  }
}

if (!fs.existsSync(distDir)) {
  console.error("[ERRO] Pasta dist/ não encontrada. Execute: npm run build");
  process.exit(1);
}

if (!fs.existsSync(apiSrc)) {
  console.error("[ERRO] Pasta api/ não encontrada.");
  process.exit(1);
}

if (fs.existsSync(apiDest)) {
  fs.rmSync(apiDest, { recursive: true, force: true });
}

copyDirectory(apiSrc, apiDest);

const envExample = path.join(apiSrc, ".env.example");
if (fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, path.join(apiDest, ".env.example"));
}

const deployGuide = `NEXORA — PUBLICAR NA HOSTINGER
================================

ERRO COMUM (404 na API):
  A pasta public_html/api/ existe mas está VAZIA (só .htaccess).
  É preciso enviar TODOS os arquivos de dist/api/ para public_html/api/

ESTRUTURA CORRETA em public_html:
  public_html/
  ├── .htaccess
  ├── index.html
  ├── assets/
  └── api/
      ├── health.php          ← teste: /api/health.php deve retornar JSON
      ├── auth_login.php
      ├── app/
      ├── shared/
      ├── settings/
      └── .env                ← criar no servidor (copiar de .env.example)

PASSO A PASSO (Gerenciador de Arquivos):
  1. Apague o conteúdo antigo de public_html/api/ (se estiver vazio ou incompleto)
  2. Envie TODO o conteúdo da pasta local "dist/api/" para "public_html/api/"
     (não envie a pasta "dist" inteira para dentro do public_html)
  3. Envie index.html, assets/ e .htaccess da pasta "dist/" para a RAIZ de public_html/
  4. Crie public_html/api/.env com credenciais MySQL do painel Hostinger
  5. Teste: https://nexora.conectaxcon.com.br/api/health.php
     Deve aparecer JSON com "database": "connected"

NÃO faça:
  - public_html/dist/api/   (caminho errado — o site chama /api/, não /dist/api/)
  - Enviar só .htaccess dentro de api/
`;

fs.writeFileSync(path.join(distDir, "PUBLICAR-NA-HOSTINGER.txt"), deployGuide, "utf8");

console.log("[OK] dist/api/ pronto para publicação.");
console.log("[OK] Leia dist/PUBLICAR-NA-HOSTINGER.txt");
console.log("");
console.log("Teste após enviar: https://nexora.conectaxcon.com.br/api/health.php");
