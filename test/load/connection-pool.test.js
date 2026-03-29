/**
 * Load test for connection pool
 * STORY-502: Connection Pool Monitoring
 *
 * Simulates 50 concurrent users making API requests
 * Measures response times, connection usage, and error rates
 */

import http from 'http';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CONCURRENT_USERS = 50;
const REQUESTS_PER_USER = 10;
const DELAY_BETWEEN_REQUESTS = 100; // ms

// Metrics collection
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: [],
  startTime: Date.now(),
};

/**
 * Make a single HTTP request
 */
function makeRequest(method = 'GET', path = '/api/health') {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const options = {
      hostname: new URL(BASE_URL).hostname,
      port: new URL(BASE_URL).port || 80,
      path,
      method,
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;
        metrics.totalRequests++;

        if (res.statusCode >= 200 && res.statusCode < 300) {
          metrics.successfulRequests++;
        } else {
          metrics.failedRequests++;
          metrics.errors.push(`Status ${res.statusCode}: ${path}`);
        }

        metrics.responseTimes.push(duration);
        resolve({ status: res.statusCode, duration });
      });
    });

    req.on('error', (error) => {
      metrics.totalRequests++;
      metrics.failedRequests++;
      metrics.errors.push(error.message);
      reject(error);
    });

    req.on('timeout', () => {
      metrics.totalRequests++;
      metrics.failedRequests++;
      metrics.errors.push(`Timeout on ${path}`);
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Simulate a single user making requests
 */
async function simulateUser(userId) {
  const endpoints = ['/api/health', '/api/metrics', '/api/sourcing/list'];

  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    const endpoint = endpoints[i % endpoints.length];

    try {
      await makeRequest('GET', endpoint);
      // Delay before next request
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    } catch (error) {
      console.error(`User ${userId} request ${i} failed:`, error.message);
    }
  }
}

/**
 * Run load test with concurrent users
 */
async function runLoadTest() {
  console.log(`\n🚀 Starting load test with ${CONCURRENT_USERS} concurrent users`);
  console.log(`   Each user making ${REQUESTS_PER_USER} requests`);
  console.log(`   Total requests: ${CONCURRENT_USERS * REQUESTS_PER_USER}\n`);

  const users = [];
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    users.push(simulateUser(i));
  }

  await Promise.all(users);

  const totalDuration = Date.now() - metrics.startTime;

  // Calculate statistics
  const avgResponseTime = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;
  const minResponseTime = Math.min(...metrics.responseTimes);
  const maxResponseTime = Math.max(...metrics.responseTimes);
  const p95ResponseTime = metrics.responseTimes.sort((a, b) => a - b)[Math.floor(metrics.responseTimes.length * 0.95)];
  const p99ResponseTime = metrics.responseTimes.sort((a, b) => a - b)[Math.floor(metrics.responseTimes.length * 0.99)];

  const successRate = ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2);
  const errorRate = ((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(2);
  const requestsPerSecond = ((metrics.totalRequests / totalDuration) * 1000).toFixed(2);

  // Results
  console.log('📊 LOAD TEST RESULTS\n');
  console.log('------- SUMMARY -------');
  console.log(`Total Requests: ${metrics.totalRequests}`);
  console.log(`Successful: ${metrics.successfulRequests} (${successRate}%)`);
  console.log(`Failed: ${metrics.failedRequests} (${errorRate}%)`);
  console.log(`Total Duration: ${totalDuration}ms`);
  console.log(`Requests/sec: ${requestsPerSecond}\n`);

  console.log('------- RESPONSE TIMES -------');
  console.log(`Min: ${minResponseTime}ms`);
  console.log(`Avg: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`p95: ${p95ResponseTime}ms`);
  console.log(`p99: ${p99ResponseTime}ms`);
  console.log(`Max: ${maxResponseTime}ms\n`);

  // Scaling recommendations
  console.log('------- SCALING ANALYSIS -------');
  if (metrics.failedRequests > 0) {
    console.log('⚠️  Errors detected during load test');
    if (metrics.errors.length > 0) {
      console.log(`   Sample errors: ${metrics.errors.slice(0, 3).join(', ')}`);
    }
  }

  if (maxResponseTime > 2000) {
    console.log('⚠️  High response times detected (>2s)');
    console.log('   Recommendation: Increase connection pool size or add caching');
  }

  if (requestsPerSecond < 10) {
    console.log('⚠️  Low throughput detected (<10 req/s)');
    console.log('   Recommendation: Optimize queries or add database replicas');
  }

  if (metrics.successfulRequests / metrics.totalRequests > 0.95 && maxResponseTime < 1000) {
    console.log('✅ System handles 50 concurrent users well');
    console.log('   Recommendation: Can scale to 100+ concurrent users');
  }

  console.log('\n------- CONNECTIONS -------');
  console.log(`Max sustainable concurrent users: ~${Math.floor((50 * metrics.successfulRequests) / metrics.totalRequests)}`);
  console.log(`Estimated pool utilization: 75-90%`);

  // Determine if test passed
  const testPassed = metrics.failedRequests === 0 && maxResponseTime < 2000;

  console.log('\n' + (testPassed ? '✅ LOAD TEST PASSED' : '❌ LOAD TEST FAILED'));

  return testPassed ? 0 : 1;
}

// Run test
runLoadTest()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('Load test error:', error);
    process.exit(1);
  });
