/**
 * Detects credentials pasted into configs/code. Findings only ever contain a redacted preview —
 * the scanned text is never stored or logged.
 */
const RULES = [
  { id: 'aws-access-key', name: 'AWS access key ID', severity: 'critical', re: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g, fix: 'Deactivate the key in IAM now, create a new one, and use IAM roles / OIDC instead of static keys.' },
  { id: 'aws-secret-key', name: 'AWS secret access key', severity: 'critical', re: /aws_?secret_?access_?key["'\s:=]+([A-Za-z0-9/+=]{40})\b/gi, group: 1, fix: 'Rotate the key in IAM immediately.' },
  { id: 'private-key', name: 'Private key', severity: 'critical', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY(?: BLOCK)?-----/g, fix: 'Remove it, generate a new key pair, and store keys in a secrets manager.' },
  { id: 'github-token', name: 'GitHub token', severity: 'critical', re: /\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})\b/g, fix: 'Revoke it at github.com/settings/tokens and use GITHUB_TOKEN / fine-grained tokens.' },
  { id: 'dockerhub-pat', name: 'Docker Hub access token', severity: 'high', re: /\bdckr_pat_[A-Za-z0-9_-]{20,}\b/g, fix: 'Revoke it in Docker Hub → Account settings → Security.' },
  { id: 'slack-token', name: 'Slack token', severity: 'high', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, fix: 'Revoke the token in the Slack app settings.' },
  { id: 'stripe-live', name: 'Stripe live secret key', severity: 'critical', re: /\b(sk|rk)_live_[A-Za-z0-9]{20,}\b/g, fix: 'Roll the key in the Stripe dashboard.' },
  { id: 'google-api-key', name: 'Google API key', severity: 'high', re: /\bAIza[0-9A-Za-z_-]{35}\b/g, fix: 'Restrict or regenerate the key in Google Cloud Console.' },
  { id: 'sendgrid', name: 'SendGrid API key', severity: 'high', re: /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/g, fix: 'Delete the key in SendGrid and create a new one.' },
  { id: 'db-uri-creds', name: 'Database URI with embedded password', severity: 'high', re: /\b(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis|amqp):\/\/[^\s:/@]+:([^\s@/]{3,})@/gi, group: 1, fix: 'Move the connection string to an environment variable / secret and rotate the password.' },
  { id: 'jwt', name: 'JSON Web Token', severity: 'medium', re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, fix: 'If it is a live session/API token, revoke it.' },
  { id: 'hardcoded-password', name: 'Hard-coded password / secret', severity: 'medium', re: /\b(?:password|passwd|pwd|secret|api[_-]?key|token)\b["']?\s*[:=]\s*["']([^"'\s$<{][^"'\s]{5,})["']/gi, group: 1, fix: 'Use environment variables, CI secrets, or a secrets manager. Never commit the value.' },
];

const MAX_LENGTH = 200000;
const PLACEHOLDER = /^(?:x+|\*+|changeme|change-me|your[_-].*|example.*|<.*>|\$\{.*\}|dummy|test|password|secret|todo)$/i;

function redact(value) {
  const v = String(value);
  if (v.length <= 8) return '*'.repeat(v.length);
  return `${v.slice(0, 4)}${'*'.repeat(Math.min(v.length - 6, 12))}${v.slice(-2)}`;
}

class SecretScanner {
  static scan(text) {
    if (typeof text !== 'string') throw new Error('text must be a string');
    if (text.length > MAX_LENGTH) throw new Error(`Input too large (max ${MAX_LENGTH / 1000} KB)`);

    const lineStarts = [0];
    for (let i = 0; i < text.length; i++) if (text[i] === '\n') lineStarts.push(i + 1);
    const lineOf = (idx) => {
      let lo = 0, hi = lineStarts.length - 1;
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= idx) lo = mid; else hi = mid - 1; }
      return lo + 1;
    };

    const findings = [];
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(text)) !== null) {
        const secret = rule.group ? m[rule.group] : m[0];
        if (rule.group === 1 && PLACEHOLDER.test(secret)) continue;
        // avoid double-reporting a value already caught by a more specific rule
        if (rule.id === 'hardcoded-password' && findings.some((f) => f.line === lineOf(m.index))) continue;
        findings.push({ rule: rule.id, name: rule.name, severity: rule.severity, line: lineOf(m.index), preview: redact(secret), fix: rule.fix });
        if (findings.length >= 200) break;
      }
    }
    const order = { critical: 0, high: 1, medium: 2 };
    findings.sort((a, b) => order[a.severity] - order[b.severity] || a.line - b.line);
    return {
      clean: findings.length === 0,
      counts: findings.reduce((c, f) => ((c[f.severity] = (c[f.severity] || 0) + 1), c), {}),
      findings,
    };
  }
}

module.exports = SecretScanner;
