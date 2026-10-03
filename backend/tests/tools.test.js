const test = require('node:test');
const assert = require('node:assert');
const SecretScanner = require('../services/secretScanner');
const Troubleshooter = require('../services/troubleshooter');

test('scanner finds common credentials and never returns the full secret', () => {
  const awsKey = 'AKIA' + 'IOSFODNN7EXAMPLE';
  const text = [
    'version: 3',
    `AWS_ACCESS_KEY_ID=${awsKey}`,
    '-----BEGIN RSA PRIVATE KEY-----',
    'mongo: mongodb://admin:Sup3rSecretPw@db.example.com:27017/app',
    'password: "hunter2hunter2"',
    'ghp_' + 'a'.repeat(36),
  ].join('\n');
  const r = SecretScanner.scan(text);
  const ids = r.findings.map((f) => f.rule);
  for (const id of ['aws-access-key', 'private-key', 'db-uri-creds', 'hardcoded-password', 'github-token']) assert.ok(ids.includes(id), id);
  assert.strictEqual(r.findings.find((f) => f.rule === 'aws-access-key').line, 2);
  assert.ok(!JSON.stringify(r).includes(awsKey), 'full key must be redacted');
  assert.ok(!JSON.stringify(r).includes('Sup3rSecretPw'));
  assert.strictEqual(r.findings[0].severity, 'critical');
});

test('scanner ignores placeholders and clean text', () => {
  assert.ok(SecretScanner.scan('password: "changeme"\ntoken: "${TOKEN}"\nimage: nginx').clean);
});

test('scanner rejects oversize input and finishes fast on adversarial input', () => {
  assert.throws(() => SecretScanner.scan('a'.repeat(300000)));
  const t = Date.now();
  SecretScanner.scan('password' + ' = '.repeat(20000) + '"' + 'a'.repeat(50000));
  assert.ok(Date.now() - t < 1000, 'possible ReDoS');
});

test('troubleshooter diagnoses real-world errors', () => {
  const cases = {
    'k8s-crashloop': 'my-pod-abc   0/1   CrashLoopBackOff   5',
    'k8s-imagepull': 'Back-off pulling image: ImagePullBackOff',
    'k8s-oom': 'Last State: Terminated Reason: OOMKilled Exit Code: 137',
    'tf-lock': 'Error: Error acquiring the state lock',
    'docker-sock': 'Got permission denied while trying to connect to the Docker daemon socket',
    'nginx-502': '502 Bad Gateway',
    'ssh-denied': 'user@host: Permission denied (publickey).',
    'aws-denied': 'User: arn:aws:iam::1:user/x is not authorized to perform: s3:GetObject',
  };
  for (const [id, log] of Object.entries(cases)) {
    assert.ok(Troubleshooter.diagnose(log).matches.some((m) => m.id === id), id);
  }
  assert.strictEqual(Troubleshooter.diagnose('everything is fine').matched, 0);
  assert.throws(() => Troubleshooter.diagnose('   '));
  assert.ok(Troubleshooter.RULE_COUNT >= 25);
});

test('guided catalog covers every rule exactly once and each solution resolves', () => {
  const catalog = Troubleshooter.catalog();
  const ids = catalog.flatMap((a) => a.issues.map((i) => i.id));
  assert.strictEqual(ids.length, Troubleshooter.RULE_COUNT);
  assert.strictEqual(new Set(ids).size, ids.length, 'duplicate rule ids');
  for (const id of ids) {
    const sol = Troubleshooter.byId(id);
    assert.ok(sol && sol.cause && sol.steps.length >= 2, id);
  }
  assert.strictEqual(Troubleshooter.byId('nope'), null);
});
