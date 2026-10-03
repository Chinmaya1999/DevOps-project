---
slug: deployment-error-cheatsheet
title: Deployment error cheat sheet
level: Beginner
minutes: 20
tools: SSH, Git, Docker, Nginx, Node.js, MongoDB, GitHub Actions
summary: The errors beginners hit most often when deploying, grouped by tool, with the cause and the exact fix.
outcome: You know how to read an error, find which layer it comes from, and fix the most common problems yourself.
---

When something breaks, do not panic and do not change five things at once. Follow this routine:

1. **Read the error message** — the real clue is usually in the first red line.
2. **Find the layer.** Is it your laptop, the network/firewall, the server, Nginx, Docker, or your app?
3. **Check from the inside out:** is the app running → does `curl localhost:PORT` work on the server → does Nginx pass it on → can the internet reach port 80?
4. **Change one thing**, test, repeat.
5. **Search the exact error text** in quotes. Almost everything has been asked before.

Need more? Use the [Help desk](/help) or paste the full error into the [Toolbox](/toolbox).

## SSH problems {#ssh}

:::error Connection timed out
The firewall is blocking port 22. In the AWS security group, SSH (22) must allow **your current IP** (use "My IP" again if you changed network), and the instance must be **running**.
:::

:::error Permission denied (publickey)
Wrong user or wrong key. Ubuntu servers use the user `ubuntu`. Use the `.pem` file that was created for **this** server: `ssh -i devops-key.pem ubuntu@IP`.
:::

:::error WARNING: UNPROTECTED PRIVATE KEY FILE!
Fix permissions: `chmod 400 devops-key.pem` (macOS/Linux/Git Bash). On Windows PowerShell use `icacls` as shown in the *Launch a server* guide.
:::

:::error REMOTE HOST IDENTIFICATION HAS CHANGED
The server at that IP is a different machine than last time (you deleted and recreated the server, so the IP was reused). If **you** caused that, run `ssh-keygen -R YOUR_SERVER_IP` and connect again. If you did not, stop and investigate.
:::

## Git and GitHub problems {#git}

:::error fatal: not a git repository
You are not in a project folder. `cd` into it and check `ls -a` shows `.git`.
:::

:::error Permission denied (publickey) when pushing
GitHub does not know your computer's key. Add `~/.ssh/id_ed25519.pub` to GitHub → Settings → SSH and GPG keys, and test with `ssh -T git@github.com`.
:::

:::error src refspec main does not match any
No commit exists yet (run `git add .` and `git commit -m "first"`) or your branch has another name (`git branch -M main`).
:::

:::error rejected: failed to push some refs / fetch first
The remote has commits you do not have. Run `git pull --rebase`, solve any conflicts, then push again.
:::

## Docker problems {#docker}

:::error permission denied while trying to connect to the Docker daemon socket
Add your user to the docker group (`sudo usermod -aG docker $USER`) and **log out and back in**.
:::

:::error Cannot connect to the Docker daemon (on your laptop)
Docker Desktop is not running. Start it and wait for "Engine running".
:::

:::error port is already allocated / address already in use
Another container or program uses that port. `docker ps` lists containers; remove the old one (`docker rm -f NAME`) or change the left-hand port in `docker-compose.yml`.
:::

:::error no space left on device
Free disk space: `docker system df`, then `docker image prune -af` and `docker builder prune -f`. Check with `df -h`. Use a 20 GB disk for these guides.
:::

:::error exec format error / "no matching manifest for linux/amd64"
The image was built for a different CPU type (for example on an Apple Silicon Mac). Build on the server, or build with `docker build --platform linux/amd64 .`.
:::

:::error The container keeps restarting
It crashes at startup. `docker compose logs --tail 50` shows why — typically a missing environment variable, a wrong port, or a syntax error in the code.
:::

:::error Killed / exit code 137 during build
Out of memory. Add swap (see the MERN guide), then rebuild.
:::

## Nginx problems {#nginx}

:::error 502 Bad Gateway
Nginx works, but your app does not answer. Is the container running (`docker compose ps`)? Does `curl http://localhost:PORT` work on the server? Is the `proxy_pass` port in the Nginx config the same as the app's port?
:::

:::error 403 Forbidden
Nginx cannot read the files. Keep websites under `/var/www`, and run `sudo chmod -R o+rX /var/www/mysite`.
:::

:::error 404 Not Found
The file is missing or `root` points at the wrong folder. Check `ls` in that folder and the `root` line in the config. After editing run `sudo nginx -t && sudo systemctl reload nginx`.
:::

:::error nginx: [emerg] ... in /etc/nginx/sites-enabled/...
Syntax error in your config; the message includes the line number. A missing `;` is the usual culprit. Never reload without `sudo nginx -t` first.
:::

:::error "Welcome to nginx!" still shows
The default site is still enabled. `sudo rm /etc/nginx/sites-enabled/default`, then test and reload.
:::

:::error bind() to 0.0.0.0:80 failed (Address already in use)
Another program holds port 80. Find it with `sudo ss -ltnp | grep :80`.
:::

## Node.js and npm problems {#node}

:::error Cannot find module 'express'
Run `npm install` in the folder that has `package.json`.
:::

:::error EADDRINUSE: address already in use :::3000
Port 3000 is taken. Stop the other process (Ctrl+C in its terminal) or choose another port with `PORT=3001 npm start`.
:::

:::error npm ERR! code ENOENT ... package.json
You are in the wrong folder. `ls` should list `package.json`.
:::

## MongoDB problems {#mongo}

:::error MongoServerSelectionError / ECONNREFUSED 127.0.0.1:27017
The app cannot reach MongoDB. In Docker, use the **service name**, not localhost: `mongodb://mongo:27017/tasks`. Check `docker compose ps` shows mongo as healthy.
:::

:::error My data disappeared after a redeploy
You probably ran `docker compose down -v`, which deletes volumes, or the database was not using a volume. Keep data in a named volume and never use `-v` on a real server.
:::

## GitHub Actions problems {#actions}

:::error Permission denied (publickey) in the workflow log
`SSH_KEY` is incomplete or wrong. Re-create the secret with the whole file.
:::

:::error Workflow does not start
File must be `.github/workflows/something.yml` on the branch you pushed to; YAML uses spaces, not tabs.
:::

:::error Resource not accessible by integration
The workflow's token lacks a permission. Add a `permissions:` block (for example `contents: read`) or use the right secret. See the Help desk for details.
:::

## DNS and HTTPS problems {#dns}

:::error The domain does not open the site
Run `nslookup yourdomain.com`; it must show your server IP. DNS changes can take up to an hour.
:::

:::error Certbot: DNS problem / Timeout during connect
Fix DNS first, and open ports 80 and 443 in the security group.
:::

:::error NET::ERR_CERT_DATE_INVALID / certificate expired
Renewal failed. `sudo certbot renew` shows why; the usual cause is Nginx or the firewall blocking port 80.
:::

:::check
You can name the layer an error comes from and know the first command to run in it. That habit is most of what troubleshooting is.
:::
