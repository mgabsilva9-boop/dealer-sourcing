/**
 * Jest Configuration
 * Phase 4: Backend Integration Tests
 */

export default {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  transform: {},
  moduleNameMapper: {},
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/server.js', // Exclude main server entry for now
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
  testTimeout: 15000,
  verbose: true,
};
