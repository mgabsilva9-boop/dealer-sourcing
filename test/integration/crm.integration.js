/**
 * CRM Integration Tests
 * Testa CRUD completo de clientes (GET, POST, PATCH, DELETE)
 */

const assert = require('assert');
const http = require('http');

const API_BASE = process.env.API_URL || 'http://localhost:3000';

// Helper para fazer requisições
async function request(method, endpoint, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Helper para login
async function loginAndGetToken() {
  const loginRes = await request('POST', '/auth/login', {
    email: 'admin@threeon.com',
    password: 'threeon2026',
  });

  if (loginRes.status !== 200) {
    throw new Error(`Login failed: ${loginRes.status}`);
  }

  return loginRes.body.token;
}

// Tests
async function runTests() {
  console.log('🧪 CRM Integration Tests\n');

  let token;
  let customerId;
  let passed = 0;
  let failed = 0;

  try {
    // 1. Login
    console.log('1. Testing login...');
    token = await loginAndGetToken();
    assert(token, 'Token should be returned');
    console.log('✅ Login successful');
    passed++;
  } catch (err) {
    console.error('❌ Login failed:', err.message);
    failed++;
    process.exit(1);
  }

  // 2. GET /crm/list (empty or initial)
  try {
    console.log('\n2. Testing GET /crm/list...');
    const listRes = await request('GET', '/crm/list', null, token);
    assert(listRes.status === 200, `Expected 200, got ${listRes.status}`);
    assert(Array.isArray(listRes.body.customers), 'Should return customers array');
    console.log(`✅ GET /crm/list successful (${listRes.body.customers.length} customers)`);
    passed++;
  } catch (err) {
    console.error('❌ GET /crm/list failed:', err.message);
    failed++;
  }

  // 3. POST /crm/create
  try {
    console.log('\n3. Testing POST /crm/create...');
    const createRes = await request('POST', '/crm/create', {
      name: 'Test Customer CRUD',
      phone: '(11) 99999-9999',
      email: 'testcrm@example.com',
      cpf: '12345678901',
      vehicleBought: 'Ford Ka 2020',
      purchaseDate: '2026-04-08',
      purchaseValue: 68000,
      notes: 'Test customer for CRUD validation',
      style: 'Minimalista',
      region: 'Interior SP',
      collector: false,
      birthday: '1990-01-15',
      profession: 'Engineer',
      referral: 'Facebook',
      contactPref: 'WhatsApp',
    }, token);

    assert(createRes.status === 201, `Expected 201, got ${createRes.status}`);
    assert(createRes.body.customer, 'Should return customer object');
    assert(createRes.body.customer.id, 'Customer should have id');
    customerId = createRes.body.customer.id;
    console.log(`✅ POST /crm/create successful (ID: ${customerId})`);
    passed++;
  } catch (err) {
    console.error('❌ POST /crm/create failed:', err.message);
    failed++;
  }

  // 4. GET /crm/:id
  if (customerId) {
    try {
      console.log('\n4. Testing GET /crm/:id...');
      const getRes = await request('GET', `/crm/${customerId}`, null, token);
      assert(getRes.status === 200, `Expected 200, got ${getRes.status}`);
      assert(getRes.body.id === customerId, 'Should return correct customer');
      assert(getRes.body.name === 'Test Customer CRUD', 'Customer name should match');
      console.log('✅ GET /crm/:id successful');
      passed++;
    } catch (err) {
      console.error('❌ GET /crm/:id failed:', err.message);
      failed++;
    }
  }

  // 5. PUT /crm/:id (update)
  if (customerId) {
    try {
      console.log('\n5. Testing PUT /crm/:id (update)...');
      const updateRes = await request('PUT', `/crm/${customerId}`, {
        phone: '(11) 98888-8888',
        email: 'updated@example.com',
        notes: 'Updated notes via CRUD test',
      }, token);

      assert(updateRes.status === 200, `Expected 200, got ${updateRes.status}`);
      assert(updateRes.body.customer, 'Should return updated customer');
      assert(updateRes.body.customer.phone === '(11) 98888-8888', 'Phone should be updated');
      assert(updateRes.body.customer.email === 'updated@example.com', 'Email should be updated');
      console.log('✅ PUT /crm/:id successful');
      passed++;
    } catch (err) {
      console.error('❌ PUT /crm/:id failed:', err.message);
      failed++;
    }
  }

  // 6. Verify update persistence
  if (customerId) {
    try {
      console.log('\n6. Testing update persistence (GET after PUT)...');
      const getRes = await request('GET', `/crm/${customerId}`, null, token);
      assert(getRes.status === 200, `Expected 200, got ${getRes.status}`);
      assert(getRes.body.phone === '(11) 98888-8888', 'Updated phone should persist');
      assert(getRes.body.email === 'updated@example.com', 'Updated email should persist');
      console.log('✅ Update persistence verified');
      passed++;
    } catch (err) {
      console.error('❌ Update persistence check failed:', err.message);
      failed++;
    }
  }

  // 7. DELETE /crm/:id
  if (customerId) {
    try {
      console.log('\n7. Testing DELETE /crm/:id...');
      const deleteRes = await request('DELETE', `/crm/${customerId}`, null, token);
      assert(deleteRes.status === 200, `Expected 200, got ${deleteRes.status}`);
      console.log('✅ DELETE /crm/:id successful');
      passed++;
    } catch (err) {
      console.error('❌ DELETE /crm/:id failed:', err.message);
      failed++;
    }
  }

  // 8. Verify deletion (GET should return 404 or not find)
  if (customerId) {
    try {
      console.log('\n8. Testing deletion verification...');
      const getRes = await request('GET', `/crm/${customerId}`, null, token);
      assert(getRes.status === 404, `Expected 404 after delete, got ${getRes.status}`);
      console.log('✅ Deletion verified (customer not found)');
      passed++;
    } catch (err) {
      console.error('❌ Deletion verification failed:', err.message);
      failed++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
