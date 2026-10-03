const test = require('node:test');
const assert = require('node:assert');
const BundleGenerator = require('../services/bundleGenerator');
const { generateBundleSchema } = require('../utils/validators');

const base = { appName: 'my-app', runtime: 'node', dockerHubUser: 'bob' };

test('bundle validation applies defaults', () => {
  const { error, value } = generateBundleSchema.validate(base);
  assert.ifError(error);
  assert.strictEqual(value.port, 3000);
  assert.strictEqual(value.replicas, 2);
});

test('bundle validation rejects path traversal and shell metacharacters in appName', () => {
  for (const appName of ['../etc', 'a;rm -rf /', 'My App', '$(whoami)', 'a']) {
    assert.ok(generateBundleSchema.validate({ ...base, appName }).error, `should reject ${appName}`);
  }
});

test('bundle validation rejects unknown runtimes', () => {
  assert.ok(generateBundleSchema.validate({ ...base, runtime: 'cobol' }).error);
});

test('every runtime produces the six expected files', () => {
  for (const runtime of BundleGenerator.RUNTIMES) {
    const { value } = generateBundleSchema.validate({ ...base, runtime });
    const paths = BundleGenerator.generate(value).map((f) => f.path).sort();
    assert.deepStrictEqual(paths, [
      '.dockerignore', '.github/workflows/ci-cd.yml', 'Dockerfile', 'README.md', 'docker-compose.yml', 'k8s/app.yaml',
    ]);
  }
});

test('generated images run as non-root and kubernetes spec is hardened', () => {
  const { value } = generateBundleSchema.validate(base);
  const files = Object.fromEntries(BundleGenerator.generate(value).map((f) => [f.path, f.content]));
  assert.match(files['Dockerfile'], /USER node/);
  assert.match(files['k8s/app.yaml'], /runAsNonRoot: true/);
  assert.match(files['k8s/app.yaml'], /readinessProbe/);
  assert.match(files['.github/workflows/ci-cd.yml'], /trivy-action/);
});
