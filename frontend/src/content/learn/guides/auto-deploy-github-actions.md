---
slug: auto-deploy-github-actions
title: Auto-deploy with GitHub Actions (CI/CD explained)
level: Intermediate
minutes: 45
tools: GitHub Actions, SSH, Git, Docker Compose
summary: Understand the deploy workflow line by line, add automated tests before deploying, and learn how to roll back.
outcome: You can read, change and debug a CI/CD workflow, and you know how to stop a bad change from reaching your server.
---

**CI/CD** is two ideas:

- **Continuous Integration (CI):** every change is automatically built and **tested**, so mistakes are caught in minutes.
- **Continuous Delivery/Deployment (CD):** a change that passes is automatically **delivered to the server**.

**GitHub Actions** is GitHub's built-in robot for this. You describe the steps in a YAML file inside your repository, and GitHub runs them on a temporary computer every time something happens (like a push).

**Before you start:** you deployed one of the sample apps and its `.github/workflows/deploy.yml` file exists.

## Read the workflow, line by line {#anatomy}

This is the file from the starter projects:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy over SSH
        env:
          SSH_HOST: ${{ secrets.SSH_HOST }}
          SSH_USER: ${{ secrets.SSH_USER }}
          SSH_KEY: ${{ secrets.SSH_KEY }}
        run: |
          mkdir -p ~/.ssh
          printf '%s\n' "$SSH_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H "$SSH_HOST" >> ~/.ssh/known_hosts
          ssh -i ~/.ssh/deploy_key "$SSH_USER@$SSH_HOST" "cd ~/app && git pull --ff-only origin main && docker compose up -d --build"
```

| Part | Meaning |
|------|---------|
| `name: Deploy` | The name shown in the Actions tab |
| `on: push: branches: [main]` | **Trigger:** run when someone pushes to `main` |
| `jobs: deploy:` | A job is a group of steps that runs on one machine |
| `runs-on: ubuntu-latest` | GitHub lends you a fresh Ubuntu computer for the job |
| `env: SSH_KEY: ${{ secrets.SSH_KEY }}` | Load a **secret** into an environment variable. Secrets are encrypted and hidden in logs |
| `printf ... > ~/.ssh/deploy_key` | Write the private key to a file so `ssh` can use it |
| `chmod 600` | SSH refuses keys that other users could read |
| `ssh-keyscan -H "$SSH_HOST" >> ~/.ssh/known_hosts` | Remember the server's identity so SSH doesn't ask "are you sure?" |
| `ssh ... "cd ~/app && git pull ... && docker compose up -d --build"` | Log in to the server and run the deploy commands there |
| `git pull --ff-only` | Download new code, but refuse if the server's copy was edited by hand (safer) |

:::note
A job's computer is **thrown away** when the job ends. Nothing stays between runs — that is why the key is written to a file every time.
:::

## Create the three secrets {#secrets}

GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Name | Value |
|------|-------|
| `SSH_HOST` | Server public IP (or domain name) |
| `SSH_USER` | `ubuntu` |
| `SSH_KEY` | Entire private key file contents, from `-----BEGIN` to `-----END` |

Secret values can never be read again after saving (only replaced) — that is the point.

:::warning
Never print secrets in a workflow (`echo $SSH_KEY`), and never commit keys to the repository. If a key is ever exposed, **delete it on the server and create a new one immediately**.
:::

## Watch a run {#watch-run}

1. Push any small change to `main`.
2. Open the repo → **Actions** tab → click the newest run → click the **deploy** job.
3. Click each step to see its output. A green ✅ means success; a red ❌ means a step failed — **read the red step's log from the top**, the real error is usually the first red line.

You can also re-run a failed job with **Re-run jobs** once you have fixed the cause.

## Add automated tests before deploying {#add-tests}

A deploy pipeline that does not test is just a fast way to ship bugs. Add a **test job** that must pass before **deploy** is allowed to run. Edit `.github/workflows/deploy.yml` (this example is for the Node.js starters; for the MERN starter use `working-directory: api` as shown):

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install and test
        run: |
          npm install
          npm test --if-present
        # MERN starter: add   working-directory: api   under "run"'s step, at the same level as "run:"

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy over SSH
        env:
          SSH_HOST: ${{ secrets.SSH_HOST }}
          SSH_USER: ${{ secrets.SSH_USER }}
          SSH_KEY: ${{ secrets.SSH_KEY }}
        run: |
          mkdir -p ~/.ssh
          printf '%s\n' "$SSH_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H "$SSH_HOST" >> ~/.ssh/known_hosts
          ssh -i ~/.ssh/deploy_key "$SSH_USER@$SSH_HOST" "cd ~/app && git pull --ff-only origin main && docker compose up -d --build"
```

What changed: a new `test` job, and `needs: test` on `deploy`. If tests fail, the deploy job is skipped and your server keeps running the last good version.

`npm test --if-present` runs your tests when a `test` script exists and does nothing otherwise. Add real tests as your project grows (for example with Jest) and the pipeline will protect you automatically.

:::tip
Try it: add `"test": "exit 1"` to the `scripts` in `package.json`, push, and watch the pipeline stop before deploy. Then remove that line. Breaking things on purpose is how you learn pipelines.
:::

## Roll back a bad deploy {#rollback}

You pushed a bug and the site is broken. Stay calm — you have two good options.

**Option 1 (best): undo the change with Git** and let the pipeline redeploy:

```bash
git revert HEAD
git push
```

`git revert HEAD` creates a new commit that reverses the last one. History stays honest, and the pipeline deploys the fixed version.

**Option 2 (emergency, directly on the server):** go back to a known-good commit.

```bash
cd ~/app
git log --oneline -5
git checkout GOOD_COMMIT_ID
docker compose up -d --build
```

Afterwards put the server back on the branch with `git checkout main`. Always follow an emergency fix with a proper fix in Git, or the next deploy will overwrite it.

## Common errors {#errors}

:::error Permission denied (publickey) in the log
`SSH_KEY` is wrong or incomplete. Re-create the secret and paste the whole file. Also check `SSH_USER` is `ubuntu`.
:::

:::error ssh: connect to host ... port 22: Connection timed out
GitHub's computers connect from many addresses, so a security group rule limited to **My IP** blocks them. For this practice setup, either allow SSH from `0.0.0.0/0` **temporarily** (and keep the key secret), or learn to use a self-hosted runner / a VPN for a stricter setup later.
:::

:::error Host key verification failed
Usually `SSH_HOST` is wrong (typo or an old IP — remember the IP changes if you did not use an Elastic IP). Update the secret.
:::

:::error "cd: /home/ubuntu/app: No such file or directory"
The project is not cloned at `~/app` on the server. Clone it there once: `git clone https://github.com/YOU/REPO.git ~/app`.
:::

:::error "error: Your local changes would be overwritten" / "fatal: Not possible to fast-forward"
Someone changed files directly on the server. To discard server-side edits: `cd ~/app && git reset --hard origin/main`. Never edit code on the server.
:::

:::error The workflow does not appear in the Actions tab
The file must be at `.github/workflows/<name>.yml` (note the leading dot) on the branch you pushed. YAML is picky about spaces: use spaces, never tabs, and keep indentation consistent.
:::

:::check
You can explain every line of the workflow, a failing test blocks a deploy, and you know two ways to roll back.
:::

**What you learned:** CI vs CD, GitHub Actions triggers/jobs/steps/secrets, SSH automation, test gates, and rollbacks. These are the daily tools of a DevOps engineer.
