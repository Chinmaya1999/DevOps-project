---
slug: deploy-mern-app
title: Deploy a MERN app (MongoDB, Express, React, Node) step by step
level: Intermediate
minutes: 120
tools: MongoDB, Express, React, Node.js, Docker Compose, Nginx, GitHub Actions
summary: Deploy a complete full-stack app (React front end, Express API and MongoDB database) on one server using Docker Compose, with automatic deploys.
outcome: A full MERN app runs on your server, its data survives restarts, and a git push updates it.
---

**MERN** = **M**ongoDB (database) + **E**xpress (API) + **R**eact (front end) + **N**ode.js (runs the API). It is the most common full-stack JavaScript stack, and the most asked-about thing to deploy.

You will deploy a small **Tasks** app (add, complete and delete tasks). The same steps apply to your own MERN project — the last step shows how to adapt it.

**Before you start:** finish *Prepare your computer* and *Launch a server on AWS*. Doing *Deploy a Node.js app* first is recommended — this guide builds on it.

## How the pieces fit together {#architecture}

Three containers, one command to start them, **one public address**:

```text
 Browser
    │  http://YOUR_SERVER_IP
    ▼
 Nginx on the server (port 80/443)          ← the public front door (also gives you HTTPS)
    │
    ▼
 web container (Nginx, port 8080 on the server)
    ├── "/"      → the built React app (static files)
    └── "/api/*" → forwarded to ──►  api container (Express, port 5000)
                                          │
                                          ▼
                                     mongo container (MongoDB, data in a Docker volume)
```

Why this design is good:

- The browser talks to **one address** only, so you never fight **CORS errors** — a classic MERN deployment headache.
- The database is **not reachable from the internet**. Only the API container can talk to it, over Docker's private network.
- React calls the API with a **relative URL** (`/api/tasks`), so the same code works on your laptop and in production.

## Download and look at the starter {#get-starter}

:::download mern-tasks

Unzip it. The folders:

| Path | What it is |
|------|-----------|
| `api/` | The Express API (`server.js`), its `Dockerfile` |
| `web/` | The React app (Vite), its `nginx.conf` and a two-stage `Dockerfile` |
| `docker-compose.yml` | Starts MongoDB + API + web together |
| `.github/workflows/deploy.yml` | Automatic deployment on push |

The key parts, so nothing is magic:

**The API reads its settings from environment variables** (set in Compose), and waits for the database:

```js
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tasks';
```

**The React app uses a relative address:**

```js
const API = '/api/tasks';
```

**`web/nginx.conf` forwards `/api` to the API container** — `api` is the **service name** from Compose, which Docker turns into an address:

```nginx
location /api/ {
    proxy_pass http://api:5000;
}
```

## Run it on your computer first (recommended) {#run-locally}

If you installed Docker Desktop, in the unzipped folder run:

```bash
docker compose up -d --build
docker compose ps
```

Open `http://localhost:8080`. Add a task, **refresh the page** — it is still there, because it was saved in MongoDB. 

Stop it with `docker compose down` (your data is kept).

No Docker on your laptop? Skip this step; you will test on the server.

:::error port is already allocated / address already in use (8080)
Something else uses port 8080 on your computer. Change `"127.0.0.1:8080:80"` in `docker-compose.yml` to `"127.0.0.1:8081:80"` and open `http://localhost:8081`.
:::

## Push the project to GitHub {#push-github}

Create a **new public** repository `my-mern-app` (no README), then in the project folder:

```bash
git init -b main
git add .
git commit -m "MERN starter"
git remote add origin git@github.com:YOUR_USERNAME/my-mern-app.git
git push -u origin main
```

## Prepare the server: add swap memory {#swap}

Small servers (1 GB RAM) can run out of memory while **building** the React app, and the build is killed with a message like `Killed` or `exit code 137`. A **swap file** (disk space used as spare memory) prevents that. SSH into the server and run:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

:::expect
```text
               total        used        free      shared  buff/cache   available
Mem:           957Mi       ...
Swap:          2.0Gi          0B       2.0Gi
```
:::

You only do this once per server.

## Start the app on the server {#run-on-server}

```bash
git clone https://github.com/YOUR_USERNAME/my-mern-app.git ~/app
cd ~/app
docker compose up -d --build
```

The first build takes **3–8 minutes** on a small server (it downloads MongoDB, installs packages for two projects, and builds React). It is normal to see a lot of output. When the prompt returns:

```bash
docker compose ps
```

:::expect
```text
NAME           IMAGE         SERVICE   STATUS                    PORTS
app-api-1      app-api       api       Up 25 seconds
app-mongo-1    mongo:7       mongo     Up 40 seconds (healthy)
app-web-1      app-web       web       Up 20 seconds             127.0.0.1:8080->80/tcp
```
:::

Check each layer from the inside out — this is how DevOps engineers debug:

```bash
docker compose logs api --tail 5
curl http://localhost:8080/api/tasks
curl http://localhost:8080/
```

:::expect
```text
Connected to MongoDB
API listening on port 5000

[]

<!doctype html>
<html lang="en"> ...
```
:::

`[]` means the API works and the database is empty. You see HTML for `/`: the React app is served.

:::error Killed / exit code 137 / "npm ERR! signal SIGKILL" during the build
The server ran out of memory. Make sure you did the **swap** step, check with `free -h` that Swap shows 2.0Gi, then run `docker compose up -d --build` again.
:::

:::error MongoDB not ready yet (attempt 3/10) in `docker compose logs api`
This is normal for the first seconds: MongoDB is still starting and the API keeps retrying. If it stays like this, run `docker compose logs mongo` to see why the database did not start (disk full is the usual reason: `df -h`).
:::

:::error bind: address already in use / port is already allocated
Something else on the server uses port 8080. Check with `sudo ss -ltnp | grep 8080` and stop it, or change the port in `docker-compose.yml`.
:::

:::error no space left on device
The server disk is full. `df -h` and `docker system df` show usage. Free space with `docker image prune -af` and `docker builder prune -f`. If you used the default 8 GB disk, expand the volume in EC2 or recreate the server with 20 GB.
:::

## Make it public with the host Nginx {#nginx-front-door}

The app runs on `127.0.0.1:8080`, reachable only from the server. Add Nginx as the public front door (the same pattern as the Node.js guide, with a different port):

```bash
sudo apt update
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/mernapp
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name _;

    client_max_body_size 5m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Save, enable, test, reload:

```bash
sudo ln -s /etc/nginx/sites-available/mernapp /etc/nginx/sites-enabled/mernapp
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Open `http://YOUR_SERVER_IP` in the browser. Add a few tasks, refresh the page, close the tab and come back — your data is there. 🎉

:::error Blank white page
Open the browser developer tools (F12) → **Console** and **Network**. A 404 for a `.js` file means the React build is missing: check `docker compose logs web` and that the build step printed no errors. A 502 on `/api/tasks` means the API container is down — see the next errors.
:::

:::error 502 Bad Gateway
The host Nginx cannot reach the `web` container (or `web` cannot reach `api`). Run `docker compose ps` — all three must be `Up`. Then `curl http://localhost:8080` on the server: if that fails, the problem is inside Docker (read `docker compose logs`); if it works, check the `proxy_pass` port in the host Nginx config is exactly `8080`.
:::

:::error "Tasks load but adding/deleting does nothing" or the API returns 404 under /api
In `web/nginx.conf`, `proxy_pass http://api:5000;` must have **no trailing slash and no path**. With `http://api:5000/` Nginx would strip `/api` and your routes would 404.
:::

:::error "Could not load tasks: Server returned 500" or the app says the database is not connected
Look at `docker compose logs api`. The connection string inside Docker must use the **service name**: `mongodb://mongo:27017/tasks` — not `localhost`. Inside a container, `localhost` means the container itself.
:::

## Your data, and how not to lose it {#data}

MongoDB stores its files in a **Docker volume** named `mongo-data`. That is why your tasks survive restarts and redeploys:

| Command | What happens to your data |
|---------|---------------------------|
| `docker compose restart` | Kept |
| `docker compose up -d --build` (redeploy) | Kept |
| `docker compose down` | Kept (the volume stays) |
| `docker compose down -v` | **Deleted!** The `-v` removes the volume |

:::warning
Never run `docker compose down -v` on a server that holds real data. And remember: a volume on one server is **not a backup**. If the disk dies, the data is gone.
:::

A simple manual backup (optional; run it on the server):

```bash
cd ~/app
docker compose exec -T mongo mongodump --db=tasks --archive --gzip > tasks-backup.archive.gz
ls -lh tasks-backup.archive.gz
```

Real projects use a managed database (MongoDB Atlas) or scheduled backups copied to S3. A good habit: **practise restoring** a backup once, because a backup you have never restored is only a hope.

## Automatic deployment {#automate-ci}

The starter includes `.github/workflows/deploy.yml`. Add three **repository secrets** on GitHub (**Settings → Secrets and variables → Actions → New repository secret**):

| Name | Value |
|------|-------|
| `SSH_HOST` | Your server's public IP |
| `SSH_USER` | `ubuntu` |
| `SSH_KEY` | The entire contents of `devops-key.pem` |

Now change something small — for example the heading text in `web/src/App.jsx` — then:

```bash
git add .
git commit -m "Change heading"
git push
```

Open the repo's **Actions** tab and wait for the green check ✅. The workflow logs in to the server, runs `git pull` and `docker compose up -d --build`. Refresh the site — updated, with no manual step.

## Make it secure before showing it to anyone {#hardening}

This starter is a learning project. Before a real app goes live, tick these off:

- [ ] **HTTPS** — follow *Add a domain name and free HTTPS*.
- [ ] **Database login** — enable MongoDB authentication (create a user and password, put the password in a server-only `.env`, and use it in `MONGODB_URI`).
- [ ] **Secrets in `.env`**, never in Git.
- [ ] **SSH only from your IP** (the security group rule), no password logins.
- [ ] **Updates** — `sudo apt update && sudo apt upgrade` regularly.
- [ ] **Backups** that you have tested.
- [ ] **Monitoring** — at least an uptime check on `/health`.

## Deploy your own MERN project {#your-own-app}

To deploy a MERN app you already built, copy the files from the starter and adapt these points:

1. **API:** reads `process.env.PORT` and `process.env.MONGODB_URI`; listens on `0.0.0.0`. Add `"start": "node server.js"` to `package.json`.
2. **Front end API calls:** change `http://localhost:5000/api/...` to **relative** `/api/...`. For development, add a proxy in `vite.config.js` (already in the starter), or `"proxy": "http://localhost:5000"` in a Create React App `package.json`.
3. **Build folder name:** Vite creates `dist/`; **Create React App creates `build/`**. In `web/Dockerfile` change `COPY --from=build /app/dist ...` to `/app/build` if you use CRA.
4. **Routes:** the API paths must start with `/api` (or change the `location /api/` blocks in both Nginx configs to match).
5. **Environment variables:** add every variable your API needs under `environment:` (or `env_file:`) in `docker-compose.yml`.
6. **React Router:** the starter's `try_files $uri /index.html;` already makes page refreshes work for client-side routes.
7. Remove `cors()` middleware if you no longer need it — same-origin requests do not need CORS.

:::check
`http://YOUR_SERVER_IP` shows your React app, tasks you add are saved in MongoDB and survive `docker compose restart`, and a `git push` updates the live site.
:::

**What you learned:** multi-container apps with Docker Compose, reverse proxies, container networking, persistent volumes, environment variables, swap memory, and a complete CI/CD flow.
