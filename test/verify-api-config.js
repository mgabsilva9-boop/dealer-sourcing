#!/usr/bin/env node
/**
 * Teste de Verificação - Configuração de API
 * Valida se a variável VITE_API_URL está corretamente configurada
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  VERIFICAÇÃO: Configuração da API Frontend');
console.log('═══════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

// 1. Verificar api.js usa import.meta.env
console.log('1. Verificando src/frontend/api.js...');
const apiPath = path.join(projectRoot, 'src/frontend/api.js');
const apiContent = fs.readFileSync(apiPath, 'utf-8');

if (apiContent.includes('import.meta.env.VITE_API_URL')) {
  console.log('   ✅ PASS: Usa import.meta.env (correto)\n');
  passed++;
} else if (apiContent.includes('process.env.VITE_API_URL')) {
  console.log('   ❌ FAIL: Ainda usa process.env (errado)\n');
  failed++;
} else {
  console.log('   ⚠️  WARNING: VITE_API_URL não encontrado\n');
  failed++;
}

// 2. Verificar .env.production tem VITE_API_URL
console.log('2. Verificando .env.production...');
const envProdPath = path.join(projectRoot, '.env.production');
const envProdContent = fs.readFileSync(envProdPath, 'utf-8');

if (envProdContent.includes('VITE_API_URL=')) {
  const match = envProdContent.match(/VITE_API_URL=(.+)/);
  const url = match ? match[1].trim() : 'undefined';
  console.log(`   ✅ PASS: VITE_API_URL definido`);
  console.log(`   Value: ${url}\n`);
  passed++;
} else {
  console.log('   ❌ FAIL: VITE_API_URL não encontrado\n');
  failed++;
}

// 3. Verificar .env.development tem VITE_API_URL
console.log('3. Verificando .env.development...');
const envDevPath = path.join(projectRoot, '.env.development');
if (fs.existsSync(envDevPath)) {
  const envDevContent = fs.readFileSync(envDevPath, 'utf-8');
  if (envDevContent.includes('VITE_API_URL=')) {
    const match = envDevContent.match(/VITE_API_URL=(.+)/);
    const url = match ? match[1].trim() : 'undefined';
    console.log(`   ✅ PASS: VITE_API_URL definido`);
    console.log(`   Value: ${url}\n`);
    passed++;
  } else {
    console.log('   ⚠️  WARNING: VITE_API_URL não encontrado (apenas .production será usado)\n');
  }
} else {
  console.log('   ⓘ  INFO: .env.development não existe (ok)\n');
}

// 4. Verificar vite.config.js
console.log('4. Verificando vite.config.js...');
const viteConfigPath = path.join(projectRoot, 'vite.config.js');
const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf-8');

if (viteConfigContent.includes('VITE_API_URL')) {
  console.log('   ✅ PASS: vite.config.js referencia VITE_API_URL\n');
  passed++;
} else {
  console.log('   ⚠️  WARNING: vite.config.js não referencia VITE_API_URL\n');
}

// Resumo
console.log('═══════════════════════════════════════════════════════════');
console.log(`  Resultados: ${passed} PASS | ${failed} FAIL`);
console.log('═══════════════════════════════════════════════════════════\n');

if (failed === 0) {
  console.log('✅ Todas as verificações passaram!\n');
  process.exit(0);
} else {
  console.log('❌ Algumas verificações falharam. Veja acima.\n');
  process.exit(1);
}
