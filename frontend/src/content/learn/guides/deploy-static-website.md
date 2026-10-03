---
slug: deploy-static-website
title: Deploy a static website (HTML, CSS, JavaScript)
level: Beginner
minutes: 60
tools: Nginx, Git, GitHub, GitHub Actions, Docker
summary: Put a real website on your own server with Nginx, then make it update automatically every time you push to GitHub.
outcome: Your website is live at your server's address, and a git push updates it automatically.
---

A **static website** is made of plain files — HTML, CSS, JavaScript, images — that look the same for every visitor. Portfolios, landing pages, documentation sites and the front half of many apps are static. To publish one you only need a **web server** that hands those files to visitors. We will use **Nginx**, the most popular one.

**Before you start:** you finished *Prepare your computer* and *Launch a server on AWS* (you can SSH into your server, and Docker is installed).

## Get the starter website {#get-starter}

Download the tested starter project (a small portfolio page with a dark-mode button). It contains `index.html`, `style.css`, `script.js`, a `Dockerfile` and an auto-deploy workflow.

:::download static-site

Unzip it. Open `index.html` in your browser (double-click it) — you should see the page. Open it in VS Code and change `Your Name` to your real name, then refresh the browser to see your change.

Now put it on GitHub. Create a **new public repository** called `my-website` on GitHub (do **not** tick "Add a README"). Then, in the terminal, inside the unzipped `static-site` folder:

```bash
git init -b main
git add .
git commit -m "My first website"
git remote add origin git@github.com:YOUR_USERNAME/my-website.git
git push -u origin main
```

:::expect
```text
Branch 'main' set up to track remote branch 'main' from 'origin'.
```
:::

:::error src refspec main does not match any
You have no commits yet, or the branch is not called `main`. Run `git status`; if it says "nothing to commit", you are probably in the wrong folder (it must contain `index.html`). If the branch is called `master`, run `git branch -M main` and push again.
:::

:::error Permission denied (publickey) / Could not read from remote repository
Your SSH key is not set up on GitHub — repeat the *Connect your computer to GitHub with an SSH key* step in the Prepare guide. Also check the repository address has your exact username and repository name.
:::

## Log in to your server {#connect}

```bash
ssh -i devops-key.pem ubuntu@YOUR_SERVER_IP
```

From now on, commands with the `ubuntu@...` prompt run **on the server**.

## Install Nginx {#install-nginx}

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl status nginx --no-pager
```

:::expect
```text
● nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled; preset: enabled)
     Active: active (running) since ...
```
:::

Now open `http://YOUR_SERVER_IP` in your browser (type `http://`, not `https://`). You should see **"Welcome to nginx!"**.

:::error The page never loads (timeout) / "This site can't be reached"
Port 80 is closed in the firewall. EC2 → your instance → **Security** → the security group → **Edit inbound rules** → make sure there is a rule **HTTP, port 80, Source 0.0.0.0/0**. Also make sure the address starts with `http://`.
:::

:::note
If Nginx shows `Active: failed`, run `sudo nginx -t` — it tells you the exact line of the problem. On a brand-new install the usual cause is another program already using port 80.
:::

## Put your website files on the server {#put-site-on-server}

We keep websites in `/var/www`. Create a folder, give your user ownership of it, and download your code from GitHub into it:

```bash
sudo mkdir -p /var/www/mysite
sudo chown -R $USER:$USER /var/www/mysite
git clone https://github.com/YOUR_USERNAME/my-website.git /var/www/mysite
ls /var/www/mysite
```

:::expect
```text
Dockerfile  README.md  index.html  script.js  style.css
```
:::

(The `https://` address works without a password because the repository is **public**.)

:::error Cloning into ... fatal: destination path already exists and is not an empty directory
The folder already has files in it (maybe from an earlier attempt). Remove the practice folder and start this step again: `sudo rm -rf /var/www/mysite`, then repeat the three commands (`mkdir`, `chown`, `git clone`). Only do this for this practice folder.
:::

## Tell Nginx to serve your site {#nginx-config}

Create a new Nginx config file:

```bash
sudo nano /etc/nginx/sites-available/mysite
```

Paste this, exactly:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name _;

    root /var/www/mysite;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

Save and exit nano: press **Ctrl+O**, then **Enter**, then **Ctrl+X**.

What each line means: `listen 80` — answer web requests on port 80. `root` — where the website files are. `index` — the file to show for `/`. `try_files` — look for the requested file, otherwise return "404 Not Found".

Now switch it on, and switch the default welcome page off:

```bash
sudo ln -s /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/mysite
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

:::expect
```text
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```
:::

**Always run `sudo nginx -t` before reloading.** It checks your config, and a failed test cannot take your site down.

:::error nginx: [emerg] unknown directive / unexpected "}" / missing ";"
There is a typo in the config file. The message tells you the file and line number (for example `/etc/nginx/sites-enabled/mysite:9`). Open it again with `sudo nano /etc/nginx/sites-available/mysite` and compare with the block above — a missing `;` at the end of a line is the most common mistake.
:::

:::error ln: failed to create symbolic link ... File exists
You already linked it. That is fine — carry on to the next command.
:::

## Check that it works {#verify}

On the server:

```bash
curl -I http://localhost
```

:::expect
```text
HTTP/1.1 200 OK
Server: nginx/1.24.0 (Ubuntu)
Content-Type: text/html
```
:::

And in your browser open `http://YOUR_SERVER_IP` — you should now see **your portfolio page**, not the Nginx welcome page. 🎉

:::error 403 Forbidden
Nginx cannot read your files. Make sure the site is in `/var/www/mysite` (not inside your home folder — Ubuntu keeps home folders private) and fix permissions: `sudo chmod -R o+rX /var/www/mysite`, then reload.
:::

:::error Still showing "Welcome to nginx!" or a 404
You probably did not remove the default site, or the file is not named `index.html`. Run `ls /etc/nginx/sites-enabled/` — only `mysite` should be listed. Then `ls /var/www/mysite` — `index.html` must be there. Reload with `sudo systemctl reload nginx` and hard-refresh the browser (Ctrl+Shift+R).
:::

## Update the website {#update-site}

On your laptop, edit `index.html` (change a heading), then:

```bash
git add .
git commit -m "Update heading"
git push
```

On the server:

```bash
cd /var/www/mysite
git pull
```

Refresh the browser: your change is live. This works — but doing the second half by hand every time is exactly the kind of repetitive job DevOps automates. Next step.

## Automate it with GitHub Actions (CI/CD) {#automate-ci}

The starter already contains `.github/workflows/deploy.yml`. It tells GitHub: "whenever someone pushes to `main`, log in to the server and run `git pull`".

It needs to know how to log in. GitHub keeps secrets safe in **repository secrets**. On GitHub open your `my-website` repo → **Settings → Secrets and variables → Actions → New repository secret** and add three secrets:

| Name | Value |
|------|-------|
| `SSH_HOST` | Your server's public IP address |
| `SSH_USER` | `ubuntu` |
| `SSH_KEY` | The **entire contents** of your `devops-key.pem` file, including the `-----BEGIN` and `-----END` lines |

To copy the key contents on macOS/Linux/Git Bash, run `cat devops-key.pem` and select everything it prints.

Now make a change, push it, and watch the robot work: on GitHub open the **Actions** tab, click the newest run, and wait for the green check ✅.

Refresh your website: it updated **without you touching the server**.

:::warning
For learning, we reuse the server key as the secret. In real projects create a **separate, limited deploy key** so a leaked secret can't do everything. Never put the key in your code or in a public file.
:::

:::error Permission denied (publickey) inside the Actions log
`SSH_KEY` was not pasted completely. Delete the secret and add it again, copying **from the first dash of `-----BEGIN` to the last dash of `-----END`**, including the line breaks.
:::

:::error fatal: not a git repository / No such file or directory (in the Actions log)
The path in the workflow does not match the server. The starter expects the site in `/var/www/mysite` and that folder must have been created with `git clone` (see "Put your website files on the server").
:::

:::error The workflow never starts
GitHub only runs workflows stored at exactly `.github/workflows/deploy.yml` in the repo, on a push to the `main` branch. Check the folder name starts with a dot and that you pushed to `main`.
:::

:::error error: Your local changes would be overwritten by merge / divergent branches (on the server)
Someone edited files directly on the server. Never edit website files on the server — change them on your laptop and push. To discard the server's edits: `cd /var/www/mysite && git reset --hard origin/main`.
:::

## Optional: run the same site in a container {#docker-option}

The starter includes a `Dockerfile` that packs your site into an Nginx container. This shows what Docker does. On the server:

```bash
cd /var/www/mysite
docker build -t mysite .
docker run -d --name mysite -p 8081:80 --restart unless-stopped mysite
curl -I http://localhost:8081
```

:::expect
```text
HTTP/1.1 200 OK
```
:::

It runs on port **8081** (port 80 is already used by the host Nginx). When you are done experimenting, clean up:

```bash
docker stop mysite
docker rm mysite
```

:::note
That container is "the same website, but packaged so it runs identically on any machine". The next guides use Docker for apps that need more than static files.
:::

## Next: a real domain and HTTPS {#next-https}

Right now your site is `http://IP-ADDRESS`. To get `https://yourname.com` with the padlock, follow **Add a domain name and free HTTPS**.

:::check
Your website opens at your server's IP address, and changing a file and running `git push` updates it on its own. You have built a real CI/CD pipeline.
:::

**What you learned:** web servers (Nginx), server config files, Git on a server, firewalls (security groups), and CI/CD with GitHub Actions.
