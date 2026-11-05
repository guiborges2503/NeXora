// Utilitários dos testes de sistema/interface (Selenium) - Projeto P2 / TQS.
//
// Variáveis de ambiente:
//   UI_BASE_URL  front-end (padrão: http://127.0.0.1:5173)
//   UI_API_URL   API usada só para preparar e limpar dados (padrão: <UI_BASE_URL>/api)
//   UI_HEADLESS  "0" para ver o navegador abrindo (padrão: headless)
//   UI_BROWSER   chrome (padrão) | MicrosoftEdge | firefox
import fs from "node:fs";
import path from "node:path";
import { Builder, By, until, Key } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import edge from "selenium-webdriver/edge.js";
import firefox from "selenium-webdriver/firefox.js";

export { By, until, Key };

export const BASE_URL = (process.env.UI_BASE_URL || "http://127.0.0.1:5173").replace(/\/$/, "");
export const API_URL = (process.env.UI_API_URL || `${BASE_URL}/api`).replace(/\/$/, "");
export const TIMEOUT = 15000;

// Usuários fictícios criados por database/test/seed_test_data.sql
export const SENHA = "Teste@123";
export const USUARIOS = {
  admin: { email: "admin.teste@nexora.local", nome: "Admin Teste" },
  gestor: { email: "gestor.teste@nexora.local", nome: "Gestor Teste" },
  visualizador: { email: "visualizador.teste@nexora.local", nome: "Visualizador Teste" },
};

const RESULTS_DIR = path.resolve("tests/results/ui");

export async function criarDriver() {
  const headless = process.env.UI_HEADLESS !== "0";
  const browser = process.env.UI_BROWSER || "chrome";
  const args = ["--window-size=1440,900", "--lang=pt-BR"];
  if (headless) args.push("--headless=new");

  const builder = new Builder().forBrowser(browser);
  if (browser === "chrome") {
    const opts = new chrome.Options().addArguments(...args, "--no-sandbox", "--disable-dev-shm-usage");
    builder.setChromeOptions(opts);
  } else if (browser === "MicrosoftEdge") {
    builder.setEdgeOptions(new edge.Options().addArguments(...args));
  } else if (browser === "firefox") {
    const opts = new firefox.Options().addArguments("--width=1440", "--height=900");
    if (headless) opts.addArguments("-headless");
    builder.setFirefoxOptions(opts);
  }

  const driver = await builder.build();
  await driver.manage().setTimeouts({ implicit: 0, pageLoad: 30000 });
  return driver;
}

/** Salva captura de tela e URL atual (usado quando um teste falha). */
export async function salvarEvidencia(driver, nome) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const arquivo = nome.replace(/[^\w.-]+/g, "_").slice(0, 120);
  try {
    const png = await driver.takeScreenshot();
    fs.writeFileSync(path.join(RESULTS_DIR, `${arquivo}.png`), png, "base64");
    fs.writeFileSync(path.join(RESULTS_DIR, `${arquivo}.txt`), `URL: ${await driver.getCurrentUrl()}\n`);
  } catch (e) {
    console.error("Não foi possível salvar a evidência:", e.message);
  }
}

/** Espera um elemento visível e o devolve. */
export async function esperarVisivel(driver, locator, timeout = TIMEOUT) {
  const el = await driver.wait(until.elementLocated(locator), timeout, `Elemento não encontrado: ${locator}`);
  await driver.wait(until.elementIsVisible(el), timeout, `Elemento não ficou visível: ${locator}`);
  return el;
}

/** Localizador por texto visível exato (normalizando espaços). */
export function porTexto(texto, tag = "*") {
  return By.xpath(`//${tag}[normalize-space(.)=${xpathLiteral(texto)}]`);
}

/** Localizador por texto visível parcial. */
export function contendoTexto(texto, tag = "*") {
  return By.xpath(`//${tag}[contains(normalize-space(.), ${xpathLiteral(texto)})]`);
}

function xpathLiteral(s) {
  if (!s.includes("'")) return `'${s}'`;
  if (!s.includes('"')) return `"${s}"`;
  return `concat('${s.replace(/'/g, `', "'", '`)}')`;
}

/** Espera até que algum elemento com o texto exista na página. */
export async function esperarTexto(driver, texto, timeout = TIMEOUT) {
  return driver.wait(
    async () => (await driver.findElements(contendoTexto(texto))).length > 0,
    timeout,
    `Texto não apareceu na página: "${texto}"`
  );
}

/** Faz login pela interface e espera sair da tela de login. */
export async function login(driver, email, senha = SENHA) {
  await driver.get(`${BASE_URL}/auth/login`);
  await limparSessao(driver);
  await driver.get(`${BASE_URL}/auth/login`);
  const campoEmail = await esperarVisivel(driver, By.id("nx-email"));
  await campoEmail.clear();
  await campoEmail.sendKeys(email);
  const campoSenha = await esperarVisivel(driver, By.id("nx-password"));
  await campoSenha.clear();
  await campoSenha.sendKeys(senha);
  await driver.findElement(By.css("button[type='submit']")).click();
  await driver.wait(
    async () => !(await driver.getCurrentUrl()).includes("/auth/login"),
    TIMEOUT,
    "Login não redirecionou para fora da tela de login"
  );
}

export async function limparSessao(driver) {
  await driver.executeScript("try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}");
}

/**
 * Clica em um item de um Select (Radix): abre o gatilho e escolhe a opção pelo texto.
 * A opção pode ter uma descrição abaixo do rótulo (ex.: "Visualizador / Acesso somente
 * leitura"), por isso a comparação é pelo início do texto.
 */
export async function escolherOpcao(driver, gatilho, textoOpcao) {
  await gatilho.click();
  const opcao = await esperarVisivel(
    driver,
    By.xpath(`//*[@role='option'][starts-with(normalize-space(.), ${xpathLiteral(textoOpcao)})]`)
  );
  await opcao.click();
  await driver.wait(
    async () => (await driver.findElements(By.css("[role='option']"))).length === 0,
    TIMEOUT,
    "A lista de opções não fechou"
  );
}

/** Gatilho (combobox) de um Select identificado pelo texto do seu rótulo. */
export function selectPorRotulo(rotulo) {
  return By.xpath(`//label[normalize-space(.)=${xpathLiteral(rotulo)}]/following::*[@role='combobox'][1]`);
}

// ---------------------------------------------------------------------------
// Preparação e limpeza de dados pela API (não faz parte do fluxo verificado)
// ---------------------------------------------------------------------------
export async function apiToken(email, senha = SENHA) {
  const res = await fetch(`${API_URL}/auth_login.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: senha }),
  });
  const body = await res.json();
  if (!body?.data?.token) throw new Error(`Falha no login de preparação (${email}): ${body?.message}`);
  return body.data.token;
}

export async function api(metodo, rota, token, corpo) {
  const res = await fetch(`${API_URL}/${rota}`, {
    method: metodo,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const texto = await res.text();
  let body;
  try {
    body = JSON.parse(texto);
  } catch {
    body = { raw: texto };
  }
  return { status: res.status, body };
}
