# AutoDevOps (InfraPilot)

A DevOps learning platform and toolbox.

- **Learn:** a 12-stage roadmap from zero to DevOps engineer and 9 step-by-step deployment guides (static site, Node.js, MERN, domain + HTTPS, CI/CD) with tested starter projects. Guides are Markdown files in `frontend/src/content/learn/guides/`; starters are in `backend/starters/`.
- **Generate and check:** 8 generators (Dockerfile, Kubernetes, Terraform, Jenkins, GitHub Actions, Ansible, Bash, Python), a validator and a secret scanner.
- **Fix:** a Help desk and an error troubleshooter (29 common production errors).
- **Ship (Pro):** a full-stack ZIP bundle, AWS one-click deployment and AWS cost analysis.
- Community chat and blogs, an admin panel, and Cashfree billing.

**Stack:** React 18 + Vite + Tailwind + Three.js (frontend) · Node/Express + MongoDB + Socket.io (backend)

## Quick start

```bash
# 1. Backend
cd backend
cp .env.example .env        # REQUIRED: JWT_SECRET and DATA_ENCRYPTION_KEY (openssl rand -hex 32)
npm ci && npm run dev       # http://localhost:5001  (health: /health)

# 2. Frontend
cd frontend
npm ci --legacy-peer-deps
npm run dev                 # http://localhost:3000

# Everything in containers
cp backend/.env.example .env && docker compose up -d
```

Run the backend tests with `cd backend && npm test`.

## Layout

| Path | What lives there |
|------|------------------|
| `frontend/src/pages` | One folder per page (lazy-loaded in `App.tsx`) |
| `frontend/src/components/Three` | 3D hero scene (loaded only on the landing page) |
| `frontend/src/components/Motion` | Scroll-reveal, count-up and terminal animations (respect reduced motion) |
| `backend/services` | One generator per tool; `bundleGenerator.js` builds the ZIP bundle |
| `k8s/` | Manifests to run the platform itself on Kubernetes |
| `.github/workflows` | CI (tests, audit) → build images → deploy |

## Landing page media

Drop an optional looping `hero.mp4` (≤ 8 s, < 4 MB) and `hero-poster.jpg` in `frontend/public/media/`.
The page works without them.

## Payments (Cashfree)

Plans/prices live in `backend/services/plans.js` (Free: 10 generations/month; Pro: unlimited + bundle, deployments, cost analysis, Vision).

**Local development — use Cashfree sandbox (test mode).** Live keys only work from a domain you have whitelisted; `localhost` can never be whitelisted (Cashfree shows "Broken Link").
1. Cashfree dashboard → switch to **Test mode** → Developers → API Keys → create test keys.
2. In `backend/.env`:
   ```
   CASHFREE_ENV=sandbox
   CASHFREE_SANDBOX_APP_ID=...
   CASHFREE_SANDBOX_SECRET_KEY=...
   FRONTEND_URL=http://localhost:3000     # where Cashfree sends the customer back
   ```
3. `cd backend && node scripts/checkCashfree.js` should print `OK`. Pay with Cashfree's sandbox test cards/UPI (see their docs). No webhook is needed locally: the return page confirms the payment with Cashfree itself.

**Production**
1. Keep the live keys in `CASHFREE_APP_ID` / `CASHFREE_SECRET_KEY` with `CASHFREE_ENV=production`, `FRONTEND_URL=https://cmcloud.online`, `API_PUBLIC_URL=https://api.cmcloud.online`.
2. In the Cashfree merchant dashboard → Developers → **Whitelisting**: request approval for `https://cmcloud.online` (and `www.` if used) and whitelist your server's IP.
3. Test with one real small payment, then refund it from Admin → Payment Verification.

## Accounts, billing and security features

- Cookie sessions + CSRF protection, optional two-factor login (Security page), password reset, email OTP verification.
- Billing page: payment history, printable invoices (`INVOICE_*` env vars fill in your business details), refund requests (`REFUND_WINDOW_DAYS`).
- Admins refund online payments from *Admin → Payment Verification*.

## More docs

- [SECURITY.md](SECURITY.md) — what is protected and how, setup checklist, known gaps
- [docs/STRATEGY.md](docs/STRATEGY.md) — feature audit, pricing ideas, roadmap, community plan

## Security notes

- Secrets live only in `.env` (git-ignored). Rotate anything that was ever committed.
- Create the admin account with a strong password; the `*Admin*.js` / `addTestUsers.js` scripts are for local development only.
- Deployment `projectName` is validated against `^[a-zA-Z0-9][a-zA-Z0-9_-]{0,62}$` because it is used in remote shell commands.
- Rate limits: 300 requests / 15 min / IP globally, 20 login attempts / 15 min.

## Contributing

Issues and PRs welcome. Please run `npm test` (backend) and `npm run build` (frontend) before opening a PR.
