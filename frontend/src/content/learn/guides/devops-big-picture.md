---
slug: devops-big-picture
title: DevOps explained: the big picture
level: Beginner
minutes: 20
tools: Git, GitHub, Docker, CI/CD, Terraform, Kubernetes, Nginx, AWS
summary: What DevOps really is, the tools you will hear about, and the journey your code takes from your laptop to a live server.
outcome: You can explain DevOps in plain words, name what each tool is for, and describe how a website gets deployed.
---

Start here if "DevOps" sounds like a pile of scary tool names. By the end of this page you will know what each tool is **for**, so the rest of the guides make sense. No commands to run yet — just understanding.

## What is DevOps? {#what-is-devops}

Every software product has two groups of people:

- **Developers (Dev)** write the code and want to release new features quickly.
- **Operations (Ops)** keep the servers running and want things to stay stable.

In the old days these were separate teams. Developers "threw the code over the wall" and Ops had to figure out how to run it. Releases happened a few times a year, took a whole weekend, and often broke things.

**DevOps** means the two sides work together and **automate everything in between**, so a small change can go from a developer's laptop to real users in minutes, safely, many times a day.

:::note
Think of a restaurant. Developers are the chefs inventing new dishes. Operations is the dining room: tables, service, keeping customers happy. DevOps is the system that gets each new dish from kitchen to table fast, hot and correct — every time.
:::

A DevOps engineer builds and maintains that system. The daily work is: deploying applications, automating boring tasks, keeping servers healthy, finding out why something broke, and making releases boring and safe.

## The DevOps loop {#lifecycle}

DevOps is a loop, not a straight line. Work flows around it again and again:

1. **Plan** — decide what to build (tickets, issues).
2. **Code** — write it and save it in Git.
3. **Build** — turn the code into something runnable (a Docker image, a website bundle).
4. **Test** — automatic checks catch bugs before users do.
5. **Release / Deploy** — put it on the servers.
6. **Operate** — keep it running, scale it when traffic grows.
7. **Monitor** — watch for errors and slowness, then feed what you learn back into **Plan**.

The goal is to make steps 3–6 **automatic**, so humans only do the thinking parts.

## The tools, and what each one is for {#tools-map}

You do not need to learn all of these at once. Each tool solves one specific problem:

| Tool | The problem it solves | Plain-English meaning |
|------|----------------------|-----------------------|
| Linux | Almost every server runs it | The operating system of servers; you control it with typed commands |
| Git | "Who changed what, and can I undo it?" | A time machine for your code |
| GitHub | Sharing and teamwork | A website that stores your Git projects online |
| Docker | "It works on my machine" | Packs your app and everything it needs into a box that runs the same everywhere |
| GitHub Actions / Jenkins | Doing the same steps by hand every release | A robot that builds, tests and deploys when you push code (CI/CD) |
| Nginx | Serving websites to the internet | A web server and "front door" that forwards visitors to your app |
| AWS (cloud) | Where do the servers live? | Rent computers by the hour instead of buying them |
| Terraform | Clicking around the AWS console is slow and error-prone | Describe your servers in a file; Terraform creates them for you |
| Ansible | Setting up 20 servers identically | Run the same setup instructions on many servers |
| Kubernetes | Running hundreds of containers across many servers | A manager that starts, restarts and scales containers automatically |
| Prometheus / Grafana | "Is it healthy right now?" | Collects numbers from your servers and draws dashboards and alerts |

:::tip
When you meet a new tool, ask one question: **"What painful manual job does this replace?"** If you can answer that, you understand the tool.
:::

## The journey of your code {#deploy-flow}

This is the picture on the DeployDojo home page. Here is what happens when you change a line of code and run `git push`:

1. **GitHub** receives your code and saves the new version.
2. **GitHub Actions** (the robot) wakes up, downloads the code, runs the tests, and builds it.
3. **Docker** packages the app into an *image* — a sealed box containing your code and everything it needs.
4. **A registry** (Docker Hub or AWS ECR) stores that image so any server can download it. *(In the beginner guides you will build the image directly on your server, which skips this step. Teams use a registry once they have more than one server.)*
5. **Terraform** (or you, by hand at first) makes sure the **cloud server** exists with the right network and security rules.
6. **Kubernetes** (or Docker Compose for small projects) starts your containers and keeps them alive.
7. **Nginx** on the server receives visitors from the internet and passes them to your app. Your site is **live**.

You will do steps 1, 2, 3, 6 and 7 yourself in the guides, on a real server.

## What DeployDojo does for you {#what-deploydojo-does}

This platform is a workshop for exactly that journey:

- **Generators** write the files you would otherwise write by hand: Dockerfile, Kubernetes YAML, Terraform, Jenkinsfile, GitHub Actions workflows, Ansible playbooks. Read the output — it is a great way to learn how experts write them.
- **Validator** checks a config for mistakes and insecure settings **before** you deploy it.
- **Error troubleshooter and Help desk** — paste an error or pick your problem, get the cause and the commands to fix it.
- **Secret scanner** — finds passwords and keys you accidentally pasted into code.
- **Full-stack bundle (Pro)** — one ZIP with Docker, CI/CD and Kubernetes files for your app.
- **One-click deployment, cost analysis (Pro)** — deploy to your own AWS server and see where the money goes.
- **Learn (this section)** — a roadmap from zero to job-ready, plus step-by-step deployment guides with **tested** sample projects you can download.

## How to learn this without getting overwhelmed {#how-to-learn}

DevOps is learned by **doing**, and by breaking things on purpose. A routine that works:

1. **Read a little, do a lot.** For each topic: 20 minutes of reading, then 1–2 hours at the keyboard.
2. **Type the commands yourself.** Don't only copy-paste: when you copy, read each command and ask what it does.
3. **Break it, then fix it.** Stop a container, misspell a config, remove a file — then use the logs to find out why it failed. This *is* the job.
4. **Keep notes in a Git repo.** A public repo of "things I learned" doubles as your portfolio.
5. **Build projects, not just courses.** Three deployed projects beat ten completed video series.
6. **Don't memorise.** Nobody remembers every flag. Knowing how to read an error and search for it is the real skill.

:::check
You are ready for the next guide when you can answer: What does Docker do? What does Nginx do? What is CI/CD? If an answer is fuzzy, re-read that table row — it is fine, everyone does.
:::

Next: **Prepare your computer**.
