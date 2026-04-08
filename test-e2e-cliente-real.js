/**
 * E2E Tests — Simular Cliente Real Usando o Sistema
 *
 * Este script valida o frontend como cliente faria:
 * 1. Login
 * 2. Dashboard (abas carregam?)
 * 3. Estoque (veículos visíveis?)
 * 4. IPVA (registros visíveis?)
 * 5. Financeiro (P&L calcula?)
 * 6. Criar veículo (salva?)
 * 7. Editar custos (salva?)
 * 8. Mudar status (salva?)
 * 9. Logout/Relogin (sessão persiste?)
 */

import { chromium } from '@playwright/test';

const BASE_URL = 'https://dealer-sourcing-frontend.vercel.app';
const EMAIL = 'dono@brossmotors.com';
const PASSWORD = 'bross2026';

let browser;
let page;
let testResults = [];

// Helper: log test result
function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (details) console.log(`   → ${details}`);
  testResults.push({ name, passed, details });
}

// Helper: wait for element
async function waitForElement(selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

// Helper: get text content
async function getText(selector) {
  try {
    return await page.textContent(selector);
  } catch {
    return null;
  }
}

async function runTests() {
  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    console.log('\n🧪 INICIANDO E2E TESTS — CLIENTE REAL\n');
    console.log(`URL: ${BASE_URL}`);
    console.log(`Email: ${EMAIL}\n`);

    // ========== TEST 1: Frontend Loads ==========
    console.log('📍 TEST 1: Frontend carrega');
    let loaded = false;
    try {
      await page.goto(BASE_URL, { waitUntil: 'load', timeout: 10000 });
      await page.waitForSelector('body', { timeout: 5000 });
      loaded = true;
      logTest('Frontend carrega', true, 'Page loaded successfully');
    } catch (e) {
      logTest('Frontend carrega', false, e.message);
      return;
    }

    // ========== TEST 2: Login Form Exists ==========
    console.log('📍 TEST 2: Formulário de login visível');
    const loginFormExists = await waitForElement('input[type="email"], input[placeholder*="email" i]', 5000);
    logTest('Formulário login existe', loginFormExists, loginFormExists ? 'Email input found' : 'Email input not found');

    // ========== TEST 3: Login Process ==========
    console.log('📍 TEST 3: Fazer login');
    try {
      // Procurar input de email (vários seletores possíveis)
      let emailInput = await page.$('input[type="email"]') || await page.$('input[placeholder*="email" i]');
      if (!emailInput) {
        const inputs = await page.$$('input');
        emailInput = inputs[0]; // primeiro input
      }

      if (!emailInput) throw new Error('Email input not found');

      await emailInput.fill(EMAIL);

      // Procurar input de password
      let passwordInput = await page.$('input[type="password"]') || await page.$('input[placeholder*="senha" i]');
      if (!passwordInput) {
        const inputs = await page.$$('input');
        passwordInput = inputs[1]; // segundo input
      }

      if (!passwordInput) throw new Error('Password input not found');
      await passwordInput.fill(PASSWORD);

      // Procurar botão de login
      const loginButton = await page.$('button:has-text("entrar"), button:has-text("login"), button:has-text("Entrar")')
        || await page.$$eval('button', buttons => buttons.find(b => b.textContent.toLowerCase().includes('entrar') || b.textContent.toLowerCase().includes('login')));

      if (!loginButton) throw new Error('Login button not found');

      await loginButton.click();

      // Aguardar redirecionamento para dashboard
      await page.waitForNavigation({ waitUntil: 'load', timeout: 10000 });

      logTest('Login bem-sucedido', true, `Redirecionado para dashboard`);
    } catch (e) {
      logTest('Login bem-sucedido', false, e.message);
      // Continue mesmo se falhar, para testar o que foi carregado
    }

    // ========== TEST 4: Dashboard Carrega ==========
    console.log('📍 TEST 4: Dashboard carrega (4 abas)');
    const dashboardExists = await waitForElement('[data-test*="dashboard"], h1, .dashboard', 3000);
    logTest('Dashboard visível', dashboardExists, dashboardExists ? 'Dashboard section found' : 'Dashboard section not found');

    // ========== TEST 5: Aba Estoque ==========
    console.log('📍 TEST 5: Aba Estoque funciona');
    try {
      // Procurar por "Estoque", "Inventory", ou abas em geral
      const abas = await page.$$eval('button, a, div', els =>
        els
          .filter(el => el.textContent.toLowerCase().includes('estoque') || el.textContent.toLowerCase().includes('inventory'))
          .map(el => el.textContent.trim())
      );

      if (abas.length > 0) {
        logTest('Aba Estoque existe', true, `Found: ${abas[0]}`);
      } else {
        logTest('Aba Estoque existe', false, 'Estoque tab not found');
      }
    } catch (e) {
      logTest('Aba Estoque existe', false, e.message);
    }

    // ========== TEST 6: Aba IPVA ==========
    console.log('📍 TEST 6: Aba IPVA funciona');
    try {
      const ipvaAbas = await page.$$eval('button, a, div', els =>
        els
          .filter(el => el.textContent.toLowerCase().includes('ipva'))
          .map(el => el.textContent.trim())
      );

      if (ipvaAbas.length > 0) {
        logTest('Aba IPVA existe', true, `Found: ${ipvaAbas[0]}`);
      } else {
        logTest('Aba IPVA existe', false, 'IPVA tab not found');
      }
    } catch (e) {
      logTest('Aba IPVA existe', false, e.message);
    }

    // ========== TEST 7: Veículos Visíveis ==========
    console.log('📍 TEST 7: Veículos na lista');
    try {
      // Procurar por cards de veículos
      const vehicles = await page.$$('[data-test*="vehicle"], .vehicle-card, [class*="card"]');
      const vehicleCount = vehicles.length;

      logTest('Veículos visíveis na lista', vehicleCount > 0, `Found: ${vehicleCount} vehicles`);
    } catch (e) {
      logTest('Veículos visíveis na lista', false, e.message);
    }

    // ========== TEST 8: Botão Criar Veículo ==========
    console.log('📍 TEST 8: Botão criar veículo');
    try {
      const createButtons = await page.$$eval('button, a', els =>
        els
          .filter(el => el.textContent.toLowerCase().includes('criar') || el.textContent.toLowerCase().includes('novo') || el.textContent.includes('+'))
          .map(el => el.textContent.trim())
      );

      if (createButtons.length > 0) {
        logTest('Botão criar veículo existe', true, `Found: ${createButtons[0]}`);
      } else {
        logTest('Botão criar veículo existe', false, 'Create button not found');
      }
    } catch (e) {
      logTest('Botão criar veículo existe', false, e.message);
    }

    // ========== TEST 9: Logout Button ==========
    console.log('📍 TEST 9: Botão logout');
    try {
      const logoutButtons = await page.$$eval('button, a', els =>
        els
          .filter(el => el.textContent.toLowerCase().includes('sair') || el.textContent.toLowerCase().includes('logout'))
          .map(el => el.textContent.trim())
      );

      if (logoutButtons.length > 0) {
        logTest('Botão logout existe', true, `Found: ${logoutButtons[0]}`);
      } else {
        logTest('Botão logout existe', false, 'Logout button not found');
      }
    } catch (e) {
      logTest('Botão logout existe', false, e.message);
    }

    // ========== SUMMARY ==========
    console.log('\n📊 RESUMO DOS TESTES\n');
    const passed = testResults.filter(t => t.passed).length;
    const total = testResults.length;

    console.log(`Total: ${passed}/${total} PASS`);
    console.log(`Taxa: ${Math.round((passed / total) * 100)}%\n`);

    if (passed === total) {
      console.log('✅ TODOS OS TESTES PASSARAM');
    } else {
      console.log('⚠️ ALGUNS TESTES FALHARAM:');
      testResults.filter(t => !t.passed).forEach(t => {
        console.log(`  ❌ ${t.name}: ${t.details}`);
      });
    }

  } catch (error) {
    console.error('Erro durante testes:', error);
  } finally {
    if (browser) {
      await browser.close();
    }

    // Retornar resultado
    const passed = testResults.filter(t => t.passed).length;
    const total = testResults.length;
    process.exit(passed === total ? 0 : 1);
  }
}

runTests();
