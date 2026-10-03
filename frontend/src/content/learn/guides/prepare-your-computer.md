---
slug: prepare-your-computer
title: Prepare your computer
level: Beginner
minutes: 45
tools: Git, GitHub, VS Code, Node.js, SSH, Docker Desktop
summary: Install the tools every DevOps engineer uses, set up Git and GitHub with an SSH key, and push your first commit.
outcome: Git, Node.js and (optionally) Docker work on your computer, and you have pushed a commit to your own GitHub repository.
---

You will set up your computer once, and use it for every other guide. Take your time, and run the **verify** step after each install. If a verify command fails, fix it before moving on — problems here cause confusing errors later.

:::note
**Replace the CAPITAL WORDS** in commands (like `YOUR_USERNAME`) with your own values. Lines starting with `$` show what you type; do not type the `$` itself.
:::

## Create your accounts {#accounts}

1. A **GitHub** account at [github.com](https://github.com) — free. Choose a professional username; it will be in your portfolio links.
2. Turn on **two-factor authentication** in GitHub → Settings → Password and authentication. Developer accounts are a favourite target for attackers.

You will create an AWS account later, in the "Launch a server" guide.

## Install the tools {#install-tools}

You need three things: **Git** (version control), **Node.js** (runs JavaScript apps; version 20 or newer), and a code editor (**VS Code**).

### Windows

1. Install [Git for Windows](https://git-scm.com/download/win). Keep the default options. It also installs **Git Bash**, a terminal that understands Linux-style commands. **Use Git Bash for these guides.**
2. Install the **LTS** version of Node.js from [nodejs.org](https://nodejs.org).
3. Install [VS Code](https://code.visualstudio.com).

### macOS

1. Open Terminal and run `xcode-select --install` (installs Git), or install [Homebrew](https://brew.sh) and then `brew install git node`.
2. Or install the Node.js **LTS** package from [nodejs.org](https://nodejs.org).
3. Install [VS Code](https://code.visualstudio.com).

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y git curl
```

Then install the **LTS** version of Node.js from [nodejs.org](https://nodejs.org/en/download), and VS Code.

## Verify the installs {#verify-tools}

Close and reopen your terminal (Git Bash on Windows), then run:

```bash
git --version
node --version
npm --version
```

:::expect
```text
git version 2.43.0
v20.18.0
10.8.2
```
:::

Your numbers will be different — that is fine. What matters: `git` prints a version, and `node` prints **v18 or higher** (v20+ recommended).

:::error command not found: git (or node)
The install did not finish, or your terminal was open during the install. **Close the terminal completely and open a new one.** On Windows, make sure you are using Git Bash. If it still fails, reinstall and accept the default options.
:::

## Tell Git who you are {#git-config}

Git stamps every change with your name and email.

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
```

Use the **same email as your GitHub account**. Check it saved:

```bash
git config --global --list
```

:::expect
```text
user.name=Your Name
user.email=you@example.com
init.defaultbranch=main
```
:::

## Connect your computer to GitHub with an SSH key {#ssh-key}

An SSH key is a lock-and-key pair: a **private key** (stays on your computer, never share it) and a **public key** (you give to GitHub). It lets you push code without typing a password every time.

Create the pair (press **Enter** at every question to accept the defaults):

```bash
ssh-keygen -t ed25519 -C "you@example.com"
```

Show the **public** key, and copy the whole line (it starts with `ssh-ed25519`):

```bash
cat ~/.ssh/id_ed25519.pub
```

On GitHub: **Settings → SSH and GPG keys → New SSH key**. Give it a title like "My laptop", paste the line, and click **Add SSH key**.

Test the connection:

```bash
ssh -T git@github.com
```

The first time it asks `Are you sure you want to continue connecting (yes/no/[fingerprint])?` — type `yes` and press Enter.

:::expect
```text
Hi YOUR_USERNAME! You've successfully authenticated, but GitHub does not provide shell access.
```
:::

That message looks odd, but it means **success**.

:::error Permission denied (publickey)
GitHub does not recognise your key. Check: (1) you pasted the **.pub** file contents, not the private key; (2) you copied the whole line; (3) you ran `ssh-keygen` with the same user you are running the test from. Re-run `cat ~/.ssh/id_ed25519.pub` and add it again.
:::

:::warning
**Never** share or upload the file without `.pub` (`~/.ssh/id_ed25519`). That is your private key. Anyone who has it can act as you.
:::

## Optional: install Docker Desktop {#docker-desktop}

Docker lets you run the same containers locally that you will run on servers. It is needed for the deployment guides **only if you want to test on your own computer first** (you can also do everything directly on the server).

Download **Docker Desktop** from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/), install it, and start it (wait until the whale icon says it is running). Then:

```bash
docker --version
docker run hello-world
```

:::expect
```text
Hello from Docker!
This message shows that your installation appears to be working correctly.
```
:::

:::error Cannot connect to the Docker daemon
Docker Desktop is not running. Open the Docker Desktop app and wait for it to say "Engine running", then try again. On Windows you may be asked to enable WSL 2 — accept and restart.
:::

## Make your first commit {#first-repo}

This is the loop you will repeat thousands of times: **change → add → commit → push**.

1. On GitHub click **New repository**. Name it `my-first-repo`, choose **Public**, and tick **Add a README file**. Click **Create repository**.
2. On the repo page click the green **Code** button → **SSH** tab → copy the address (it looks like `git@github.com:YOUR_USERNAME/my-first-repo.git`).
3. In your terminal:

```bash
git clone git@github.com:YOUR_USERNAME/my-first-repo.git
cd my-first-repo
echo "I am learning DevOps!" >> README.md
git status
git add README.md
git commit -m "Update README"
git push
```

Refresh the repository page on GitHub — your new line is there.

:::expect
```text
[main 3f2a1b9] Update README
 1 file changed, 1 insertion(+)
```
:::

:::error fatal: not a git repository
You are not inside the project folder. Run `cd my-first-repo` first, then try again. `ls -a` should list a hidden `.git` folder.
:::

:::error Please tell me who you are
You skipped the **Tell Git who you are** step. Run the two `git config --global` commands, then repeat `git commit`.
:::

:::check
You can see your commit on github.com, and `git --version` and `node --version` both print a version. Your computer is ready.
:::

Next: **Launch a server on AWS**.
