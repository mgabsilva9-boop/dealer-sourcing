/**
 * Production Readiness Tests
 */

describe('Production Readiness', () => {
  test('should have required backend dependencies', () => {
    const pkg = require('../../package.json');

    // Backend dependencies
    expect(pkg.dependencies.express).toBeDefined();
    expect(pkg.dependencies.pg).toBeDefined();
    expect(pkg.dependencies.jsonwebtoken).toBeDefined();
    expect(pkg.dependencies.bcryptjs).toBeDefined();
    expect(pkg.dependencies.cors).toBeDefined();

    // Frontend dependencies
    expect(pkg.dependencies.react).toBeDefined();
    expect(pkg.dependencies['react-dom']).toBeDefined();
    expect(pkg.dependencies.axios).toBeDefined();
  });

  test('should have required dev dependencies', () => {
    const pkg = require('../../package.json');

    expect(pkg.devDependencies.vite).toBeDefined();
    expect(pkg.devDependencies['@vitejs/plugin-react']).toBeDefined();
    expect(pkg.devDependencies.jest).toBeDefined();
    expect(pkg.devDependencies.eslint).toBeDefined();
  });

  test('should have correct scripts defined', () => {
    const pkg = require('../../package.json');

    expect(pkg.scripts.start).toBe('node src/server.js');
    expect(pkg.scripts.build).toBeDefined();
    expect(pkg.scripts.dev).toBeDefined();
    expect(pkg.scripts.lint).toBeDefined();
    expect(pkg.scripts.test).toBeDefined();
  });

  test('should be ES module project', () => {
    const pkg = require('../../package.json');
    expect(pkg.type).toBe('module');
  });
});
