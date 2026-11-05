// Testes de sistema/interface (Selenium WebDriver + Mocha) - Projeto P2 / TQS.
//
// Pré-requisitos: banco nexora_test recriado (scripts/reset-test-db.sh), API no ar
// e front-end em UI_BASE_URL (padrão http://127.0.0.1:5173). Veja o README, seção 10.
//
// Cada teste indica o ID da aba "Automacao" e o caso manual/requisito que representa.
import assert from "node:assert/strict";
import {
  BASE_URL, USUARIOS, TIMEOUT, By, Key, until,
  criarDriver, salvarEvidencia, esperarVisivel, esperarTexto, porTexto, contendoTexto,
  login, escolherOpcao, selectPorRotulo, apiToken, api,
} from "./helpers.js";

describe("NeXora - testes de sistema/interface (Selenium)", function () {
  this.timeout(90000);

  /** @type {import("selenium-webdriver").WebDriver} */
  let driver;
  let tokenAdmin;

  before(async function () {
    driver = await criarDriver();
    tokenAdmin = await apiToken(USUARIOS.admin.email);
  });

  afterEach(async function () {
    if (this.currentTest?.state === "failed" && driver) {
      await salvarEvidencia(driver, `FALHA_${this.currentTest.title}`);
    }
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  // -------------------------------------------------------------------------
  it("UI-01 (CT-001 / RF-01): login válido redireciona ao painel e mostra o nome do usuário", async function () {
    await login(driver, USUARIOS.gestor.email);

    await driver.wait(until.urlContains("/dashboards"), TIMEOUT, "Não redirecionou para /dashboards");
    await esperarTexto(driver, USUARIOS.gestor.nome);
    await esperarTexto(driver, "Gestor");

    const token = await driver.executeScript(
      "return Object.keys(localStorage).some(k => /token/i.test(k) && localStorage.getItem(k))"
    );
    assert.equal(token, true, "Token da sessão não foi salvo no navegador");

    await salvarEvidencia(driver, "UI-01_login_gestor_painel");
  });

  // -------------------------------------------------------------------------
  it("UI-02 (CT-006 / RF-02): administrador cadastra usuário e o encontra na lista", async function () {
    const email = `ui.selenium.${Date.now()}@nexora.local`;
    const nome = "Usuario Selenium Teste";

    await login(driver, USUARIOS.admin.email);
    await driver.get(`${BASE_URL}/users`);

    await (await esperarVisivel(driver, porTexto("Novo Usuário", "button"))).click();
    await esperarVisivel(driver, porTexto("Criar novo usuário"));

    await (await esperarVisivel(driver, By.css("input[placeholder='Nome completo']"))).sendKeys(nome);
    await (await esperarVisivel(driver, By.css("input[placeholder='E-mail']"))).sendKeys(email);
    await (await esperarVisivel(driver, By.id("user-password"))).sendKeys("Teste@123");
    await escolherOpcao(driver, await esperarVisivel(driver, By.id("user-role")), "Visualizador");

    await (await esperarVisivel(driver, porTexto("Criar Usuário", "button"))).click();

    // Modal fecha e o usuário aparece na lista com o perfil correto
    await driver.wait(
      async () => (await driver.findElements(porTexto("Criar novo usuário"))).length === 0,
      TIMEOUT,
      "O formulário não fechou após salvar"
    );
    const busca = await esperarVisivel(driver, By.css("input[placeholder='Buscar usuários...']"));
    await busca.sendKeys(email);
    await esperarTexto(driver, email);
    const linha = await driver.findElement(By.xpath(`//tr[.//*[contains(normalize-space(.), '${email}')]]`));
    const textoLinha = await linha.getText();
    assert.match(textoLinha, /Visualizador/, "Perfil Visualizador não aparece na linha do usuário");
    assert.match(textoLinha, new RegExp(nome), "Nome não aparece na linha do usuário");

    await salvarEvidencia(driver, "UI-02_usuario_cadastrado_na_lista");

    // Limpeza: remove o usuário criado
    const lista = await api("GET", "users.php", tokenAdmin);
    const criado = (lista.body.data || []).find((u) => u.email === email);
    if (criado) await api("DELETE", `users.php?id=${criado.id}`, tokenAdmin);
  });

  // -------------------------------------------------------------------------
  it("UI-03 (CT-010 / RF-03): Visualizador não vê o menu Configurações nem a criação de dashboard", async function () {
    await login(driver, USUARIOS.visualizador.email);
    await driver.wait(until.urlContains("/dashboards"), TIMEOUT);
    await esperarTexto(driver, USUARIOS.visualizador.nome);

    const configuracoes = await driver.findElements(porTexto("Configurações"));
    const novoDashboard = await driver.findElements(contendoTexto("Novo Dashboard", "button"));
    const novoDashboardLink = await driver.findElements(By.css("a[href='/dashboards/create']"));

    await salvarEvidencia(driver, "UI-03_menu_visualizador");

    assert.equal(configuracoes.length, 0, "O menu 'Configurações' está visível para o Visualizador");
    assert.equal(novoDashboard.length + novoDashboardLink.length, 0, "A opção 'Novo Dashboard' está visível para o Visualizador");
  });

  // -------------------------------------------------------------------------
  it("UI-04 (CT-014 / RF-04): Gestor cadastra dashboard e o encontra na lista", async function () {
    const nome = `Dashboard Selenium ${Date.now()}`;

    await login(driver, USUARIOS.gestor.email);
    await driver.get(`${BASE_URL}/dashboards/create`);

    await (await esperarVisivel(driver, By.id("dashboard-name"))).sendKeys(nome);
    await (await esperarVisivel(driver, By.id("url"))).sendKeys("https://app.powerbi.com/view?r=FICTICIO-SELENIUM");
    await escolherOpcao(driver, await esperarVisivel(driver, selectPorRotulo("Categoria")), "Comercial");
    await (await esperarVisivel(driver, porTexto("Criar Dashboard", "button"))).click();

    // Após salvar, o sistema abre a visualização do dashboard criado
    await driver.wait(until.urlMatches(/\/dashboards\/\d+$/), TIMEOUT, "Não abriu a tela do dashboard criado");
    const id = (await driver.getCurrentUrl()).match(/\/dashboards\/(\d+)$/)[1];
    // RF-04: o link de incorporação informado é exibido na plataforma
    const iframe = await esperarVisivel(driver, By.css("iframe[src*='FICTICIO-SELENIUM']"));
    assert.ok(iframe, "O relatório incorporado não foi exibido");

    await driver.get(`${BASE_URL}/dashboards`);
    await esperarTexto(driver, nome);
    await salvarEvidencia(driver, "UI-04_dashboard_na_lista");

    // Limpeza
    await api("DELETE", `dashboards.php?id=${id}`, tokenAdmin);
  });

  // -------------------------------------------------------------------------
  it("UI-05 (CT-022 / RF-06): pergunta ao assistente (IA simulada) é respondida e fica no histórico", async function () {
    const pergunta = "Quais produtos mais venderam?";
    const respostaSimulada = "Resposta simulada pelo teste: o produto mais vendido é o Plano Analytics Pro.";
    const tituloSimulado = "Teste Selenium Vendas";

    // Preparação: chave FICTÍCIA salva no servidor para habilitar o assistente
    const put = await api("PUT", "openrouter_settings.php", tokenAdmin, {
      api_key: "sk-or-ficticia-selenium",
      default_model: "openai/gpt-4o-mini",
    });
    assert.equal(put.status, 200, `Falha ao preparar a chave fictícia: ${JSON.stringify(put.body)}`);

    // Simula o OpenRouter no navegador: nenhuma chamada real é feita à IA
    if (typeof driver.sendDevToolsCommand !== "function") this.skip();
    await driver.sendDevToolsCommand("Page.addScriptToEvaluateOnNewDocument", {
      source: `
        (function () {
          const original = window.fetch.bind(window);
          window.__chamadasIA = 0;
          window.fetch = async function (input, init) {
            const url = typeof input === "string" ? input : input.url;
            if (url.startsWith("https://openrouter.ai/")) {
              window.__chamadasIA++;
              const corpo = JSON.parse((init && init.body) || "{}");
              const pedeTitulo = (corpo.messages || []).some(m => m.role === "system" && /Gere apenas um título/.test(m.content));
              const texto = pedeTitulo ? ${JSON.stringify(tituloSimulado)} : ${JSON.stringify(respostaSimulada)};
              return new Response(JSON.stringify({ choices: [{ message: { role: "assistant", content: texto } }] }),
                { status: 200, headers: { "Content-Type": "application/json" } });
            }
            return original(input, init);
          };
        })();`,
    });

    try {
      await login(driver, USUARIOS.gestor.email);
      await driver.get(`${BASE_URL}/ai-assistant`);

      const campo = await esperarVisivel(driver, By.css("input[placeholder='Digite sua pergunta...']"));
      await campo.sendKeys(pergunta, Key.ENTER);

      await esperarTexto(driver, respostaSimulada, 20000);
      const chamadas = await driver.executeScript("return window.__chamadasIA");
      assert.ok(chamadas >= 1, "O front-end não chamou a IA (simulada)");
      await salvarEvidencia(driver, "UI-05_resposta_assistente");

      // Recarrega a página: a conversa deve continuar listada em "Conversas Recentes"
      await driver.sleep(1500); // tempo para gravação assíncrona no servidor
      await driver.navigate().refresh();
      await esperarTexto(driver, "Conversas Recentes");
      await driver.wait(
        async () =>
          (await driver.findElements(contendoTexto(tituloSimulado))).length > 0 ||
          (await driver.findElements(contendoTexto(pergunta))).length > 0,
        TIMEOUT,
        "A conversa não aparece em 'Conversas Recentes' após recarregar"
      );

      const item = (await driver.findElements(contendoTexto(tituloSimulado, "button")))[0]
        ?? (await driver.findElements(contendoTexto(pergunta, "button")))[0];
      if (item) {
        await item.click();
        await esperarTexto(driver, respostaSimulada);
      }
      await salvarEvidencia(driver, "UI-05_historico_apos_recarregar");
    } finally {
      // Limpeza: remove a chave fictícia
      await api("DELETE", "openrouter_settings.php", tokenAdmin);
    }
  });
});
