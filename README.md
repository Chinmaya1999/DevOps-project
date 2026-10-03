# AutoDevOps (InfraPilot)

Generate, validate and deploy production-grade DevOps configuration: Terraform, Kubernetes, Docker, Jenkins,
GitHub Actions, GitLab CI, Azure DevOps, Ansible, monitoring, SSL, Bash and Python. Includes a full-stack ZIP bundle,
AWS one-click deployment, AWS cost analysis, a community chat/blog and an admin panel.

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
