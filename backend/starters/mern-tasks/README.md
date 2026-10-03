# MERN tasks starter

MongoDB + Express + React + Node, all started with one command.

```bash
docker compose up -d --build
```

Open http://localhost:8080 — add a task, refresh the page, it is still there (saved in MongoDB).

Without Docker (needs MongoDB installed and running locally):

```bash
cd api && npm install && npm start        # terminal 1 -> http://localhost:5000/health
cd web && npm install && npm run dev      # terminal 2 -> http://localhost:5173
```

Folders: `api/` (Express + MongoDB), `web/` (React + Nginx), `docker-compose.yml` (runs all three),
`.github/workflows/deploy.yml` (auto-deploy to your server on every push).
