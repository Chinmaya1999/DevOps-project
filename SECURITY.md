# Security

## Reporting a vulnerability
Email **contact@adihuman.com** with details and steps to reproduce. Please do not open a public issue.
We aim to acknowledge reports within 72 hours.

## What is protected, and how

| Asset | Protection |
|-------|-----------|
| Passwords | bcrypt (cost 12); 10+ chars with letters and numbers; common passwords rejected |
| Sessions | JWT pinned to HS256, 1-day expiry (`JWT_EXPIRES_IN`), invalidated on password change/reset |
| Login | 20 attempts / 15 min / IP, plus 5 failed attempts locks the account for 15 min; identical errors for unknown email and wrong password |
| Email OTP | CSPRNG 6-digit code, stored hashed, 5 attempts max, 10 attempts / 15 min / IP |
| Reset / verification tokens | Stored as SHA-256 hashes; 1-hour expiry; single use |
| SSH private keys (deployments) | AES-256-GCM encrypted at rest (`DATA_ENCRYPTION_KEY`), never returned by the API |
| Payment screenshots | Not publicly served; only the uploader or an admin can fetch them; random file names; file type verified by magic bytes |
| Real-time chat | Socket connections require a valid JWT; identity is taken from the token; membership checked per chat room |
| Database queries | `$`-operators and dotted keys stripped from all input; regex input escaped |
| Remote commands | Deployment `projectName` restricted to `[A-Za-z0-9_-]` |
| Transport / browser | HSTS, CSP (API: `default-src 'none'`; frontend: allow-list), X-Frame-Options DENY, nosniff, Permissions-Policy |
| Supply chain | CI runs tests, `npm audit` and Trivy; Dependabot enabled; actions pinned |
| Tools you paste into (secret scanner / troubleshooter) | Processed in memory only; never stored or logged |

## Operating it safely
1. Generate secrets: `openssl rand -hex 32` for both `JWT_SECRET` and `DATA_ENCRYPTION_KEY`. **Back up `DATA_ENCRYPTION_KEY`** — without it stored SSH keys cannot be decrypted.
2. Existing plaintext SSH keys: run `node backend/encryptExistingSecrets.js` once.
3. Rotate any credential that has ever been committed (see git history), including the admin password.
4. Put the API behind HTTPS only, set `TRUST_PROXY=1` behind nginx/ALB, and keep MongoDB off the public internet (bind to the private network, enable auth).
5. Turn on MFA for your GitHub, Docker Hub, AWS and domain registrar accounts.

## Known limitations / next hardening steps
- JWTs live in `localStorage` (XSS-exposed). Moving to an `HttpOnly; SameSite=Strict` cookie plus CSRF token is the next step.
- No MFA for end users yet (TOTP planned).
- No audit-log UI. Admin actions should be recorded to an append-only collection.
- No automated penetration test has been run; commission one before taking real payments at scale.
- No system is "unhackable"; this list is defence in depth, not a guarantee.
