export interface Stage {
  id: string
  title: string
  weeks: string
  goal: string
  topics: string[]
  /** things you can do when this stage is finished — each one is a checkbox the learner ticks */
  checkpoints: string[]
  project: string
  guides: string[]
  resources: { label: string; url: string }[]
}

/** From zero to a job-ready DevOps engineer, about 6–9 months part-time. */
export const STAGES: Stage[] = [
  {
    id: 'foundations', title: '1. Foundations: computers, networks and Linux', weeks: '2–3 weeks',
    goal: 'Be comfortable in a Linux terminal and understand how the internet moves a request from a browser to a server.',
    topics: ['What a server is; client and server', 'IP address, DNS, ports, HTTP/HTTPS, TCP', 'Linux file system, users, permissions (chmod, chown)', 'Core commands: ls cd pwd cat grep find tail ps top df du curl ssh scp tar', 'Package managers (apt) and services (systemctl, journalctl)'],
    checkpoints: ['I can move around the file system and edit files using only the terminal', 'I can explain what DNS does and what port 80 and 443 are for', 'I can find and kill a running process, and read a log file', 'I can explain Linux file permissions like 755 and 644'],
    project: 'Write down 30 commands you use daily with one example each, in a Git repository called "linux-cheatsheet".',
    guides: ['devops-big-picture', 'prepare-your-computer'],
    resources: [
      { label: 'Linux Journey (free, interactive)', url: 'https://linuxjourney.com' },
      { label: 'OverTheWire: Bandit (practise the terminal as a game)', url: 'https://overthewire.org/wargames/bandit/' },
    ],
  },
  {
    id: 'git', title: '2. Git and GitHub', weeks: '1–2 weeks',
    goal: 'Use Git every day: save work, branch, merge, fix mistakes and collaborate through pull requests.',
    topics: ['init, add, commit, push, pull, clone', 'Branches, merging, resolving conflicts', 'Pull requests and code review', '.gitignore and never committing secrets', 'Undoing things: revert, reset, restore'],
    checkpoints: ['I can create a branch, make changes and open a pull request', 'I can resolve a merge conflict', 'I know why .env files and keys must never be committed', 'I can undo my last commit safely'],
    project: 'Contribute a small fix (even a typo) to a real open-source repository, or make a pull request to a friend\'s project.',
    guides: ['prepare-your-computer'],
    resources: [
      { label: 'Learn Git Branching (visual, interactive)', url: 'https://learngitbranching.js.org' },
      { label: 'Pro Git book (free)', url: 'https://git-scm.com/book/en/v2' },
    ],
  },
  {
    id: 'scripting', title: '3. Scripting: Bash and Python', weeks: '2–3 weeks',
    goal: 'Automate boring tasks with small scripts.',
    topics: ['Bash: variables, if/else, loops, functions, exit codes', 'Reading files, pipes and redirects', 'Python basics: files, JSON, requests, os/subprocess', 'Cron jobs for scheduled tasks'],
    checkpoints: ['I wrote a Bash script that backs up a folder with a date in the file name', 'I wrote a Python script that reads a log file and counts errors', 'I scheduled a script with cron'],
    project: 'A "server health report" script that prints disk, memory and the top 5 processes, and runs every morning.',
    guides: [],
    resources: [
      { label: 'Bash scripting tutorial (Ryan\'s Tutorials)', url: 'https://ryanstutorials.net/bash-scripting-tutorial/' },
      { label: 'Automate the Boring Stuff with Python (free)', url: 'https://automatetheboringstuff.com' },
    ],
  },
  {
    id: 'servers-web', title: '4. Servers, web servers and HTTPS', weeks: '2–3 weeks',
    goal: 'Run a real website on a real server, with a domain name and HTTPS.',
    topics: ['Cloud servers and SSH keys', 'Firewalls and security groups', 'Nginx: serving files and reverse proxy', 'DNS records (A, CNAME)', 'HTTPS with Let\'s Encrypt'],
    checkpoints: ['I launched a Linux server and logged in with SSH', 'My static website is live on my own server', 'I know why the security group blocks a site that is otherwise working', 'My site has a domain name and the padlock (HTTPS)'],
    project: 'Deploy your portfolio website on your own server with your own domain and HTTPS.',
    guides: ['launch-aws-server', 'deploy-static-website', 'domain-and-https'],
    resources: [
      { label: 'Nginx beginner\'s guide', url: 'https://nginx.org/en/docs/beginners_guide.html' },
      { label: 'Let\'s Encrypt: how it works', url: 'https://letsencrypt.org/how-it-works/' },
    ],
  },
  {
    id: 'docker', title: '5. Containers with Docker', weeks: '2–3 weeks',
    goal: 'Package any application into a container and run multi-container apps with Compose.',
    topics: ['Images vs containers', 'Writing a Dockerfile; layers and caching', 'Volumes (persistent data) and networks', 'Docker Compose', 'Registries (Docker Hub), image tags'],
    checkpoints: ['I wrote a Dockerfile for my own app and it runs', 'I can explain the difference between an image and a container', 'I run an app plus a database with docker compose', 'I can read container logs and debug a crashing container'],
    project: 'Containerise a project you already built and deploy it on your server with Docker Compose.',
    guides: ['deploy-nodejs-app', 'deploy-mern-app'],
    resources: [
      { label: 'Docker: Get started', url: 'https://docs.docker.com/get-started/' },
      { label: 'Play with Docker (free browser lab)', url: 'https://labs.play-with-docker.com' },
    ],
  },
  {
    id: 'cicd', title: '6. CI/CD pipelines', weeks: '2–3 weeks',
    goal: 'Make every push build, test and deploy automatically.',
    topics: ['Pipeline stages: build, test, scan, deploy', 'GitHub Actions: triggers, jobs, secrets', 'Jenkins basics (very common in companies)', 'Blue/green and rolling deployments, rollbacks'],
    checkpoints: ['My project deploys automatically when I push to main', 'A failing test stops the deployment', 'I can roll back a bad release in under 5 minutes', 'I generated a Jenkinsfile and understand each stage'],
    project: 'A pipeline that tests, builds a Docker image, and deploys your MERN app on every push.',
    guides: ['auto-deploy-github-actions'],
    resources: [
      { label: 'GitHub Actions documentation', url: 'https://docs.github.com/actions' },
      { label: 'Jenkins user documentation', url: 'https://www.jenkins.io/doc/' },
    ],
  },
  {
    id: 'cloud', title: '7. Cloud fundamentals (AWS)', weeks: '4–5 weeks',
    goal: 'Know the core AWS services and how to control cost and security.',
    topics: ['IAM: users, roles, least privilege, MFA', 'EC2, EBS, Elastic IP, Auto Scaling, load balancers', 'S3 and CloudFront', 'VPC: subnets, route tables, gateways', 'RDS, Route 53, CloudWatch', 'Cost control: budgets, tagging, shutting things down'],
    checkpoints: ['I can design a simple VPC with public and private subnets', 'I use IAM roles instead of sharing access keys', 'I host a static site from S3', 'I set a budget alert and understand my bill'],
    project: 'Host the frontend on S3 + CloudFront and the API on EC2 behind a load balancer.',
    guides: ['launch-aws-server'],
    resources: [
      { label: 'AWS Skill Builder (free digital courses)', url: 'https://skillbuilder.aws' },
      { label: 'AWS Well-Architected Framework', url: 'https://aws.amazon.com/architecture/well-architected/' },
    ],
  },
  {
    id: 'iac', title: '8. Infrastructure as Code: Terraform and Ansible', weeks: '3–4 weeks',
    goal: 'Create and configure servers from code instead of clicking.',
    topics: ['Terraform: providers, resources, variables, outputs, state', 'Modules and remote state', 'Ansible: inventory, playbooks, roles', 'Why IaC beats manual setup: repeatable, reviewable, versioned'],
    checkpoints: ['I created a server, a security group and an IP with Terraform', 'I can destroy and recreate my whole setup with two commands', 'I configured a server with an Ansible playbook'],
    project: 'Terraform that builds the server from the "Launch a server" guide, and Ansible that installs Docker on it.',
    guides: [],
    resources: [
      { label: 'Terraform tutorials (HashiCorp)', url: 'https://developer.hashicorp.com/terraform/tutorials' },
      { label: 'Ansible getting started', url: 'https://docs.ansible.com/ansible/latest/getting_started/index.html' },
    ],
  },
  {
    id: 'k8s', title: '9. Kubernetes', weeks: '4–5 weeks',
    goal: 'Run and scale containers across many machines.',
    topics: ['Pods, Deployments, Services, Ingress', 'ConfigMaps and Secrets', 'Probes, resource limits, autoscaling (HPA)', 'kubectl and troubleshooting (CrashLoopBackOff, ImagePullBackOff)', 'Helm basics'],
    checkpoints: ['I deployed an app to a local cluster (kind or minikube)', 'I can fix a CrashLoopBackOff using kubectl logs and describe', 'I scaled a deployment and did a rolling update', 'I can explain Pod vs Deployment vs Service'],
    project: 'Run the MERN Tasks app on Kubernetes with MongoDB, Ingress and autoscaling.',
    guides: [],
    resources: [
      { label: 'Kubernetes Basics (official interactive tutorial)', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/' },
      { label: 'Killercoda (free hands-on labs)', url: 'https://killercoda.com' },
    ],
  },
  {
    id: 'observability', title: '10. Monitoring and logging', weeks: '2–3 weeks',
    goal: 'Know whether your system is healthy before users tell you it is not.',
    topics: ['Metrics, logs and traces', 'Prometheus and Grafana', 'Alerts that matter (and avoiding alert fatigue)', 'Health checks and uptime monitoring', 'Reading logs under pressure'],
    checkpoints: ['I built a Grafana dashboard for CPU, memory and request rate', 'I set up an alert that notifies me when the app is down', 'I can find the cause of an incident from logs'],
    project: 'Add Prometheus and Grafana to your MERN deployment and alert on /health failing.',
    guides: [],
    resources: [
      { label: 'Prometheus: getting started', url: 'https://prometheus.io/docs/introduction/first_steps/' },
      { label: 'Grafana tutorials', url: 'https://grafana.com/tutorials/' },
    ],
  },
  {
    id: 'security', title: '11. Security and reliability', weeks: '2–3 weeks',
    goal: 'Ship systems that are safe and recover from failure.',
    topics: ['Secrets management; never in Git', 'Least privilege and SSH hardening', 'Scanning images and dependencies', 'Backups and restore drills', 'Incident response and blameless postmortems'],
    checkpoints: ['I scanned my repo for secrets and rotated anything exposed', 'I restored a database backup successfully', 'I wrote a short postmortem for a failure I caused on purpose'],
    project: 'A "production-readiness checklist" for your MERN app, with each item done and documented.',
    guides: ['deployment-error-cheatsheet'],
    resources: [
      { label: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/' },
      { label: 'Google SRE book (free)', url: 'https://sre.google/sre-book/table-of-contents/' },
    ],
  },
  {
    id: 'career', title: '12. Portfolio, certifications and the job hunt', weeks: 'Ongoing',
    goal: 'Turn what you learned into proof an employer can see.',
    topics: ['3 projects with clear READMEs and architecture diagrams', 'Certifications worth considering: AWS Cloud Practitioner → AWS Solutions Architect Associate, HashiCorp Terraform Associate, CKA', 'Resume bullets that show impact', 'Interview topics: Linux, networking, Git, Docker, CI/CD, cloud, troubleshooting scenarios'],
    checkpoints: ['I have three deployed projects on my GitHub with README and diagrams', 'My resume lists tools AND what I achieved with them', 'I practised explaining a deployment end to end, out loud', 'I applied for DevOps / Cloud / SRE / Support-engineer roles'],
    project: 'Write a blog post or README explaining how you deployed your MERN app, including the errors you hit and how you fixed them.',
    guides: [],
    resources: [
      { label: 'roadmap.sh DevOps roadmap', url: 'https://roadmap.sh/devops' },
      { label: 'KodeKloud (hands-on DevOps courses and labs)', url: 'https://kodekloud.com' },
    ],
  },
]

export const checkpointId = (stageId: string, index: number) => `path:${stageId}:${index}`
export const totalCheckpoints = () => STAGES.reduce((n, s) => n + s.checkpoints.length, 0)
