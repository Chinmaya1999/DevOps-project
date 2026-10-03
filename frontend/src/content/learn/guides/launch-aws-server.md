---
slug: launch-aws-server
title: Launch a server on AWS and connect to it
level: Beginner
minutes: 60
tools: AWS EC2, Ubuntu, SSH, Docker
summary: Create your own Linux server in the cloud, log in with SSH, and install Docker, ready for every deployment guide.
outcome: You have a running Ubuntu server with a public IP address, you can SSH into it, and Docker works on it.
---

A **server** is just a computer that is always on and connected to the internet, so other people can reach your website. You will **rent** one from Amazon Web Services (AWS). It is billed by the hour, so a few days of practice costs very little — if you remember to switch it off at the end.

:::warning
**Cloud costs real money if you forget things.** Do these two things first: (1) set a **billing alert** (step 2), and (2) follow the **"Stop or delete"** step at the end of this guide whenever you finish practising. AWS free-tier rules and credits change over time, so read the current terms on the AWS Free Tier page when you sign up.
:::

Prefer another provider? Any **Ubuntu 24.04 (or 22.04) LTS** server works the same way — DigitalOcean, Hetzner, Oracle Cloud, Linode. Skip the AWS-specific clicks and use your provider's "create server" screen. You need: Ubuntu, a public IP, an SSH key, and ports **22, 80, 443** open.

## Create an AWS account and protect it {#aws-account}

1. Sign up at [aws.amazon.com](https://aws.amazon.com) (you need an email and a debit/credit card; AWS may place a small temporary verification charge).
2. Sign in as the **root user**, open the account menu (top right) → **Security credentials** → **Assign MFA device**, and add an authenticator app. This protects the account that can spend your money.
3. Open **Billing and Cost Management → Budgets → Create budget → Zero spend budget** (or a small monthly budget such as ₹500) and enter your email. AWS will email you the moment you spend money.
4. In the top-right corner choose a **Region** close to you (for India, **Asia Pacific (Mumbai) ap-south-1**). Everything you create lives in one region — stay in the same one for all steps.

## Launch the server (EC2 instance) {#launch-instance}

Search for **EC2** in the AWS search bar, then click **Launch instance** and fill in:

| Setting | What to choose |
|---------|----------------|
| Name | `devops-server` |
| Application and OS Image | **Ubuntu**, then select **Ubuntu Server 24.04 LTS** |
| Instance type | The smallest one marked **Free tier eligible** (for example `t3.micro` or `t2.micro`). 1 GB of memory is enough for these guides |
| Key pair (login) | Click **Create new key pair** → name `devops-key` → type **RSA**, format **.pem** → **Create**. The file downloads **once**; keep it safe |
| Network settings | Click **Edit**, then **Create security group**. Rules: **SSH (22)** → Source **My IP**; **HTTP (80)** → **Anywhere**; **HTTPS (443)** → **Anywhere** |
| Configure storage | Change **8 GiB** to **20 GiB** (Docker images take space) |

Click **Launch instance**, then **View all instances**. Wait until **Instance state** shows **Running** and **Status check** shows **2/2 checks passed** (1–2 minutes).

:::warning
Do **not** open port 22 to "Anywhere" — bots scan the internet for open SSH ports all day. **My IP** limits it to you. (If your home IP changes later, edit the rule — see the errors below.) Never open database ports such as 27017 or 3306.
:::

:::note
The **security group** is your server's firewall. Only the ports you list can be reached from the internet. This is why a website might not open even when everything on the server is correct: the port is closed here.
:::

## Connect with SSH {#connect-ssh}

Click your instance and copy its **Public IPv4 address** (for example `13.233.10.25`). Open your terminal in the folder where `devops-key.pem` was downloaded.

### macOS / Linux / Git Bash on Windows

```bash
chmod 400 devops-key.pem
ssh -i devops-key.pem ubuntu@YOUR_SERVER_IP
```

### Windows PowerShell

```powershell
ssh -i .\devops-key.pem ubuntu@YOUR_SERVER_IP
```

The first time, type `yes` when asked `Are you sure you want to continue connecting`.

:::expect
```text
Welcome to Ubuntu 24.04 LTS (GNU/Linux 6.8.0-1012-aws x86_64)
...
ubuntu@ip-172-31-5-20:~$
```
:::

When you see the `ubuntu@ip-...:~$` prompt, **you are now typing commands on the server**, not on your laptop. Type `exit` to leave.

:::error Connection timed out
The firewall is blocking you. In EC2 → your instance → **Security** tab → click the security group → **Edit inbound rules** → make sure **SSH (22)** has Source **My IP**. If your internet connection changed since you created the rule (very common on mobile data or Wi-Fi), click the dropdown and choose **My IP** again, then **Save rules**.
:::

:::error WARNING: UNPROTECTED PRIVATE KEY FILE! / bad permissions
SSH refuses key files other people could read. On macOS/Linux/Git Bash run `chmod 400 devops-key.pem`. On Windows PowerShell run these two commands, then retry:
```powershell
icacls .\devops-key.pem /inheritance:r
icacls .\devops-key.pem /grant:r "$($env:USERNAME):R"
```
:::

:::error Permission denied (publickey)
Check the three usual causes: (1) the user must be **ubuntu** for Ubuntu servers (not `ec2-user`, not `root`); (2) you used the right `.pem` file — the one created for **this** instance; (3) there is no extra space or typo in the path. Run the command again with `-v` (for example `ssh -v -i devops-key.pem ubuntu@IP`) to see which key is tried.
:::

:::error Identity file ... not accessible: No such file or directory
You are in the wrong folder. Run `ls` to see if `devops-key.pem` is listed. If not, `cd` to the folder where it was downloaded (usually `~/Downloads`), or give the full path to the file.
:::

## Take a first look around {#first-commands}

You are now on a Linux server. Try these (they are safe):

```bash
whoami
pwd
ls
df -h
free -h
```

- `whoami` — your user name (`ubuntu`). `pwd` — the folder you are in (`/home/ubuntu`).
- `df -h` — disk space. `free -h` — memory.

Now bring the system up to date. This is the first thing to do on any new server:

```bash
sudo apt update
sudo apt upgrade -y
```

`sudo` means "run as administrator". `apt` is Ubuntu's app installer.

:::tip
If a pink/purple screen asks which services to restart, or about a "newer kernel", just press **Enter** to accept the defaults. If the server later asks for a reboot, run `sudo reboot`, wait a minute, and SSH in again.
:::

:::error Could not get lock /var/lib/dpkg/lock-frontend
Another update is running in the background (common right after the server starts). Wait 1–2 minutes and run the command again.
:::

## Install Docker {#install-docker}

Docker will run your apps. Install it with Docker's official install script:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

This takes about a minute and prints a lot of text. Then allow your user to run Docker **without** `sudo`:

```bash
sudo usermod -aG docker $USER
```

For that change to take effect, **log out and back in**:

```bash
exit
```

Then SSH in again (same `ssh -i ...` command) and test:

```bash
docker --version
docker compose version
docker run hello-world
```

:::expect
```text
Docker version 27.3.1, build ce12230
Docker Compose version v2.29.7
...
Hello from Docker!
```
:::

:::note
Docker's install script is great for learning and quick servers. For production systems, teams usually follow the step-by-step apt-repository method in the official Docker docs so every install is pinned and reviewed.
:::

:::error permission denied while trying to connect to the Docker daemon socket
You did not log out and back in after `usermod`. Type `exit`, SSH in again, and retry. Check with `groups` — the list should contain `docker`.
:::

## Optional: a fixed IP address (Elastic IP) {#elastic-ip}

By default your server's public IP **changes every time you stop and start it**. That would break your domain name and your deploy settings. To get a fixed address: EC2 → **Elastic IPs → Allocate Elastic IP address → Allocate**, then select it → **Actions → Associate Elastic IP address** → choose your instance.

:::warning
AWS charges a small hourly fee for public IPv4 addresses, and an Elastic IP that is **not attached to a running instance** still costs money. When you delete the server, also **release** the Elastic IP (Actions → Release).
:::

## Stop or delete the server when you are done {#stop-or-delete}

- **Stop** (EC2 → Instance state → **Stop instance**) pauses the computer. You stop paying for compute, but you still pay a little for the disk, and the public IP changes when you start it again.
- **Terminate** (Instance state → **Terminate instance**) deletes everything. You pay nothing more. Do this when you finish a guide and don't need the server again.

Check **Billing → Bills** a few days after you finish, to be sure nothing is still running.

:::check
You can SSH into your server, `docker run hello-world` works there, and you know how to stop or terminate it. You are ready to deploy.
:::

Next: **Deploy a static website** — your first real deployment.
