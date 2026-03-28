/**
 * Load Test: Connection Pool Behavior
 * STORY-502: Pool Monitoring & Observability
 *
 * Testa comportamento do pool com 50 usuários simultâneos
 * Simula realistic request patterns do sourcing
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

const API_BASE = 'http://localhost:3000';
const NUM_USERS = 50;
const REQUESTS_PER_USER = 10;
const TIMEOUT_MS = 30000;

// Mock JWT tokens para 50 usuários diferentes
const generateTokens = () => {
  const tokens = [];
  for (let i = 0; i < NUM_USERS; i++) {
    // Simular token JWT válido (estrutura básica)
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWxvYWQtdGVzdC0ke2l9IiwiaWF0IjoxNzE0MzEyMzg4fQ.signature${i}`;
    tokens.push(token);
  }
  return tokens;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runLoadTest() {
  console.log('\n📊 Connection Pool Load Test');
  console.log('='.repeat(60));
  console.log(`Configuração:`);
  console.log(`  • Usuários simultâneos: ${NUM_USERS}`);
  console.log(`  • Requests por usuário: ${REQUESTS_PER_USER}`);
  console.log(`  • Total de requests: ${NUM_USERS * REQUESTS_PER_USER}`);
  console.log(`  • Timeout: ${TIMEOUT_MS}ms`);
  console.log('='.repeat(60));

  const tokens = generateTokens();
  const results = {
    success: 0,
    failure: 0,
    timeout: 0,
    responseTimes: [],
    statusCodes: {},
  };

  const startTime = performance.now();

  // Simular 50 usuários fazendo requests em paralelo
  const promises = [];

  for (let user = 0; user < NUM_USERS; user++) {
    const userPromise = (async () => {
      const userToken = tokens[user];

      for (let req = 0; req < REQUESTS_PER_USER; req++) {
        try {
          const reqStart = performance.now();

          // Simular request a /sourcing/search (principal endpoint)
          const response = await axios.get(
            `${API_BASE}/sourcing/search?make=Honda&limit=10`,
            {
              headers: {
                'Authorization': `Bearer ${userToken}`,
              },
              timeout: TIMEOUT_MS,
            }
          );

          const duration = performance.now() - reqStart;
          results.responseTimes.push(duration);
          results.statusCodes[response.status] = (results.statusCodes[response.status] || 0) + 1;
          results.success++;

          // Log a cada 50 requests
          if ((results.success + results.failure) % 50 === 0) {
            process.stdout.write('.');
          }
        } catch (error) {
          if (error.code === 'ECONNABORTED') {
            results.timeout++;
          } else {
            results.failure++;
            results.statusCodes[error.response?.status || 'ERROR'] = (results.statusCodes[error.response?.status || 'ERROR'] || 0) + 1;
          }

          process.stdout.write('x');
        }
      }
    })();

    promises.push(userPromise);
  }

  // Executar todos os usuários em paralelo
  await Promise.all(promises);

  const endTime = performance.now();
  const totalTime = (endTime - startTime) / 1000; // segundos

  // Calcular estatísticas
  const avgResponseTime = results.responseTimes.length > 0
    ? results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length
    : 0;
  const maxResponseTime = Math.max(...results.responseTimes);
  const minResponseTime = Math.min(...results.responseTimes);
  const p95ResponseTime = results.responseTimes.sort((a, b) => a - b)[Math.floor(results.responseTimes.length * 0.95)];

  // Relatório
  console.log('\n\n📈 Resultados de Carga\n');
  console.log(`Total de Requests: ${results.success + results.failure + results.timeout}`);
  console.log(`✅ Sucesso: ${results.success} (${((results.success / (results.success + results.failure + results.timeout)) * 100).toFixed(2)}%)`);
  console.log(`❌ Falhas: ${results.failure}`);
  console.log(`⏱️ Timeouts: ${results.timeout}`);
  console.log(`\n⏱️ Tempos de Resposta (ms):`);
  console.log(`   • Min: ${minResponseTime.toFixed(2)}ms`);
  console.log(`   • Média: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`   • P95: ${p95ResponseTime ? p95ResponseTime.toFixed(2) : 'N/A'}ms`);
  console.log(`   • Máx: ${maxResponseTime.toFixed(2)}ms`);
  console.log(`\n⚡ Throughput:`);
  console.log(`   • Tempo total: ${totalTime.toFixed(2)}s`);
  console.log(`   • Requests/segundo: ${((results.success / totalTime).toFixed(2))}`);

  // Status codes
  if (Object.keys(results.statusCodes).length > 0) {
    console.log(`\n📊 Status Codes:`);
    Object.entries(results.statusCodes).forEach(([code, count]) => {
      console.log(`   ${code}: ${count}`);
    });
  }

  // Recomendações
  console.log(`\n💡 Recomendações:`);
  if (results.success / (results.success + results.failure + results.timeout) >= 0.95) {
    console.log(`   ✅ Pool adequado para ${NUM_USERS} usuários simultâneos`);
  } else {
    console.log(`   ⚠️ Taxa de sucesso < 95%. Considere aumentar pool size.`);
  }

  if (avgResponseTime > 1000) {
    console.log(`   ⚠️ Tempo médio de resposta alto (>${1000}ms). Otimizar queries.`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

// Verificar se servidor está rodando
async function checkServer() {
  try {
    await axios.get(`${API_BASE}/health`);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🔍 Aguardando servidor...');
  let retries = 5;
  while (retries > 0) {
    if (await checkServer()) {
      console.log('✅ Servidor detectado. Iniciando load test...\n');
      await runLoadTest();
      process.exit(0);
    }
    retries--;
    console.log(`   Tentando novamente em 2s... (${retries} tentativas restantes)`);
    await sleep(2000);
  }

  console.error('❌ Servidor não respondendo. Certifique-se de que está rodando em http://localhost:3000');
  process.exit(1);
}

main().catch(err => {
  console.error('❌ Erro no load test:', err.message);
  process.exit(1);
});
