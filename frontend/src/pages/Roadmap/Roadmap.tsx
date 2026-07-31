import React, { useState, useEffect } from 'react'
import { Clock, Award, BookOpen, Target, Zap, Cloud, Server, CheckCircle, Lock, PlayCircle, TrendingUp, Star, FileText, Code, ExternalLink, Youtube } from 'lucide-react'

interface RoadmapStep {
  id: string
  title: string
  description: string
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  prerequisites: string[]
  skills: string[]
  detailedSteps: string[]
  resources: {
    type: 'course' | 'documentation' | 'tutorial' | 'project' | 'certification' | 'youtube'
    title: string
    url: string
    provider: string
    id: string
  }[]
  status: 'locked' | 'available' | 'in-progress' | 'completed'
  progress: number
}

interface RoadmapPath {
  id: string
  name: string
  description: string
  icon: React.ElementType
  color: string
  totalDuration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  steps: RoadmapStep[]
}

const Roadmap: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState<string>('devops')
  const [paths, setPaths] = useState<RoadmapPath[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  const roadmapPaths: RoadmapPath[] = [
    {
      id: 'devops',
      name: 'DevOps Engineer',
      description: 'Complete roadmap to become a DevOps Engineer with modern tools and practices',
      icon: Server,
      color: 'from-blue-500 to-indigo-600',
      totalDuration: '6-12 months',
      difficulty: 'intermediate',
      steps: [
        {
          id: 'devops-1',
          title: 'Linux Fundamentals',
          description: 'Master Linux command line, system administration, and shell scripting - the foundation of DevOps',
          duration: '4-6 weeks',
          difficulty: 'beginner',
          prerequisites: [],
          skills: ['Linux CLI', 'Shell Scripting', 'System Administration', 'File Management', 'User Management', 'Process Management'],
          detailedSteps: [
            'Week 1: Basic Linux commands and file system navigation (ls, cd, pwd, mkdir, rm, cp, mv)',
            'Week 2: File permissions and ownership (chmod, chown, chgrp, umask)',
            'Week 3: User management and sudo (useradd, usermod, userdel, visudo)',
            'Week 4: Process management and monitoring (ps, top, htop, kill, systemctl)',
            'Week 5: Package management (apt, yum, dnf) and software installation',
            'Week 6: Bash scripting basics (variables, loops, conditionals, functions)'
          ],
          resources: [
            { type: 'youtube', title: 'Linux for DevOps Beginners Full Course', url: 'https://www.youtube.com/watch?v=Wvf0mBNGjXY', provider: 'FreeCodeCamp', id: 'linux-youtube-1' },
            { type: 'youtube', title: 'Linux Terminal Tutorial', url: 'https://www.youtube.com/watch?v=sWbUDq4S6Y8', provider: 'freeCodeCamp', id: 'linux-youtube-2' },
            { type: 'youtube', title: 'Bash Scripting Tutorial', url: 'https://www.youtube.com/watch?v=ox4b7Z1BZjA', provider: 'DistroTube', id: 'linux-youtube-3' },
            { type: 'course', title: 'Linux Fundamentals for DevOps', url: 'https://www.udemy.com/course/linux-for-devops/', provider: 'Udemy', id: 'linux-fundamentals' },
            { type: 'documentation', title: 'Linux Documentation Project', url: 'https://tldp.org/', provider: 'TLDP', id: 'linux-docs' },
            { type: 'tutorial', title: 'Complete Bash Scripting Guide', url: 'https://www.gnu.org/software/bash/manual/', provider: 'GNU Documentation', id: 'bash-scripting-guide' },
            { type: 'project', title: 'Build a Linux Server Setup', url: 'https://github.com/topics/linux-server-setup', provider: 'GitHub Projects', id: 'linux-project' }
          ],
          status: 'available',
          progress: 0
        },
        {
          id: 'devops-2',
          title: 'Version Control with Git',
          description: 'Learn Git version control, branching strategies, and collaborative workflows - essential for team collaboration',
          duration: '2-3 weeks',
          difficulty: 'beginner',
          prerequisites: ['Linux Fundamentals'],
          skills: ['Git Commands', 'Branching', 'Merge Strategies', 'GitHub/GitLab', 'Pull Requests', 'Code Review'],
          detailedSteps: [
            'Week 1: Git basics (init, clone, add, commit, status, log, diff)',
            'Week 2: Branching and merging (branch, checkout, merge, rebase, stash)',
            'Week 3: Remote repositories and collaboration (push, pull, remote, PRs, code review)'
          ],
          resources: [
            { type: 'youtube', title: 'Git & GitHub Crash Course', url: 'https://www.youtube.com/watch?v=zTjRZNkhiEU', provider: 'freeCodeCamp', id: 'git-youtube-1' },
            { type: 'youtube', title: 'Git Complete Tutorial', url: 'https://www.youtube.com/watch?v=uaeKhfhYE0U', provider: 'Anuj Kumar Sharma', id: 'git-youtube-2' },
            { type: 'youtube', title: 'Advanced Git Tutorial', url: 'https://www.youtube.com/watch?v=DJAy5vdvPIQ', provider: 'Programming with Mosh', id: 'git-youtube-3' },
            { type: 'course', title: 'Git Complete Course', url: 'https://www.udemy.com/course/git-complete/', provider: 'Udemy', id: 'git-course' },
            { type: 'documentation', title: 'Pro Git Book', url: 'https://git-scm.com/book/en/v2', provider: 'Git SCM', id: 'git-docs' },
            { type: 'tutorial', title: 'GitHub Workflow Tutorial', url: 'https://docs.github.com/en/get-started/quickstart', provider: 'GitHub', id: 'github-tutorial' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'devops-3',
          title: 'Containerization with Docker',
          description: 'Master Docker containers, images, and container orchestration basics - revolutionizing application deployment',
          duration: '3-4 weeks',
          difficulty: 'intermediate',
          prerequisites: ['Version Control with Git'],
          skills: ['Docker Containers', 'Dockerfile', 'Docker Compose', 'Image Management', 'Docker Networks', 'Docker Volumes'],
          detailedSteps: [
            'Week 1: Docker basics and installation (run, ps, images, rmi, exec, logs)',
            'Week 2: Building images with Dockerfile (FROM, RUN, COPY, CMD, ENTRYPOINT, ENV)',
            'Week 3: Docker Compose for multi-container applications (docker-compose.yml, services, networks)',
            'Week 4: Advanced Docker concepts (networks, volumes, registry, optimization)'
          ],
          resources: [
            { type: 'youtube', title: 'Docker Crash Course', url: 'https://www.youtube.com/watch?v=3c-iBn73dDE', provider: 'TechWorld with Nana', id: 'docker-youtube-1' },
            { type: 'youtube', title: 'Docker Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=fqMOX6JJhGo', provider: 'freeCodeCamp', id: 'docker-youtube-2' },
            { type: 'youtube', title: 'Docker Compose Tutorial', url: 'https://www.youtube.com/watch?v=GFgJkfScVNU', provider: 'JavaScript Mastery', id: 'docker-youtube-3' },
            { type: 'course', title: 'Docker Mastery', url: 'https://www.udemy.com/course/docker-mastery/', provider: 'Udemy', id: 'docker-mastery' },
            { type: 'documentation', title: 'Docker Official Docs', url: 'https://docs.docker.com/', provider: 'Docker', id: 'docker-docs' },
            { type: 'project', title: 'Containerize a Web Application', url: 'https://github.com/docker/awesome-compose', provider: 'GitHub Projects', id: 'docker-project' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'devops-4',
          title: 'CI/CD Pipelines',
          description: 'Build continuous integration and deployment pipelines with Jenkins/GitHub Actions - automate your development workflow',
          duration: '4-5 weeks',
          difficulty: 'intermediate',
          prerequisites: ['Containerization with Docker'],
          skills: ['Jenkins', 'GitHub Actions', 'Pipeline Design', 'Automated Testing', 'Build Automation', 'Deployment Strategies'],
          detailedSteps: [
            'Week 1: CI/CD concepts and pipeline design (CI vs CD, pipeline stages, triggers)',
            'Week 2: Jenkins fundamentals (installation, jobs, pipelines, plugins)',
            'Week 3: GitHub Actions (workflows, actions, secrets, environments)',
            'Week 4: Testing automation and quality gates (unit tests, integration tests, code quality)',
            'Week 5: Deployment strategies and pipeline optimization (blue-green, canary, rollback)'
          ],
          resources: [
            { type: 'youtube', title: 'CI/CD Pipeline Tutorial', url: 'https://www.youtube.com/watch?v=To-KzPB_EnE', provider: 'Tech Tutorials with Piyush', id: 'cicd-youtube-1' },
            { type: 'youtube', title: 'Jenkins Complete Tutorial', url: 'https://www.youtube.com/watch?v=FX322RVNGj4', provider: 'Simplilearn', id: 'cicd-youtube-2' },
            { type: 'youtube', title: 'GitHub Actions Tutorial', url: 'https://www.youtube.com/watch?v=R8ejsWo7KGs', provider: 'Traversy Media', id: 'cicd-youtube-3' },
            { type: 'course', title: 'CI/CD with Jenkins', url: 'https://www.udemy.com/course/jenkins-the-continuous-integration-solution/', provider: 'Udemy', id: 'jenkins-course' },
            { type: 'tutorial', title: 'GitHub Actions Guide', url: 'https://docs.github.com/en/actions', provider: 'GitHub Docs', id: 'github-actions-docs' },
            { type: 'project', title: 'Build a CI/CD Pipeline', url: 'https://github.com/features/actions', provider: 'GitHub', id: 'cicd-project' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'devops-5',
          title: 'Kubernetes Orchestration',
          description: 'Learn Kubernetes for container orchestration at scale - the industry standard for container management',
          duration: '6-8 weeks',
          difficulty: 'advanced',
          prerequisites: ['CI/CD Pipelines'],
          skills: ['Kubernetes', 'Pods & Services', 'Deployments', 'Helm', 'Ingress', 'ConfigMaps & Secrets'],
          detailedSteps: [
            'Week 1-2: Kubernetes basics (architecture, kubectl, pods, namespaces)',
            'Week 3-4: Services and networking (ClusterIP, NodePort, LoadBalancer, Ingress)',
            'Week 5-6: Deployments and scaling (replicas, rolling updates, autoscaling)',
            'Week 7: Configuration management (ConfigMaps, Secrets, environment variables)',
            'Week 8: Helm package manager and advanced topics (storage, RBAC, monitoring)'
          ],
          resources: [
            { type: 'youtube', title: 'Kubernetes Crash Course', url: 'https://www.youtube.com/watch?v=X48VuDVv0do', provider: 'TechWorld with Nana', id: 'k8s-youtube-1' },
            { type: 'youtube', title: 'Kubernetes Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=d6WC5n9G_sM', provider: 'freeCodeCamp', id: 'k8s-youtube-2' },
            { type: 'youtube', title: 'Kubernetes Full Course', url: 'https://www.youtube.com/watch?v=_4uQI4ihGVU', provider: 'TechWorld with Nana', id: 'k8s-youtube-3' },
            { type: 'course', title: 'Kubernetes for Developers', url: 'https://www.udemy.com/course/kubernetes-for-developers/', provider: 'Udemy', id: 'k8s-course' },
            { type: 'documentation', title: 'K8s Official Docs', url: 'https://kubernetes.io/docs/', provider: 'Kubernetes', id: 'k8s-docs' },
            { type: 'certification', title: 'CKAD Certification Prep', url: 'https://www.cncf.io/certification/ckad/', provider: 'CNCF', id: 'ckad-cert' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'devops-6',
          title: 'Infrastructure as Code',
          description: 'Automate infrastructure provisioning with Terraform and CloudFormation - treat infrastructure like code',
          duration: '4-6 weeks',
          difficulty: 'advanced',
          prerequisites: ['Kubernetes Orchestration'],
          skills: ['Terraform', 'CloudFormation', 'IaC Principles', 'State Management', 'Modules', 'Testing'],
          detailedSteps: [
            'Week 1: IaC concepts and Terraform basics (HCL syntax, providers, resources)',
            'Week 2: Terraform state management (state file, remote state, state locking)',
            'Week 3: Terraform modules and reusability (module structure, registry, variables)',
            'Week 4: Advanced Terraform (workspaces, provisioners, null resources)',
            'Week 5: CloudFormation basics (templates, stacks, parameters, mappings)',
            'Week 6: IaC best practices and testing (terratest, validation, drift detection)'
          ],
          resources: [
            { type: 'youtube', title: 'Terraform Crash Course', url: 'https://www.youtube.com/watch?v=7xngnjfIlK4', provider: 'DevOps Directive', id: 'terraform-youtube-1' },
            { type: 'youtube', title: 'Terraform Full Course', url: 'https://www.youtube.com/watch?v=Es9qhcnVXc4', provider: 'TechWorld with Nana', id: 'terraform-youtube-2' },
            { type: 'youtube', title: 'Terraform Tutorial', url: 'https://www.youtube.com/watch?v=YcJ9IeukJL8', provider: 'KodeKloud', id: 'terraform-youtube-3' },
            { type: 'course', title: 'Terraform Deep Dive', url: 'https://www.udemy.com/course/terraform-beginner-to-advanced/', provider: 'Udemy', id: 'terraform-course' },
            { type: 'documentation', title: 'Terraform Docs', url: 'https://developer.hashicorp.com/terraform/docs', provider: 'HashiCorp', id: 'terraform-docs' },
            { type: 'project', title: 'Deploy Infrastructure with IaC', url: 'https://github.com/hashicorp/terraform-aws-modules', provider: 'GitHub Projects', id: 'terraform-project' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'devops-7',
          title: 'Monitoring & Observability',
          description: 'Implement monitoring, logging, and observability with Prometheus, Grafana, and ELK - gain insights into your systems',
          duration: '4-5 weeks',
          difficulty: 'advanced',
          prerequisites: ['Infrastructure as Code'],
          skills: ['Prometheus', 'Grafana', 'ELK Stack', 'APM Tools', 'Logging', 'Alerting'],
          detailedSteps: [
            'Week 1: Monitoring concepts and Prometheus setup (metrics, exporters, PromQL)',
            'Week 2: Grafana dashboards and visualization (panels, queries, alerts)',
            'Week 3: ELK Stack (Elasticsearch, Logstash, Kibana) for logging',
            'Week 4: Distributed tracing and APM (Jaeger, Zipkin, application monitoring)',
            'Week 5: Alerting strategies and incident response (alertmanager, on-call, runbooks)'
          ],
          resources: [
            { type: 'youtube', title: 'Prometheus Crash Course', url: 'https://www.youtube.com/watch?v=5oI6N0xN7oA', provider: 'TechWorld with Nana', id: 'monitoring-youtube-1' },
            { type: 'youtube', title: 'Grafana Tutorial', url: 'https://www.youtube.com/watch?v=J1RlTGRXcYg', provider: 'Grafana', id: 'monitoring-youtube-2' },
            { type: 'youtube', title: 'ELK Stack Tutorial', url: 'https://www.youtube.com/watch?v=Be5z1t2cw9I', provider: 'TechWorld with Nana', id: 'monitoring-youtube-3' },
            { type: 'course', title: 'Monitoring Fundamentals', url: 'https://www.udemy.com/course/prometheus-grafana-training/', provider: 'Udemy', id: 'monitoring-course' },
            { type: 'tutorial', title: 'Grafana Dashboard Guide', url: 'https://grafana.com/docs/', provider: 'Grafana', id: 'grafana-docs' },
            { type: 'project', title: 'Setup Monitoring Stack', url: 'https://github.com/prometheus/prometheus', provider: 'GitHub Projects', id: 'monitoring-project' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'devops-8',
          title: 'DevOps Security & DevSecOps',
          description: 'Learn security practices in DevOps pipelines and infrastructure - integrate security into your DevOps workflow',
          duration: '3-4 weeks',
          difficulty: 'advanced',
          prerequisites: ['Monitoring & Observability'],
          skills: ['DevSecOps', 'Security Scanning', 'Compliance', 'Secret Management', 'Container Security', 'Infrastructure Security'],
          detailedSteps: [
            'Week 1: DevSecOps concepts and security integration (shift-left, security as code)',
            'Week 2: Container security and scanning (vulnerability scanning, image hardening)',
            'Week 3: Secret management and compliance (Vault, secrets managers, SOC2, GDPR)',
            'Week 4: Security automation and incident response (SAST/DAST, security testing, forensics)'
          ],
          resources: [
            { type: 'youtube', title: 'DevSecOps Tutorial', url: 'https://www.youtube.com/watch?v=6Jt6o3Tq0QY', provider: 'TechWorld with Nana', id: 'devsecops-youtube-1' },
            { type: 'youtube', title: 'Kubernetes Security', url: 'https://www.youtube.com/watch?v=41dAY5v5Ses', provider: 'SANS Institute', id: 'devsecops-youtube-2' },
            { type: 'youtube', title: 'Vault Tutorial', url: 'https://www.youtube.com/watch?v=8ZG5Jp0Zg5k', provider: 'HashiCorp', id: 'devsecops-youtube-3' },
            { type: 'course', title: 'DevSecOps Fundamentals', url: 'https://www.udemy.com/course/devsecops-fundamentals/', provider: 'Udemy', id: 'devsecops-course' },
            { type: 'documentation', title: 'Security Best Practices', url: 'https://www.sans.org/', provider: 'SANS', id: 'security-docs' },
            { type: 'certification', title: 'Security+ Certification', url: 'https://www.comptia.org/certifications/security', provider: 'CompTIA', id: 'security-cert' }
          ],
          status: 'locked',
          progress: 0
        }
      ]
    },
    {
      id: 'cloud',
      name: 'Cloud Engineer',
      description: 'Complete roadmap to become a Cloud Engineer with AWS, Azure, and GCP expertise',
      icon: Cloud,
      color: 'from-purple-500 to-pink-600',
      totalDuration: '8-14 months',
      difficulty: 'intermediate',
      steps: [
        {
          id: 'cloud-1',
          title: 'Cloud Computing Fundamentals',
          description: 'Understand cloud concepts, service models, and deployment models - the foundation of cloud engineering',
          duration: '2-3 weeks',
          difficulty: 'beginner',
          prerequisites: [],
          skills: ['Cloud Concepts', 'Service Models', 'Deployment Models', 'Cloud Providers', 'Virtualization', 'Networking Basics'],
          detailedSteps: [
            'Week 1: Cloud computing concepts (IaaS, PaaS, SaaS, public/private/hybrid cloud)',
            'Week 2: Virtualization and networking basics (VMs, hypervisors, IP addressing, DNS)',
            'Week 3: Cloud provider comparison and selection (AWS vs Azure vs GCP, pricing models)'
          ],
          resources: [
            { type: 'youtube', title: 'Cloud Computing Explained', url: 'https://www.youtube.com/watch?v=M988_fsCSHo', provider: 'Simplilearn', id: 'cloud-youtube-1' },
            { type: 'youtube', title: 'AWS vs Azure vs GCP', url: 'https://www.youtube.com/watch?v=9Bz5u_0cG0o', provider: 'TechWorld with Nana', id: 'cloud-youtube-2' },
            { type: 'youtube', title: 'Cloud Service Models', url: 'https://www.youtube.com/watch?v=kx0zM7LNYHE', provider: 'AWS', id: 'cloud-youtube-3' },
            { type: 'course', title: 'Cloud Computing Basics', url: 'https://www.coursera.org/learn/cloud-computing-foundations', provider: 'Coursera', id: 'cloud-course' },
            { type: 'documentation', title: 'Cloud Computing Guide', url: 'https://aws.amazon.com/what-is-cloud-computing/', provider: 'AWS', id: 'cloud-docs' },
            { type: 'certification', title: 'Cloud Practitioner', url: 'https://aws.amazon.com/certification/cloud-practitioner/', provider: 'AWS', id: 'cloud-practitioner' }
          ],
          status: 'available',
          progress: 0
        },
        {
          id: 'cloud-2',
          title: 'AWS Core Services',
          description: 'Master essential AWS services: EC2, S3, RDS, VPC, and more - the most popular cloud platform',
          duration: '6-8 weeks',
          difficulty: 'intermediate',
          prerequisites: ['Cloud Computing Fundamentals'],
          skills: ['EC2', 'S3', 'RDS', 'VPC', 'IAM', 'Lambda', 'CloudWatch', 'Route53'],
          detailedSteps: [
            'Week 1-2: EC2 fundamentals (instances, AMIs, security groups, key pairs, ELB)',
            'Week 3: S3 storage and data management (buckets, objects, lifecycle policies, CDN)',
            'Week 4: VPC networking (subnets, route tables, NAT gateways, VPN, Direct Connect)',
            'Week 5: RDS databases (MySQL, PostgreSQL, Aurora, backups, read replicas)',
            'Week 6: IAM and security (users, roles, policies, MFA, AWS Organizations)',
            'Week 7: Lambda serverless computing (functions, triggers, API Gateway integration)',
            'Week 8: Monitoring and DNS (CloudWatch, Route53, CloudTrail, AWS Config)'
          ],
          resources: [
            { type: 'youtube', title: 'AWS Full Course', url: 'https://www.youtube.com/watch?v=c3Cn4xYfxJY', provider: 'freeCodeCamp', id: 'aws-youtube-1' },
            { type: 'youtube', title: 'AWS EC2 Tutorial', url: 'https://www.youtube.com/watch?v=tSqgu4mdX4U', provider: 'TechWorld with Nana', id: 'aws-youtube-2' },
            { type: 'youtube', title: 'AWS S3 Tutorial', url: 'https://www.youtube.com/watch?v=IVaJh31l4JA', provider: 'TechWorld with Nana', id: 'aws-youtube-3' },
            { type: 'course', title: 'AWS Solutions Architect', url: 'https://www.udemy.com/course/aws-certified-solutions-architect-associate/', provider: 'Udemy', id: 'aws-course' },
            { type: 'documentation', title: 'AWS Documentation', url: 'https://docs.aws.amazon.com/', provider: 'AWS', id: 'aws-docs' },
            { type: 'certification', title: 'AWS SAA-C03 Prep', url: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/', provider: 'AWS', id: 'aws-saa-cert' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'cloud-3',
          title: 'Azure Fundamentals',
          description: 'Learn Microsoft Azure platform and core services - the enterprise cloud solution',
          duration: '4-6 weeks',
          difficulty: 'intermediate',
          prerequisites: ['AWS Core Services'],
          skills: ['Azure Portal', 'Virtual Machines', 'Storage', 'Networking', 'Azure AD', 'App Services', 'Functions'],
          detailedSteps: [
            'Week 1: Azure portal and basics (subscriptions, resource groups, Azure CLI, PowerShell)',
            'Week 2: Azure Virtual Machines and compute (VMs, VM scale sets, availability sets)',
            'Week 3: Azure Storage and databases (Blob storage, Azure SQL, Cosmos DB)',
            'Week 4: Azure networking (VNet, subnets, load balancers, application gateway)',
            'Week 5: Azure AD and identity (users, groups, RBAC, MFA, conditional access)',
            'Week 6: Azure PaaS services (App Services, Azure Functions, Logic Apps)'
          ],
          resources: [
            { type: 'youtube', title: 'Azure Full Course', url: 'https://www.youtube.com/watch?v=tDuruX7XSac', provider: 'Edureka', id: 'azure-youtube-1' },
            { type: 'youtube', title: 'Azure Fundamentals', url: 'https://www.youtube.com/watch?v=5abffC-K40c', provider: 'Microsoft Azure', id: 'azure-youtube-2' },
            { type: 'youtube', title: 'Azure Tutorial', url: 'https://www.youtube.com/watch?v=-pX5PjIYTJs', provider: 'Andrew Brown', id: 'azure-youtube-3' },
            { type: 'course', title: 'Azure Fundamentals', url: 'https://learn.microsoft.com/en-us/training/paths/microsoft-azure-fundamentals-describe-cloud-concepts/', provider: 'Microsoft Learn', id: 'azure-course' },
            { type: 'documentation', title: 'Azure Docs', url: 'https://docs.microsoft.com/azure/', provider: 'Microsoft', id: 'azure-docs' },
            { type: 'certification', title: 'AZ-900 Prep', url: 'https://learn.microsoft.com/en-us/certifications/exams/az-900/', provider: 'Microsoft', id: 'az-900-cert' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'cloud-4',
          title: 'Google Cloud Platform',
          description: 'Master GCP services and architecture - the data and AI-focused cloud platform',
          duration: '4-6 weeks',
          difficulty: 'intermediate',
          prerequisites: ['Azure Fundamentals'],
          skills: ['Compute Engine', 'Cloud Storage', 'BigQuery', 'GKE', 'Cloud Functions', 'Pub/Sub', 'Cloud Run'],
          detailedSteps: [
            'Week 1: GCP fundamentals and Compute Engine (projects, billing, IAM, VMs)',
            'Week 2: Cloud Storage and databases (Cloud Storage, Cloud SQL, Bigtable, Firestore)',
            'Week 3: BigQuery and data analytics (SQL, data warehousing, ML integration)',
            'Week 4: Google Kubernetes Engine (GKE clusters, autopilot, node pools)',
            'Week 5: Cloud Functions and serverless (triggers, event-driven architecture)',
            'Week 6: Advanced GCP services (Pub/Sub, Cloud Run, Cloud Tasks, API Gateway)'
          ],
          resources: [
            { type: 'youtube', title: 'GCP Full Course', url: 'https://www.youtube.com/watch?v=dQWAxz9c-LM', provider: 'FreeCodeCamp', id: 'gcp-youtube-1' },
            { type: 'youtube', title: 'GCP Fundamentals', url: 'https://www.youtube.com/watch?v=3E0jVQ5n0-w', provider: 'Google Cloud Tech', id: 'gcp-youtube-2' },
            { type: 'youtube', title: 'GKE Tutorial', url: 'https://www.youtube.com/watch?v=pT4KnMhF6NQ', provider: 'Google Cloud Tech', id: 'gcp-youtube-3' },
            { type: 'course', title: 'GCP Fundamentals', url: 'https://www.coursera.org/professional-certificates/google-cloud-digital-leader', provider: 'Coursera', id: 'gcp-course' },
            { type: 'documentation', title: 'GCP Documentation', url: 'https://cloud.google.com/docs', provider: 'Google', id: 'gcp-docs' },
            { type: 'certification', title: 'Associate Cloud Engineer', url: 'https://cloud.google.com/certification/cloud-engineer', provider: 'Google', id: 'gcp-ace-cert' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'cloud-5',
          title: 'Cloud Architecture & Design',
          description: 'Design scalable and resilient cloud architectures - become a cloud solutions architect',
          duration: '4-5 weeks',
          difficulty: 'advanced',
          prerequisites: ['Google Cloud Platform'],
          skills: ['Architecture Patterns', 'High Availability', 'Scalability', 'Cost Optimization', 'Disaster Recovery', 'Migration Strategies'],
          detailedSteps: [
            'Week 1: Well-Architected Framework (operational excellence, security, reliability)',
            'Week 2: High availability and scalability (load balancing, auto-scaling, CDN)',
            'Week 3: Cost optimization and governance (pricing models, cost monitoring, budgeting)',
            'Week 4: Disaster recovery and backup strategies (RTO/RPO, multi-region, backup policies)',
            'Week 5: Cloud migration strategies (rehost, replatform, refactor, rearchitect)'
          ],
          resources: [
            { type: 'youtube', title: 'Cloud Architecture Patterns', url: 'https://www.youtube.com/watch?v=9x0fFyV0A_0', provider: 'Microsoft Azure', id: 'arch-youtube-1' },
            { type: 'youtube', title: 'Well-Architected Framework', url: 'https://www.youtube.com/watch?v=3cZkx4nA6Lw', provider: 'AWS', id: 'arch-youtube-2' },
            { type: 'youtube', title: 'Cloud Cost Optimization', url: 'https://www.youtube.com/watch?v=vQpF_5vz3Zg', provider: 'Cloud Academy', id: 'arch-youtube-3' },
            { type: 'course', title: 'Cloud Architecture', url: 'https://www.coursera.org/learn/google-cloud-architecture', provider: 'Coursera', id: 'arch-course' },
            { type: 'documentation', title: 'Well-Architected Framework', url: 'https://aws.amazon.com/architecture/well-architected/', provider: 'AWS', id: 'arch-docs' },
            { type: 'project', title: 'Design Cloud Solutions', url: 'https://aws.amazon.com/architecture/', provider: 'AWS', id: 'arch-project' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'cloud-6',
          title: 'Cloud Security & Compliance',
          description: 'Implement security best practices and compliance in cloud environments - secure your cloud infrastructure',
          duration: '3-4 weeks',
          difficulty: 'advanced',
          prerequisites: ['Cloud Architecture & Design'],
          skills: ['Cloud Security', 'IAM', 'Compliance', 'Data Protection', 'Encryption', 'Network Security'],
          detailedSteps: [
            'Week 1: Cloud security fundamentals (shared responsibility model, IAM, security policies)',
            'Week 2: Network security and encryption (VPC security, SSL/TLS, KMS, Secrets Manager)',
            'Week 3: Compliance and governance (SOC2, HIPAA, GDPR, PCI-DSS, AWS Artifact)',
            'Week 4: Security monitoring and incident response (CloudTrail, GuardDuty, Security Hub)'
          ],
          resources: [
            { type: 'youtube', title: 'Cloud Security Fundamentals', url: 'https://www.youtube.com/watch?v=7XuLX3FgV9o', provider: 'Cloud Security Alliance', id: 'security-youtube-1' },
            { type: 'youtube', title: 'AWS Security', url: 'https://www.youtube.com/watch?v=KgsFFI3PD3Y', provider: 'TechWorld with Nana', id: 'security-youtube-2' },
            { type: 'youtube', title: 'Cloud Compliance', url: 'https://www.youtube.com/watch?v=ZT-2F7cK2yI', provider: 'Microsoft Azure', id: 'security-youtube-3' },
            { type: 'course', title: 'Cloud Security', url: 'https://www.udemy.com/course/aws-security-fundamentals/', provider: 'Udemy', id: 'security-course' },
            { type: 'documentation', title: 'Security Best Practices', url: 'https://docs.aws.amazon.com/security/', provider: 'AWS', id: 'security-docs' },
            { type: 'certification', title: 'Security Specialty', url: 'https://aws.amazon.com/certification/security-specialty/', provider: 'AWS', id: 'security-cert' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'cloud-7',
          title: 'Multi-Cloud & Hybrid Cloud',
          description: 'Manage multi-cloud and hybrid cloud environments - optimize across cloud providers',
          duration: '4-5 weeks',
          difficulty: 'advanced',
          prerequisites: ['Cloud Security & Compliance'],
          skills: ['Multi-Cloud', 'Hybrid Cloud', 'Cloud Migration', 'Interoperability', 'Service Mesh', 'API Gateway'],
          detailedSteps: [
            'Week 1: Multi-cloud strategies and use cases (when to use multi-cloud, vendor lock-in)',
            'Week 2: Hybrid cloud architecture (on-prem to cloud, direct connect, VPN)',
            'Week 3: Cloud migration approaches (rehost, replatform, refactor, rearchitect)',
            'Week 4: Multi-cloud management tools (Terraform Cloud, Ansible, Service Mesh)',
            'Week 5: API gateway and service mesh for multi-cloud (Kong, Istio, Ambassador)'
          ],
          resources: [
            { type: 'youtube', title: 'Multi-Cloud Strategy', url: 'https://www.youtube.com/watch?v=TzJ5f0x3oK0', provider: 'Gartner', id: 'multi-youtube-1' },
            { type: 'youtube', title: 'Hybrid Cloud Tutorial', url: 'https://www.youtube.com/watch?v=Y7s5f3x0LzA', provider: 'Microsoft Azure', id: 'multi-youtube-2' },
            { type: 'youtube', title: 'Cloud Migration Guide', url: 'https://www.youtube.com/watch?v=2Z8z0fP3j0k', provider: 'AWS', id: 'multi-youtube-3' },
            { type: 'course', title: 'Multi-Cloud Strategy', url: 'https://www.coursera.org/learn/multi-cloud', provider: 'Coursera', id: 'multi-course' },
            { type: 'documentation', title: 'Hybrid Cloud Guide', url: 'https://azure.microsoft.com/solutions/hybrid-cloud-app/', provider: 'Microsoft', id: 'multi-docs' },
            { type: 'project', title: 'Multi-Cloud Setup', url: 'https://github.com/terraform-providers/terraform-provider-azurerm', provider: 'GitHub Projects', id: 'multi-project' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'cloud-8',
          title: 'Cloud DevOps & Automation',
          description: 'Automate cloud operations and implement DevOps in cloud - combine DevOps with cloud expertise',
          duration: '4-6 weeks',
          difficulty: 'advanced',
          prerequisites: ['Multi-Cloud & Hybrid Cloud'],
          skills: ['Cloud DevOps', 'Infrastructure as Code', 'Automation', 'CI/CD in Cloud', 'GitOps', 'Serverless'],
          detailedSteps: [
            'Week 1: Cloud-native DevOps practices (cloud-specific CI/CD, managed services)',
            'Week 2: Infrastructure as Code for cloud (Terraform Cloud, CloudFormation, ARM templates)',
            'Week 3: GitOps and continuous delivery (ArgoCD, Flux, GitLab CI/CD)',
            'Week 4: Serverless DevOps (Lambda functions, Azure Functions, Cloud Functions)',
            'Week 5: Cloud automation scripting (AWS SDK, Azure CLI, gcloud, PowerShell)',
            'Week 6: Cloud DevOps capstone project (end-to-end automation solution)'
          ],
          resources: [
            { type: 'youtube', title: 'Cloud DevOps Tutorial', url: 'https://www.youtube.com/watch?v=7K4qixE3V2E', provider: 'TechWorld with Nana', id: 'clouddevops-youtube-1' },
            { type: 'youtube', title: 'GitOps Explained', url: 'https://www.youtube.com/watch?v=W5B6fF5Dz3g', provider: 'Codefresh', id: 'clouddevops-youtube-2' },
            { type: 'youtube', title: 'Serverless DevOps', url: 'https://www.youtube.com/watch?v=X7s2e3w6y1c', provider: 'AWS', id: 'clouddevops-youtube-3' },
            { type: 'course', title: 'Cloud DevOps', url: 'https://www.udemy.com/course/aws-devops/', provider: 'Udemy', id: 'clouddevops-course' },
            { type: 'documentation', title: 'DevOps Best Practices', url: 'https://aws.amazon.com/devops/', provider: 'AWS', id: 'clouddevops-docs' },
            { type: 'project', title: 'Cloud Automation Project', url: 'https://github.com/aws/aws-cdk', provider: 'GitHub Projects', id: 'clouddevops-project' }
          ],
          status: 'locked',
          progress: 0
        }
      ]
    }
  ]

  useEffect(() => {
    setPaths(roadmapPaths)
    setLoading(false)
  }, [])

  const getStatusColor = (status: RoadmapStep['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white'
      case 'in-progress': return 'bg-blue-500 text-white'
      case 'available': return 'bg-yellow-500 text-white'
      case 'locked': return 'bg-gray-400 text-white'
      default: return 'bg-gray-400 text-white'
    }
  }

  const getDifficultyColor = (difficulty: RoadmapStep['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getResourceIcon = (type: RoadmapStep['resources'][0]['type']) => {
    switch (type) {
      case 'course': return BookOpen
      case 'documentation': return FileText
      case 'tutorial': return Code
      case 'project': return Target
      case 'certification': return Award
      case 'youtube': return Youtube
      default: return BookOpen
    }
  }

  const currentPath = paths.find(p => p.id === selectedPath)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-4">
            <span className="text-gradient animated-gradient">DevOps & Cloud Roadmap</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Your AI-powered learning path to becoming a DevOps or Cloud Engineer
          </p>
        </div>

        {/* Path Selection */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paths.map((path) => {
              const Icon = path.icon
              return (
                <button
                  key={path.id}
                  onClick={() => setSelectedPath(path.id)}
                  className={`p-8 rounded-2xl border-2 transition-all duration-300 ${
                    selectedPath === path.id
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-xl'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${path.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="ml-4 text-left">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{path.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{path.totalDuration}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-left mb-4">{path.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getDifficultyColor(path.difficulty)}`}>
                      {path.difficulty.toUpperCase()}
                    </span>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Target className="w-4 h-4 mr-1" />
                      {path.steps.length} Steps
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Roadmap Steps */}
        {currentPath && (
          <div className="space-y-8">
            {/* Progress Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Your Progress - {currentPath.name}
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {currentPath.steps.filter(s => s.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {currentPath.steps.filter(s => s.status === 'in-progress').length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                      {currentPath.steps.filter(s => s.status === 'locked').length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Locked</div>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(currentPath.steps.filter(s => s.status === 'completed').length / currentPath.steps.length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Steps Timeline */}
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>
              
              {currentPath.steps.map((step, index) => (
                <div key={step.id} className="relative flex items-start mb-12">
                  {/* Step Circle */}
                  <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-white dark:bg-gray-800 rounded-full border-4 border-gray-300 dark:border-gray-600 shadow-lg">
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    ) : step.status === 'in-progress' ? (
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <PlayCircle className="w-5 h-5 text-white" />
                      </div>
                    ) : step.status === 'locked' ? (
                      <Lock className="w-6 h-6 text-gray-400" />
                    ) : (
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="ml-8 flex-1">
                    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 p-8 ${
                      step.status === 'locked' ? 'border-gray-300 dark:border-gray-600 opacity-75' : 'border-gray-200 dark:border-gray-700'
                    }`}>
                      {/* Step Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {step.title}
                          </h3>
                          <div className="flex items-center space-x-4">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getDifficultyColor(step.difficulty)}`}>
                              {step.difficulty.toUpperCase()}
                            </span>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(step.status)}`}>
                              {step.status.replace('-', ' ').toUpperCase()}
                            </span>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Clock className="w-4 h-4 mr-1" />
                              {step.duration}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Step {index + 1} of {currentPath.steps.length}</div>
                          {step.progress > 0 && (
                            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                                style={{ width: `${step.progress}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                        {step.description}
                      </p>

                      {/* Skills */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Skills You'll Learn</h4>
                        <div className="flex flex-wrap gap-2">
                          {step.skills.map((skill, skillIndex) => (
                            <span key={skillIndex} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Detailed Steps */}
                      {expandedStep === step.id && step.detailedSteps && step.detailedSteps.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Learning Path (Bit-by-Bit)</h4>
                          <div className="space-y-2">
                            {step.detailedSteps.map((detailedStep, stepIndex) => (
                              <div key={stepIndex} className="flex items-start p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full text-xs font-bold mr-3 mt-0.5">
                                  {stepIndex + 1}
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{detailedStep}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Prerequisites */}
                      {step.prerequisites.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Prerequisites</h4>
                          <div className="flex flex-wrap gap-2">
                            {step.prerequisites.map((prereq, prereqIndex) => (
                              <span key={prereqIndex} className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800 text-sm">
                                {prereq}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resources */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Learning Resources</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {step.resources.map((resource, resourceIndex) => {
                            const ResourceIcon = getResourceIcon(resource.type)
                            const isYouTube = resource.type === 'youtube'
                            return (
                              <a
                                key={resourceIndex}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left group"
                              >
                                <div className="flex items-center mb-2">
                                  <ResourceIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                                  <span className={`text-xs font-semibold uppercase ${isYouTube ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                    {resource.type}
                                  </span>
                                  {isYouTube && <Youtube className="w-4 h-4 text-red-600 dark:text-red-400 ml-1" />}
                                </div>
                                <h5 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {resource.title}
                                </h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                  {resource.provider}
                                  <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </p>
                              </a>
                            )
                          })}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {step.status === 'available' && (
                            <button 
                              onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                              className="btn-primary"
                            >
                              <PlayCircle className="w-4 h-4 mr-2" />
                              Start Learning
                            </button>
                          )}
                          {step.status === 'in-progress' && (
                            <button 
                              onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                              className="btn-primary"
                            >
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Continue Learning
                            </button>
                          )}
                          {step.status === 'completed' && (
                            <button 
                              onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                              className="btn-secondary"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Review & Practice
                            </button>
                          )}
                        </div>
                        {step.status !== 'locked' && (
                          <button 
                            onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                          >
                            {expandedStep === step.id ? 'Hide Details ↓' : 'View Details →'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        <div className="mt-16 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white ml-4">
              AI-Powered Recommendations
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Personalized Path</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Based on your current skills and learning pace, we recommend focusing on containerization fundamentals first.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Learning Schedule</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Dedicate 10-15 hours per week to complete the DevOps roadmap in 6 months.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Next Steps</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Complete Linux Fundamentals to unlock 3 more learning modules.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Roadmap
