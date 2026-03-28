/**
 * Production Smoke Tests
 * Validates all 5 endpoints work in production
 */

const API_BASE_URL = process.env.API_BASE_URL || 'https://dealer-sourcing-api.onrender.com';

async function makeRequest(method, path) {
  const url = new URL(path, API_BASE_URL);
  const response = await fetch(url.toString(), { method });
  const data = await response.json().catch(() => null);
  return { status: response.status, body: data };
}

async function runTests() {
  console.log(`\n🧪 Production Smoke Tests - ${API_BASE_URL}\n`);
  
  const tests = [
    { name: 'Health endpoint', url: '/health', status: 200 },
    { name: 'GET /sourcing/list', url: '/sourcing/list?limit=5', status: 200 },
    { name: 'GET /sourcing/search', url: '/sourcing/search?make=Honda', status: 200 },
    { name: 'GET /sourcing/1', url: '/sourcing/1', status: 200 },
  ];

  let passed = 0, failed = 0;

  for (const test of tests) {
    try {
      const res = await makeRequest('GET', test.url);
      if (res.status === test.status) {
        console.log(`✅ ${test.name}`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - Expected ${test.status}, got ${res.status}`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ ${test.name} - ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
