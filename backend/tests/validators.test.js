const test = require('node:test');
const assert = require('node:assert');

// projectName flows into remote `rm -rf ~/<projectName>` commands, so it must never allow traversal.
test('deployment projectName pattern blocks traversal and injection', () => {
  const src = require('fs').readFileSync(require.resolve('../controllers/deploymentController.js'), 'utf8');
  assert.match(src, /projectName: Joi\.string\(\)\.pattern\(/);
  const re = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,62}$/;
  for (const bad of ['..', '../x', 'a b', 'a;ls', '$(id)', '', '-rf']) assert.ok(!re.test(bad), bad);
  for (const ok of ['my-app', 'app_1', 'A']) assert.ok(re.test(ok), ok);
});
