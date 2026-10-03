# Security

## Reporting a vulnerability
Email **contact@adihuman.com** with details and steps to reproduce. Please do not open a public issue.
We aim to acknowledge reports within 72 hours.

## What is protected, and how

| Asset | Protection |
|-------|-----------|
| Passwords | bcrypt (cost 12); 10+ chars with letters and numbers; common passwords rejected |
| Sessions | JWT in an **HttpOnly, SameSite=Lax, Secure** cookie (scripts can never read it); pinned HS256; 1-day expiry (`JWT_EXPIRES_IN`); invalidated on password change/reset; logout clears it |
| CSRF | State-changing cookie-authenticated requests must carry `X-CSRF-Token` = HMAC(session); verified in constant time; CORS limited to our origins |
| Two-factor (TOTP) | RFC 6238 (checked against the official test vectors); secrets encrypted at rest; 8 single-use hashed recovery codes; replay of a used code rejected; 5 wrong codes lock the account; the login challenge is signed with a separate key and can never act as a session; disabling needs password + a code |
| Browser storage | No session token in localStorage. GitHub / Docker Hub tokens and SSH keys typed into the app are kept in per-tab sessionStorage only, and sent in headers (never URLs) |
| WebSocket chat | Authenticated by the session cookie; `Origin` header checked (blocks cross-site WebSocket hijacking); per-room membership enforced |
| Login | 20 attempts / 15 min / IP, plus 5 failed attempts locks the account for 15 min; identical errors for unknown email and wrong password |
| Email OTP | CSPRNG 6-digit code, stored hashed, 5 attempts max, 10 attempts / 15 min / IP |
| Reset / verification tokens | Stored as SHA-256 hashes; 1-hour expiry; single use |
| SSH private keys (deployments) | AES-256-GCM encrypted at rest (`DATA_ENCRYPTION_KEY`), never returned by the API |
| Online payments (Cashfree) | Amount decided on the server; payment state is always re-fetched from Cashfree (never trusted from the browser or a webhook body); webhook HMAC-SHA256 signature verified over the raw body; activation is atomic and idempotent; amount mismatch is rejected; per-user checkout rate limit |
| Plan access | One source of truth (`services/plans.js`); expiry evaluated on every request; Pro routes return `403 UPGRADE_REQUIRED` |
| Admin area | One gate on every admin route (valid session AND role = admin), re-checked on every request, so a demoted or disabled admin loses access immediately. The UI hides the section from non-admins and redirects them, but the server is what enforces it. Safety rules: nobody can demote, disable or delete themselves or the last active admin. Every admin action is written to an append-only audit log (who, what, which target, from which IP) that cannot be edited or deleted from the app. Destructive actions need the target's email typed to confirm. Deleting a user also removes their personal data (configs, deployments with stored server keys, chats, posts); payment records are kept |
| Email credentials | Read only from environment variables (`EMAIL_USER`, `EMAIL_PASSWORD`); nothing is hard-coded. Contact-form text is HTML-escaped before it goes into an email |
| Billing | Invoices are numbered sequentially and readable only by the owner or an admin; history never exposes screenshots, admin identities or gateway ids; refunds are admin-executed through Cashfree, atomic (cannot run twice) and take the purchased period back exactly once |
| Payment screenshots (legacy manual payments) | Not publicly served; only the uploader or an admin can fetch them; random file names; file type verified by magic bytes |
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
- 2FA is optional per user. Consider requiring it for admin accounts.
- No WebAuthn / passkeys yet.
- No audit-log UI. Admin actions should be recorded to an append-only collection.
- No automated penetration test has been run; commission one before taking real payments at scale.
- No system is "unhackable"; this list is defence in depth, not a guarantee.

## Deploying the cookie-session change
- Frontend (`cmcloud.online`) and API (`api.cmcloud.online`) share a registrable domain, so the cookie is first-party for both.
- Everyone is signed out once after this release (old localStorage tokens are no longer used).
- For local development against a local API: `frontend/.env.development` → `VITE_API_URL=http://localhost:5001/api` and `COOKIE_SECURE=false` in `backend/.env`.
