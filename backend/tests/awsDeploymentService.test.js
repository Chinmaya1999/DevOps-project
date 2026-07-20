const test = require('node:test');
const assert = require('node:assert/strict');
const awsDeploymentService = require('../services/awsDeploymentService');

test('ubuntu install commands include docker.io and compose support', () => {
  const commands = awsDeploymentService.constructor.getDockerInstallCommands('ubuntu');
  assert.ok(commands.some((command) => command.includes('docker.io')));
  assert.ok(commands.some((command) => command.includes('docker-compose')));
});

test('amazon linux install commands include docker and compose binary', () => {
  const commands = awsDeploymentService.constructor.getDockerInstallCommands('amazon');
  assert.ok(commands.some((command) => command.includes('yum install -y docker')));
  assert.ok(commands.some((command) => command.includes('docker-compose')));
});

test('environment variables are parsed into docker compose entries', () => {
  const parsed = awsDeploymentService.constructor.parseEnvironmentVariables('API_URL=https://example.com\nNODE_ENV=production');
  assert.deepEqual(parsed, [
    { name: 'API_URL', value: 'https://example.com' },
    { name: 'NODE_ENV', value: 'production' }
  ]);
});

test('compose startup commands use docker compose syntax', () => {
  const commands = awsDeploymentService.constructor.getComposeStartCommands('InfraPilot', 'docker compose');
  assert.ok(commands.some((command) => command.includes('docker compose pull')));
  assert.ok(commands.some((command) => command.includes('docker compose up -d')));
});

test('placeholder image names fall back to a public image', () => {
  const normalized = awsDeploymentService.constructor.normalizeImage('my-html-site');
  assert.equal(normalized, 'nginx:latest');
});

test('docker hub username is prefixed for bare image names', () => {
  const normalized = awsDeploymentService.constructor.normalizeImage('my-html-site', 'nginx:latest', 'awsmallick1999');
  assert.equal(normalized, 'awsmallick1999/my-html-site:latest');
});

test('compose file content includes the requested image updates', () => {
  const content = awsDeploymentService.constructor.buildComposeFileContent('demo-app', 'awsmallick1999/my-html-site:latest', 'nginx:latest', 'both');
  assert.match(content, /image: awsmallick1999\/my-html-site:latest/);
  assert.match(content, /container_name: demo-app-frontend/);
  assert.match(content, /ports:\n\s*- "8080:80"/);
});
