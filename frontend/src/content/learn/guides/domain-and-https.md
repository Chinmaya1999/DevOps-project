---
slug: domain-and-https
title: Add a domain name and free HTTPS
level: Beginner
minutes: 30
tools: DNS, Nginx, Certbot, Let's Encrypt
summary: Point a domain name at your server and get a free, auto-renewing HTTPS certificate so your site shows the padlock.
outcome: Your site opens at https://yourdomain.com with a valid certificate that renews itself.
---

Right now people reach your site at `http://13.233.10.25`. Nobody remembers that, and browsers warn that plain `http://` is "Not secure". Two things fix it:

- A **domain name** (`yourname.com`) that points to your server's IP address — done with **DNS**.
- **HTTPS** — a certificate that encrypts traffic. **Let's Encrypt** gives these away free, and a tool called **Certbot** installs them for you.

**Before you start:** one of the deployment guides is finished and your site works at `http://YOUR_SERVER_IP`, using Nginx on the server. Use an **Elastic IP** (see the server guide) so the address does not change.

## Get a domain name {#get-domain}

Two options:

1. **Buy a domain** (a `.com` costs roughly ₹700–1,200 per year) from a registrar such as Namecheap, GoDaddy or Hostinger. Cheaper endings like `.xyz` or `.online` exist for practice.
2. **Free subdomain** from [duckdns.org](https://www.duckdns.org): sign in, pick a name like `yourname`, and set its IP to your server's IP. You get `yourname.duckdns.org`. You can skip the next step and use that name wherever this guide says `example.com`.

## Point the domain at your server (DNS) {#dns}

DNS is the internet's phone book: it turns a name into an IP address. In your registrar's **DNS settings** create two records:

| Type | Host / Name | Value | TTL |
|------|-------------|-------|-----|
| A | `@` | `YOUR_SERVER_IP` | 300 (or the lowest allowed) |
| A | `www` | `YOUR_SERVER_IP` | 300 |

`@` means the bare domain (`example.com`). Wait a few minutes (it can take up to an hour), then check from your laptop:

```bash
nslookup example.com
```

:::expect
```text
Name:    example.com
Address: 13.233.10.25
```
:::

The address must be **your server's IP**. If it shows a different address or "can't find", wait longer or re-check the record.

:::warning
Do not continue until the domain resolves to your IP. Certbot proves you own the domain by making a request to it — it can only succeed once DNS is correct. Failed attempts count against Let's Encrypt's rate limits.
:::

## Tell Nginx your domain name {#nginx-name}

On the server, open your site's Nginx config. (The file name depends on your guide: `mysite`, `nodeapp` or `mernapp`.)

```bash
ls /etc/nginx/sites-available/
sudo nano /etc/nginx/sites-available/mysite
```

Change the line `server_name _;` to your domain names:

```nginx
    server_name example.com www.example.com;
```

Save, test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Now `http://example.com` should open your site.

## Install Certbot and get the certificate {#certbot}

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```

(Replace the names with yours. For a DuckDNS name use only `-d yourname.duckdns.org`.)

Certbot asks a few questions:

1. **Email address** — enter yours (used for expiry warnings).
2. **Terms of Service** — type `Y`.
3. **Share your email with EFF** — `N` is fine.
4. If it asks whether to **redirect HTTP to HTTPS** — choose **Redirect**.

:::expect
```text
Successfully received certificate.
Deploying certificate
Successfully deployed certificate for example.com to /etc/nginx/sites-enabled/mysite
Congratulations! You have successfully enabled HTTPS on https://example.com
```
:::

Open `https://example.com` — you now have the padlock. 🔒 Certbot edited your Nginx config for you (look at it with `sudo cat /etc/nginx/sites-available/mysite` to see what it added).

## Check that renewal works {#renewal}

Let's Encrypt certificates last **90 days**. Certbot sets up a timer that renews them automatically. Test the whole process without changing anything:

```bash
sudo certbot renew --dry-run
```

:::expect
```text
Congratulations, all simulated renewals succeeded:
  /etc/letsencrypt/live/example.com/fullchain.pem (success)
```
:::

You can see the schedule with `systemctl list-timers | grep certbot`.

## If something goes wrong {#errors}

:::error DNS problem: NXDOMAIN looking up A for example.com
The domain does not point anywhere yet. Fix the A records, wait, and confirm with `nslookup example.com` before running Certbot again.
:::

:::error Timeout during connect (likely firewall problem)
Let's Encrypt cannot reach port 80 on your server. In the AWS security group make sure **HTTP (80)** and **HTTPS (443)** are open to `0.0.0.0/0`. Also check that Nginx is running: `sudo systemctl status nginx`.
:::

:::error Could not find a matching server_name / "Could not automatically find a certificate"
The `server_name` line in your Nginx config does not contain the domain you passed to `-d`. Fix `server_name`, run `sudo nginx -t && sudo systemctl reload nginx`, and run Certbot again.
:::

:::error too many certificates already issued / too many failed authorizations
Let's Encrypt rate limits repeated attempts. Wait an hour (failed attempts) or a week (certificates), and while practising add `--staging` to the Certbot command to use their test system.
:::

:::error The site shows a security warning after HTTPS
Your page loads images or scripts from `http://` addresses ("mixed content"). Change those links to `https://` or to relative paths like `/images/logo.png`.
:::

:::check
`https://yourdomain.com` opens with a padlock, `http://yourdomain.com` redirects to https, and `certbot renew --dry-run` succeeds.
:::
