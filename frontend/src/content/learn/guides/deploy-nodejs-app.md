---
slug: deploy-nodejs-app
title: Deploy a dynamic Node.js app with Docker and Nginx
level: Beginner
minutes: 75
tools: Node.js, Express, Docker, Docker Compose, Nginx, GitHub Actions
summary: Run a Node.js backend in a Docker container on your server, put Nginx in front of it, and redeploy automatically on every push.
outcome: Your Node.js app is live at your server's address, running in Docker, behind Nginx, and updates when you push to GitHub.
---

A **dynamic** app runs code on the server for every request — it can talk to databases, check logins, calculate things. A static site just hands over files. Most real products are dynamic.

The deployment pattern you learn here works for **any** backend (Node.js, Python, Java, PHP): run the app on a port, in a container, and let **Nginx** be the public front door.

```text
 Visitor  ──►  Nginx (port 80)  ──►  Your app in Docker (port 3000)
```

**Before you start:** you finished *Prepare your computer* and *Launch a server on AWS* (Docker installed on the server).

## Get the starter app and run it on your computer {#get-starter}

Download the tested Express app. It has a home page, a `/health` check and two small API routes.

:::download node-api

Unzip it, open a terminal in the folder, and run:

```bash
npm install
npm start
```

:::expect
```text
Server listening on port 3000
```
:::

Open `http://localhost:3000` in your browser, or in a **second** terminal:

```bash
curl http://localhost:3000/health
curl "http://localhost:3000/api/hello?name=Asha"
```

:::expect
```text
{"status":"ok","uptimeSeconds":12}
{"message":"Hello, Asha!"}
```
:::

Stop the app with **Ctrl+C**.

:::error npm: command not found / node: command not found
Node.js is not installed or the terminal was opened before installing it. See the *Prepare your computer* guide, then open a **new** terminal.
:::

:::error Error: Cannot find module 'express'
You skipped `npm install`, or you are in the wrong folder. Run `ls` — you should see `package.json` and `server.js`. Then run `npm install`.
:::

:::error Error: listen EADDRINUSE: address already in use :::3000
Another program (maybe an old copy of this app) is using port 3000. Stop it with Ctrl+C in its terminal, or run on another port: `PORT=3001 npm start` (on Windows Git Bash this works too).
:::

## Push it to GitHub {#push-github}

Create a new **public** repository `my-node-app` on GitHub (no README), then in the project folder:

```bash
git init -b main
git add .
git commit -m "Node.js starter"
git remote add origin git@github.com:YOUR_USERNAME/my-node-app.git
git push -u origin main
```

(`node_modules` is not uploaded — the starter's `.gitignore` excludes it. Never commit `node_modules` or `.env` files.)

## Understand how it will run: Dockerfile and Compose {#understand-docker}

Open the two files in the project. You do not need to memorise them, but you should understand them.

**Dockerfile** — the recipe for the box (lines starting with `#` are comments; Docker only allows comments on their own line):

```dockerfile
# Start from a small Linux image that already has Node 20
FROM node:20-alpine

# Work inside the /app folder in the box
WORKDIR /app

# Copy only the dependency list first, then install (this layer is cached)
COPY package*.json ./
RUN npm install --omit=dev

# Now copy the rest of your code
COPY . .

ENV NODE_ENV=production

# The app listens on port 3000
EXPOSE 3000

# The command that starts the app
CMD ["node", "server.js"]
```

Copying `package.json` before the code is a classic trick: Docker reuses the cached `npm install` layer unless your dependencies change, so rebuilds take seconds instead of minutes.

**docker-compose.yml** — how to run it:

```yaml
services:
  app:
    build: .                       # build the image from this folder's Dockerfile
    restart: unless-stopped        # start again after crashes and server reboots
    environment:
      - PORT=3000
    ports:
      - "127.0.0.1:3000:3000"      # reachable only from the server itself
```

`127.0.0.1:3000:3000` is important for security: the app is **not** exposed to the whole internet. Only Nginx on the same server can reach it.

## Run it on the server {#run-on-server}

SSH into the server, then download your code and start it:

```bash
git clone https://github.com/YOUR_USERNAME/my-node-app.git ~/app
cd ~/app
docker compose up -d --build
```

The first build downloads the Node image and installs packages (1–3 minutes). When it finishes:

```bash
docker compose ps
curl http://localhost:3000/health
```

:::expect
```text
NAME        IMAGE      COMMAND                  SERVICE   STATUS                    PORTS
app-app-1   app-app    "docker-entrypoint.s…"   app       Up 40 seconds (healthy)   127.0.0.1:3000->3000/tcp

{"status":"ok","uptimeSeconds":41}
```
:::

`-d` means "in the background". The status says `(health: starting)` for the first ~30 seconds, then `(healthy)`.

Useful commands (try them):

```bash
docker compose logs --tail 20      # last log lines
docker compose logs -f             # follow logs live (Ctrl+C to stop following)
docker compose restart             # restart the app
docker compose down                # stop and remove the containers
```

:::error permission denied while trying to connect to the Docker daemon socket
You did not log out and back in after adding yourself to the `docker` group. Run `exit`, SSH in again, and retry (see the *Launch a server* guide).
:::

:::error Bind for 127.0.0.1:3000 failed: port is already allocated
Something already uses port 3000 on the server (an old container, usually). `docker ps` shows containers; remove the old one with `docker rm -f CONTAINER_NAME`, then run `docker compose up -d` again.
:::

:::error failed to solve / npm ERR! during the build
Read the **first** red error line, not the last. Typical causes: a typo in `package.json`, no internet on the server, or no disk space (`df -h`). Fix it, push, `git pull`, and run `docker compose up -d --build` again.
:::

:::error The container keeps restarting / status "Restarting"
The app crashes at start. Read why: `docker compose logs --tail 50`. A common cause is a missing environment variable or a syntax error in `server.js`.
:::

## Put Nginx in front (reverse proxy) {#nginx-proxy}

Your app answers only on `127.0.0.1:3000` — invisible from outside. A **reverse proxy** accepts visitors on the normal web port 80 and forwards them to your app. It also gives you one place to add HTTPS, caching and limits.

```bash
sudo apt update
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/nodeapp
```

Paste:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Save (**Ctrl+O**, **Enter**, **Ctrl+X**), then enable it, remove the default page and reload:

```bash
sudo ln -s /etc/nginx/sites-available/nodeapp /etc/nginx/sites-enabled/nodeapp
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Open `http://YOUR_SERVER_IP` in your browser. You should see **"Hello from my Node.js app, deployed with DevOps! 🚀"**. Also try `http://YOUR_SERVER_IP/health`.

:::error 502 Bad Gateway
Nginx is working but cannot reach your app. Almost always the container is not running. Check `docker compose ps` (inside `~/app`) — it must say `Up`. If it is restarting, read `docker compose logs`. Also confirm `curl http://localhost:3000/health` works **on the server**.
:::

:::error The page never loads
Port 80 is closed. In the AWS security group add an inbound rule **HTTP (80)** from `0.0.0.0/0`.
:::

:::error nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)
Another program already uses port 80 — probably another web server or a container publishing port 80. Find it with `sudo ss -ltnp | grep :80` and stop it, then `sudo systemctl restart nginx`.
:::

## Use secrets and settings safely {#env-vars}

Never write passwords or API keys in your code (and never commit a `.env` file). Instead, keep them in a `.env` file **only on the server**:

```bash
cd ~/app
nano .env
```

```text
API_KEY=my-secret-value
```

Then tell Compose to load it by adding two lines under `app:` in `docker-compose.yml`:

```yaml
    env_file:
      - .env
```

In code you read it with `process.env.API_KEY`. Re-apply with `docker compose up -d --build`. The starter's `.gitignore` already excludes `.env`, so it can never be pushed by accident.

## Update the app {#update-app}

Change something (for example the home page message in `server.js`), then on your laptop:

```bash
git add .
git commit -m "Change greeting"
git push
```

On the server:

```bash
cd ~/app
git pull
docker compose up -d --build
```

Refresh the browser — it changed. Compose only rebuilds what changed, so this takes seconds.

## Make it automatic with GitHub Actions {#automate-ci}

The starter includes `.github/workflows/deploy.yml`, which runs exactly those server commands whenever you push to `main`. Add three repository secrets (GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**):

| Name | Value |
|------|-------|
| `SSH_HOST` | Your server's public IP |
| `SSH_USER` | `ubuntu` |
| `SSH_KEY` | The full contents of `devops-key.pem` (from `-----BEGIN` to `-----END`) |

Push a change, open the **Actions** tab and watch the run turn green ✅. The *Auto-deploy with GitHub Actions* guide explains the file line by line and shows how to add automated tests before deploying.

:::error Permission denied (publickey) in the Actions log
`SSH_KEY` was copied incompletely. Re-create the secret including every line of the key file.
:::

:::error "cd: /home/ubuntu/app: No such file" in the Actions log
The server must have the project at `~/app` (see "Run it on the server"). Clone it there once, by hand.
:::

## Clean up disk space occasionally {#housekeeping}

Docker keeps old images. Check disk use and remove unused data now and then:

```bash
df -h
docker system df
docker image prune -f
```

(`docker image prune -f` removes images nothing uses. The workflow already runs it after each deploy.)

## Deploying your own app instead {#your-own-app}

You can use this same pattern for **any** Node.js project. Checklist:

1. Your app listens on `process.env.PORT` (with a default) and on `0.0.0.0`.
2. Your `package.json` has a `"start"` script and lists **all** dependencies.
3. Copy `Dockerfile`, `.dockerignore`, `docker-compose.yml` and `.github/workflows/deploy.yml` from the starter.
4. Change the port numbers if your app does not use 3000.
5. Python/Flask, Java and PHP apps follow the same shape: only the `Dockerfile` changes (for example `FROM python:3.12-slim`, install requirements, `CMD ["gunicorn", ...]`). The Compose file and Nginx config stay the same.

:::check
`http://YOUR_SERVER_IP` shows your app; `docker compose ps` shows it healthy; a `git push` deploys automatically.
:::

Next: **Deploy a MERN app** (add a database and a React front end), or **Add a domain name and free HTTPS**.
