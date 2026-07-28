const mongoose = require('mongoose');
const DevOpsDoc = require('./models/DevOpsDoc');
require('dotenv').config();

const errorDocs = [
  {
    technology: 'Docker',
    title: 'Docker Container Exit Code 137',
    description: 'Container killed with exit code 137 due to OOM (Out of Memory)',
    content: `# Docker Exit Code 137 - OOM Killer

## Problem
Container exits with code 137, indicating it was killed by the OOM killer.

## Symptoms
- Container stops unexpectedly
- Exit code 137 in docker logs
- High memory usage before crash
- Application becomes unresponsive

## Root Cause
The container exceeded its memory limit or the host ran out of available memory, causing the Linux kernel OOM killer to terminate the process.

## Solution

### 1. Check Memory Usage
\`\`\`bash
docker stats
docker inspect <container-id> --format='{{.HostConfig.Memory}}'
\`\`\`

### 2. Increase Memory Limit
\`\`\`bash
docker run -m 2g --memory-swap 2g your-image
\`\`\`

### 3. Optimize Application
- Reduce memory footprint
- Implement memory caching
- Use efficient data structures
- Monitor memory leaks

### 4. Docker Compose Configuration
\`\`\`yaml
services:
  app:
    image: your-image
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
\`\`\`

### 5. Host Level Solutions
- Add more RAM to host
- Use memory-optimized instances
- Implement horizontal scaling

## Prevention
- Set appropriate memory limits
- Monitor memory usage continuously
- Implement health checks
- Use memory profiling tools

## References
- Docker Documentation: https://docs.docker.com/config/containers/resource_constraints/
- Linux OOM Killer: https://www.kernel.org/doc/Documentation/sysctl/vm.txt`,
    category: 'containerization',
    version: '1.0.0',
    tags: ['docker', 'oom', 'memory', 'exit-code'],
    difficulty: 'intermediate',
    estimatedTime: '20 minutes',
    prerequisites: ['Docker installed', 'Basic Linux knowledge'],
    author: 'Admin',
    isActive: true,
    errorType: 'runtime',
    symptoms: ['Container exits with code 137', 'High memory usage', 'Unexpected container termination'],
    rootCause: 'Container exceeded memory limits or host ran out of memory',
    solution: 'Increase memory limits, optimize application, add more host RAM',
    references: ['https://docs.docker.com/config/containers/resource_constraints/'],
    severity: 'high',
    affectedComponents: ['Docker containers', 'Application runtime'],
    isErrorDoc: true
  },
  {
    technology: 'Kubernetes',
    title: 'Pod CrashLoopBackOff Error',
    description: 'Pod repeatedly crashes and enters CrashLoopBackOff state',
    content: `# Kubernetes CrashLoopBackOff Error

## Problem
Pod enters CrashLoopBackOff state, indicating it keeps crashing after restart attempts.

## Symptoms
- Pod status shows CrashLoopBackOff
- Container repeatedly restarts
- Application logs show errors
- Pod never reaches Ready state

## Root Cause
Application crashes immediately after starting due to:
- Missing environment variables
- Incorrect configuration
- Failed health checks
- Missing dependencies
- Database connection failures

## Solution

### 1. Check Pod Logs
\`\`\`bash
kubectl logs <pod-name> --previous
kubectl describe pod <pod-name>
\`\`\`

### 2. Check Events
\`\`\`bash
kubectl get events --sort-by=.metadata.creationTimestamp
\`\`\`

### 3. Verify Configuration
\`\`\`bash
kubectl get pod <pod-name> -o yaml
\`\`\`

### 4. Common Fixes

#### Missing Environment Variables
\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: app-image
    env:
    - name: DATABASE_URL
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: url
\`\`\`

#### Liveness Probe Issues
\`\`\`yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
\`\`\`

#### Resource Limits
\`\`\`yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
\`\`\`

### 5. Debug with Exec
\`\`\`bash
kubectl exec -it <pod-name> -- /bin/sh
\`\`\`

## Prevention
- Implement proper health checks
- Use init containers for dependencies
- Add startup probes
- Monitor resource usage
- Implement proper error handling

## References
- Kubernetes Documentation: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/
- Debug Pods: https://kubernetes.io/docs/tasks/debug/debug-application/`,
    category: 'orchestration',
    version: '1.0.0',
    tags: ['kubernetes', 'pods', 'crashloopbackoff', 'debugging'],
    difficulty: 'intermediate',
    estimatedTime: '30 minutes',
    prerequisites: ['kubectl installed', 'Kubernetes cluster access'],
    author: 'Admin',
    isActive: true,
    errorType: 'runtime',
    symptoms: ['Pod in CrashLoopBackOff state', 'Repeated container restarts', 'Pod never ready'],
    rootCause: 'Application crashes due to misconfiguration, missing dependencies, or failed health checks',
    solution: 'Check logs, verify configuration, fix environment variables, adjust health checks',
    references: ['https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/'],
    severity: 'high',
    affectedComponents: ['Kubernetes pods', 'Application deployment'],
    isErrorDoc: true
  },
  {
    technology: 'Jenkins',
    title: 'Jenkins Build Fails - Permission Denied',
    description: 'Jenkins build fails with permission denied errors on workspace or files',
    content: `# Jenkins Permission Denied Error

## Problem
Jenkins build fails with "Permission denied" errors when accessing workspace or executing commands.

## Symptoms
- Build fails with permission errors
- Unable to write to workspace
- Script execution fails
- File access denied

## Root Cause
Jenkins user lacks proper permissions on workspace directories or executable files.

## Solution

### 1. Check Jenkins User
\`\`\`bash
ps aux | grep jenkins
whoami
\`\`\`

### 2. Fix Workspace Permissions
\`\`\`bash
sudo chown -R jenkins:jenkins /var/lib/jenkins
sudo chmod -R 755 /var/lib/jenkins
\`\`\`

### 3. Fix Build Directory Permissions
\`\`\`bash
sudo chown -R jenkins:jenkins /path/to/build/directory
sudo chmod -R 755 /path/to/build/directory
\`\`\`

### 4. Add Jenkins to Required Groups
\`\`\`bash
sudo usermod -aG docker jenkins
sudo usermod -aG sudo jenkins
\`\`\`

### 5. Configure Jenkins Security
- Go to Manage Jenkins → Configure Global Security
- Set appropriate authorization strategy
- Configure project-based security

### 6. Use Proper Build Scripts
\`\`\`bash
#!/bin/bash
set -e
cd /path/to/project
npm install
npm test
\`\`\`

### 7. Docker-in-Docker Permissions
\`\`\`bash
sudo usermod -aG docker jenkins
newgrp docker
\`\`\`

## Prevention
- Use proper file permissions from start
- Implement least privilege principle
- Use containerized builds
- Regular permission audits
- Document permission requirements

## References
- Jenkins Security: https://www.jenkins.io/doc/book/security/
- Linux Permissions: https://linux.die.net/man/1/chmod`,
    category: 'cicd',
    version: '1.0.0',
    tags: ['jenkins', 'permissions', 'build-failure', 'security'],
    difficulty: 'beginner',
    estimatedTime: '15 minutes',
    prerequisites: ['Jenkins installed', 'Linux system access'],
    author: 'Admin',
    isActive: true,
    errorType: 'security',
    symptoms: ['Permission denied errors', 'Build failures', 'File access issues'],
    rootCause: 'Jenkins user lacks proper permissions on workspace and build directories',
    solution: 'Fix file ownership, add Jenkins to required groups, configure security settings',
    references: ['https://www.jenkins.io/doc/book/security/'],
    severity: 'medium',
    affectedComponents: ['Jenkins workspace', 'Build execution', 'File system'],
    isErrorDoc: true
  },
  {
    technology: 'Terraform',
    title: 'Terraform State Lock Error',
    description: 'Terraform fails with state lock error when multiple users try to apply changes',
    content: `# Terraform State Lock Error

## Problem
Terraform fails with "Error: Error locking state" when multiple users or processes try to apply changes simultaneously.

## Symptoms
- Error locking state message
- Terraform apply fails
- State file locked by another process
- Unable to run terraform commands

## Root Cause
State file is locked by another Terraform process or user, preventing concurrent modifications.

## Solution

### 1. Check Current Lock
\`\`\`bash
terraform force-unlock <LOCK_ID>
\`\`\`

### 2. Use Remote State with Proper Locking
\`\`\`hcl
terraform {
  backend "s3" {
    bucket         = "terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
\`\`\`

### 3. Configure DynamoDB Lock Table
\`\`\`bash
aws dynamodb create-table \\
  --table-name terraform-locks \\
  --attribute-definitions AttributeName=LockID,AttributeType=S \\
  --key-schema AttributeName=LockID,KeyType=HASH \\
  --billing-mode PAY_PER_REQUEST
\`\`\`

### 4. Use Terraform Cloud/Enterprise
- Built-in state locking
- Collaboration features
- State history

### 5. Manual State Management
\`\`\`bash
# Check who holds the lock
terraform state pull

# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
\`\`\`

### 6. Implement Workspaces
\`\`\`bash
terraform workspace new dev
terraform workspace new prod
terraform workspace list
\`\`\`

## Prevention
- Use remote state backend
- Implement proper locking mechanism
- Use workspaces for environments
- Coordinate team access
- Implement CI/CD for Terraform

## References
- Terraform State: https://www.terraform.io/docs/language/state/
- State Locking: https://www.terraform.io/docs/language/state/locking.html`,
    category: 'iac',
    version: '1.0.0',
    tags: ['terraform', 'state-lock', 'concurrency', 'remote-state'],
    difficulty: 'intermediate',
    estimatedTime: '25 minutes',
    prerequisites: ['Terraform installed', 'AWS account (for S3 backend)'],
    author: 'Admin',
    isActive: true,
    errorType: 'configuration',
    symptoms: ['Error locking state', 'Concurrent modification conflicts', 'Apply failures'],
    rootCause: 'State file locked by another process or user',
    solution: 'Use remote state with DynamoDB locking, force unlock when needed, implement workspaces',
    references: ['https://www.terraform.io/docs/language/state/locking.html'],
    severity: 'medium',
    affectedComponents: ['Terraform state', 'Team collaboration', 'Infrastructure deployment'],
    isErrorDoc: true
  },
  {
    technology: 'Git',
    title: 'Git Merge Conflict Resolution',
    description: 'Git merge conflicts prevent merging branches with conflicting changes',
    content: `# Git Merge Conflict Resolution

## Problem
Git merge conflicts occur when branches have conflicting changes that cannot be automatically merged.

## Symptoms
- "CONFLICT (content)" message
- Files marked with conflict markers
- Merge process stops
- Cannot complete merge

## Root Cause
Two branches have modified the same lines in a file, or one branch deleted a file that the other modified.

## Solution

### 1. Identify Conflicts
\`\`\`bash
git status
git diff --name-only --diff-filter=U
\`\`\`

### 2. View Conflicts
\`\`\`bash
git diff
git checkout --conflict=merge <file>
\`\`\`

### 3. Manual Resolution
\`\`\`
<<<<<<< HEAD
Your changes
=======
Their changes
>>>>>>> branch-name
\`\`\`

Edit the file to keep desired changes and remove conflict markers.

### 4. Mark as Resolved
\`\`\`bash
git add <resolved-file>
\`\`\`

### 5. Complete Merge
\`\`\`bash
git commit
\`\`\`

### 6. Use Merge Tools
\`\`\`bash
git mergetool
git config --global merge.tool vimdiff
\`\`\`

### 7. Abort Merge (if needed)
\`\`\`bash
git merge --abort
\`\`\`

### 8. Rebase Instead of Merge
\`\`\`bash
git checkout feature-branch
git rebase main
\`\`\`

## Prevention
- Keep branches short-lived
- Communicate with team
- Use feature flags
- Regular merges to main
- Code reviews before merge

## Best Practices
- Pull latest changes before starting work
- Use meaningful commit messages
- Review changes before merging
- Use pull requests for collaboration
- Implement CI/CD checks

## References
- Git Documentation: https://git-scm.com/docs/git-merge
- Conflict Resolution: https://git-scm.com/docs/git-merge#_resolving_conflicts`,
    category: 'other',
    version: '1.0.0',
    tags: ['git', 'merge-conflict', 'version-control', 'collaboration'],
    difficulty: 'beginner',
    estimatedTime: '20 minutes',
    prerequisites: ['Git installed', 'Basic Git knowledge'],
    author: 'Admin',
    isActive: true,
    errorType: 'configuration',
    symptoms: ['Merge conflict markers', 'Merge process stops', 'Cannot complete merge'],
    rootCause: 'Conflicting changes in same file lines between branches',
    solution: 'Manually resolve conflicts, use merge tools, or rebase instead of merge',
    references: ['https://git-scm.com/docs/git-merge'],
    severity: 'low',
    affectedComponents: ['Git workflow', 'Branch management', 'Code collaboration'],
    isErrorDoc: true
  },
  {
    technology: 'Nginx',
    title: 'Nginx 502 Bad Gateway Error',
    description: 'Nginx returns 502 Bad Gateway when upstream server is unavailable or misconfigured',
    content: `# Nginx 502 Bad Gateway Error

## Problem
Nginx returns 502 Bad Gateway error when trying to proxy requests to an upstream server.

## Symptoms
- 502 Bad Gateway error in browser
- Nginx error logs show upstream connection failures
- Website becomes inaccessible
- Intermittent or persistent errors

## Root Cause
Upstream server is down, misconfigured, or refusing connections.

## Solution

### 1. Check Nginx Error Logs
\`\`\`bash
tail -f /var/log/nginx/error.log
\`\`\`

### 2. Verify Upstream Server Status
\`\`\`bash
curl http://localhost:3000
systemctl status your-app-service
\`\`\`

### 3. Check Nginx Configuration
\`\`\`nginx
upstream backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001 backup;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
\`\`\`

### 4. Fix Common Issues

#### Wrong Port
\`\`\`nginx
proxy_pass http://127.0.0.1:correct_port;
\`\`\`

#### Timeout Settings
\`\`\`nginx
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
\`\`\`

#### Buffer Size
\`\`\`nginx
proxy_buffer_size 128k;
proxy_buffers 4 256k;
proxy_busy_buffers_size 256k;
\`\`\`

### 5. Restart Services
\`\`\`bash
sudo systemctl restart nginx
sudo systemctl restart your-app
\`\`\`

### 6. Check Firewall
\`\`\`bash
sudo ufw status
sudo ufw allow 3000/tcp
\`\`\`

## Prevention
- Implement health checks
- Use load balancing
- Monitor upstream servers
- Set appropriate timeouts
- Implement retry logic

## References
- Nginx Documentation: https://nginx.org/en/docs/http/ngx_http_proxy_module.html
- Debugging Nginx: https://nginx.org/en/docs/debugging_log.html`,
    category: 'other',
    version: '1.0.0',
    tags: ['nginx', '502-error', 'reverse-proxy', 'upstream'],
    difficulty: 'intermediate',
    estimatedTime: '20 minutes',
    prerequisites: ['Nginx installed', 'Upstream application running'],
    author: 'Admin',
    isActive: true,
    errorType: 'network',
    symptoms: ['502 Bad Gateway error', 'Upstream connection failures', 'Website inaccessible'],
    rootCause: 'Upstream server down, misconfigured, or refusing connections',
    solution: 'Check logs, verify upstream status, fix configuration, adjust timeouts',
    references: ['https://nginx.org/en/docs/http/ngx_http_proxy_module.html'],
    severity: 'high',
    affectedComponents: ['Nginx proxy', 'Upstream servers', 'Application availability'],
    isErrorDoc: true
  },
  {
    technology: 'Docker',
    title: 'Docker Image Pull Access Denied',
    description: 'Docker fails to pull images from registry due to authentication or permission issues',
    content: `# Docker Image Pull Access Denied

## Problem
Docker fails to pull images with "access denied" or "no permission" errors.

## Symptoms
- "denied: access denied" error
- "no basic auth credentials" error
- Unable to pull private images
- Pull command fails

## Root Cause
Missing or invalid authentication credentials for private registry.

## Solution

### 1. Login to Registry
\`\`\`bash
docker login registry.example.com
docker login
\`\`\`

### 2. Check Docker Credentials
\`\`\`bash
cat ~/.docker/config.json
\`\`\`

### 3. Use Credential Helper
\`\`\`bash
docker-credential-osxkeychain get
docker-credential-secretservice get
\`\`\`

### 4. Configure in Docker Compose
\`\`\`yaml
services:
  app:
    image: registry.example.com/private-image:latest
\`\`\`

### 5. Use CI/CD Secrets
\`\`\`yaml
# GitHub Actions
- name: Login to Docker Hub
  uses: docker/login-action@v2
  with:
    username: \${{ secrets.DOCKER_USERNAME }}
    password: \${{ secrets.DOCKER_PASSWORD }}
\`\`\`

### 6. Kubernetes Image Pull Secrets
\`\`\`bash
kubectl create secret docker-registry regcred \\
  --docker-server=registry.example.com \\
  --docker-username=user \\
  --docker-password=password \\
  --docker-email=user@example.com
\`\`\`

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: private-pod
spec:
  containers:
  - name: app
    image: registry.example.com/private-image
  imagePullSecrets:
  - name: regcred
\`\`\`

### 7. Check Registry Permissions
- Verify user has pull access
- Check repository visibility
- Verify token permissions

## Prevention
- Use service accounts for automation
- Rotate credentials regularly
- Use private registries with proper ACLs
- Implement credential management
- Use short-lived tokens

## References
- Docker Authentication: https://docs.docker.com/engine/reference/commandline/login/
- Kubernetes Image Secrets: https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-image/`,
    category: 'containerization',
    version: '1.0.0',
    tags: ['docker', 'authentication', 'registry', 'access-denied'],
    difficulty: 'beginner',
    estimatedTime: '15 minutes',
    prerequisites: ['Docker installed', 'Registry account'],
    author: 'Admin',
    isActive: true,
    errorType: 'security',
    symptoms: ['Access denied error', 'Authentication failures', 'Cannot pull images'],
    rootCause: 'Missing or invalid authentication credentials for private registry',
    solution: 'Login to registry, configure credentials, use image pull secrets',
    references: ['https://docs.docker.com/engine/reference/commandline/login/'],
    severity: 'medium',
    affectedComponents: ['Docker registry access', 'Image deployment', 'CI/CD pipelines'],
    isErrorDoc: true
  },
  {
    technology: 'Kubernetes',
    title: 'Kubernetes ImagePullBackOff Error',
    description: 'Pod stuck in ImagePullBackOff state when container image cannot be pulled',
    content: `# Kubernetes ImagePullBackOff Error

## Problem
Pod enters ImagePullBackOff state when Kubernetes cannot pull the container image.

## Symptoms
- Pod status shows ImagePullBackOff
- Container never starts
- Image pull errors in events
- Pod remains in pending state

## Root Cause
Image does not exist, authentication issues, network problems, or invalid image reference.

## Solution

### 1. Check Pod Events
\`\`\`bash
kubectl describe pod <pod-name>
kubectl get events
\`\`\`

### 2. Verify Image Exists
\`\`\`bash
docker pull <image-name>
\`\`\`

### 3. Check Image Reference
\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: registry.example.com/app:v1.0.0  # Full image reference
\`\`\`

### 4. Configure Image Pull Secrets
\`\`\`bash
kubectl create secret docker-registry regcred \\
  --docker-server=registry.example.com \\
  --docker-username=user \\
  --docker-password=password \\
  --docker-email=user@example.com
\`\`\`

\`\`\`yaml
spec:
  imagePullSecrets:
  - name: regcred
  containers:
  - name: app
    image: registry.example.com/private-image
\`\`\`

### 5. Fix Common Issues

#### Wrong Image Name
\`\`\`yaml
image: correct-registry/correct-image:correct-tag
\`\`\`

#### Network Issues
- Check DNS resolution
- Verify network policies
- Check firewall rules

#### Image Pull Policy
\`\`\`yaml
spec:
  containers:
  - name: app
    image: app-image:latest
    imagePullPolicy: Always  # or IfNotPresent, Never
\`\`\`

### 6. Use Private Registry
\`\`\`yaml
apiVersion: v1
kind: Secret
metadata:
  name: docker-config-secret
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: <base64-encoded-docker-config>
\`\`\`

## Prevention
- Use specific image tags
- Implement image pull secrets
- Monitor image availability
- Use image scanning
- Implement proper CI/CD

## References
- Kubernetes Images: https://kubernetes.io/docs/concepts/containers/images/
- Image Pull Secrets: https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-image/`,
    category: 'orchestration',
    version: '1.0.0',
    tags: ['kubernetes', 'imagepullbackoff', 'container-images', 'registry'],
    difficulty: 'intermediate',
    estimatedTime: '25 minutes',
    prerequisites: ['kubectl installed', 'Docker registry access'],
    author: 'Admin',
    isActive: true,
    errorType: 'network',
    symptoms: ['ImagePullBackOff state', 'Image pull failures', 'Pod never starts'],
    rootCause: 'Image does not exist, authentication issues, or network problems',
    solution: 'Verify image reference, configure pull secrets, check network connectivity',
    references: ['https://kubernetes.io/docs/concepts/containers/images/'],
    severity: 'high',
    affectedComponents: ['Kubernetes pods', 'Container deployment', 'Application availability'],
    isErrorDoc: true
  },
  {
    technology: 'AWS',
    title: 'AWS EC2 Instance SSH Connection Refused',
    description: 'Unable to SSH into EC2 instance due to security group or key pair issues',
    content: `# AWS EC2 SSH Connection Refused

## Problem
Unable to establish SSH connection to AWS EC2 instance.

## Symptoms
- "Connection refused" error
- "Connection timed out" error
- "Permission denied (publickey)" error
- SSH connection hangs

## Root Cause
Security group misconfiguration, wrong key pair, or instance not running.

## Solution

### 1. Check Instance Status
\`\`\`bash
aws ec2 describe-instances --instance-ids <instance-id>
\`\`\`

### 2. Verify Security Group
- Allow SSH (port 22) from your IP
- Check inbound rules
- Verify security group attachment

\`\`\`bash
aws ec2 describe-security-groups --group-ids <sg-id>
\`\`\`

### 3. Check Key Pair
\`\`\`bash
aws ec2 describe-key-pairs
\`\`\`

### 4. Connect with Correct Key
\`\`\`bash
ssh -i /path/to/key.pem ec2-user@<public-ip>
ssh -i /path/to/key.pem ubuntu@<public-ip>
ssh -i /path/to/key.pem admin@<public-ip>
\`\`\`

### 5. Fix Key Permissions
\`\`\`bash
chmod 400 key.pem
\`\`\`

### 6. Use EC2 Instance Connect
\`\`\`bash
aws ec2-instance-connect send-ssh-public-key \\
  --instance-id <instance-id> \\
  --instance-os-user ec2-user \\
  --ssh-public-key file://~/.ssh/id_rsa.pub
\`\`\`

### 7. Check System Log
\`\`\`bash
aws ec2 get-console-output --instance-id <instance-id>
\`\`\`

### 8. Troubleshoot by Instance Type

#### Amazon Linux 2
\`\`\`bash
ssh -i key.pem ec2-user@<public-ip>
\`\`\`

#### Ubuntu
\`\`\`bash
ssh -i key.pem ubuntu@<public-ip>
\`\`\`

#### Windows
- Use RDP
- Check RDP port (3389) in security group

## Prevention
- Use proper security groups
- Implement bastion host
- Use AWS Systems Manager
- Monitor instance health
- Document key pair locations

## References
- AWS EC2 Security Groups: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-groups.html
- EC2 Instance Connect: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/connect-using-ec2-instance-connect.html`,
    category: 'other',
    version: '1.0.0',
    tags: ['aws', 'ec2', 'ssh', 'security-group'],
    difficulty: 'beginner',
    estimatedTime: '20 minutes',
    prerequisites: ['AWS CLI installed', 'EC2 instance running'],
    author: 'Admin',
    isActive: true,
    errorType: 'network',
    symptoms: ['SSH connection refused', 'Connection timeout', 'Permission denied'],
    rootCause: 'Security group misconfiguration, wrong key pair, or instance not running',
    solution: 'Check security groups, verify key pair, fix key permissions, use EC2 Instance Connect',
    references: ['https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-groups.html'],
    severity: 'high',
    affectedComponents: ['EC2 instances', 'SSH access', 'Instance management'],
    isErrorDoc: true
  },
  {
    technology: 'PostgreSQL',
    title: 'PostgreSQL Connection Refused Error',
    description: 'PostgreSQL database connection refused due to configuration or network issues',
    content: `# PostgreSQL Connection Refused Error

## Problem
Applications cannot connect to PostgreSQL database with "connection refused" error.

## Symptoms
- "connection refused" error
- "could not connect to server" error
- Application unable to reach database
- Connection timeout

## Root Cause
PostgreSQL not running, wrong port, firewall blocking, or incorrect configuration.

## Solution

### 1. Check PostgreSQL Status
\`\`\`bash
sudo systemctl status postgresql
sudo service postgresql status
\`\`\`

### 2. Start PostgreSQL
\`\`\`bash
sudo systemctl start postgresql
sudo service postgresql start
\`\`\`

### 3. Check Configuration
\`\`\`bash
sudo cat /etc/postgresql/*/main/postgresql.conf | grep listen_addresses
sudo cat /etc/postgresql/*/main/postgresql.conf | grep port
\`\`\`

### 4. Update Configuration
\`\`\`
# In postgresql.conf
listen_addresses = '*'
port = 5432
\`\`\`

### 5. Configure pg_hba.conf
\`\`\`
# In pg_hba.conf
host    all             all             0.0.0.0/0            md5
host    all             all             ::/0                 md5
\`\`\`

### 6. Restart PostgreSQL
\`\`\`bash
sudo systemctl restart postgresql
\`\`\`

### 7. Check Firewall
\`\`\`bash
sudo ufw allow 5432/tcp
sudo firewall-cmd --add-port=5432/tcp --permanent
sudo firewall-cmd --reload
\`\`\`

### 8. Test Connection
\`\`\`bash
psql -h localhost -U postgres -d postgres
psql -h <server-ip> -U <username> -d <database>
\`\`\`

### 9. Check Network
\`\`\`bash
telnet <server-ip> 5432
nc -zv <server-ip> 5432
\`\`\`

### 10. Docker PostgreSQL
\`\`\`yaml
services:
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: password
\`\`\`

## Prevention
- Use proper firewall rules
- Monitor PostgreSQL status
- Implement connection pooling
- Use SSL for remote connections
- Regular configuration audits

## References
- PostgreSQL Documentation: https://www.postgresql.org/docs/current/runtime-config-connection.html
- pg_hba.conf: https://www.postgresql.org/docs/current/auth-pg-hba-conf.html`,
    category: 'other',
    version: '1.0.0',
    tags: ['postgresql', 'database', 'connection', 'configuration'],
    difficulty: 'intermediate',
    estimatedTime: '25 minutes',
    prerequisites: ['PostgreSQL installed', 'Linux system access'],
    author: 'Admin',
    isActive: true,
    errorType: 'network',
    symptoms: ['Connection refused', 'Cannot connect to database', 'Connection timeout'],
    rootCause: 'PostgreSQL not running, wrong configuration, or firewall blocking',
    solution: 'Start PostgreSQL, update configuration, configure pg_hba.conf, check firewall',
    references: ['https://www.postgresql.org/docs/current/runtime-config-connection.html'],
    severity: 'high',
    affectedComponents: ['PostgreSQL database', 'Application connectivity', 'Data access'],
    isErrorDoc: true
  },
  {
    technology: 'Redis',
    title: 'Redis Out of Memory Error',
    description: 'Redis crashes or fails with OOM error when memory limit is exceeded',
    content: `# Redis Out of Memory Error

## Problem
Redis fails with out of memory error or crashes when memory limit is reached.

## Symptoms
- "OOM command not allowed" error
- Redis process killed
- Cannot write to Redis
- Performance degradation

## Root Cause
Redis exceeds configured memory limit or system runs out of available memory.

## Solution

### 1. Check Redis Memory Usage
\`\`\`bash
redis-cli INFO memory
redis-cli CONFIG GET maxmemory
\`\`\`

### 2. Set Memory Limit
\`\`\`bash
redis-cli CONFIG SET maxmemory 2gb
\`\`\`

### 3. Configure Eviction Policy
\`\`\`bash
redis-cli CONFIG SET maxmemory-policy allkeys-lru
redis-cli CONFIG SET maxmemory-policy volatile-lru
redis-cli CONFIG SET maxmemory-policy allkeys-random
\`\`\`

### 4. Update redis.conf
\`\`\`
maxmemory 2gb
maxmemory-policy allkeys-lru
\`\`\`

### 5. Monitor Memory Usage
\`\`\`bash
redis-cli INFO memory | grep used_memory_human
redis-cli --latency
\`\`\`

### 6. Optimize Data Structures
- Use hashes instead of individual keys
- Compress values
- Use appropriate data types
- Implement key expiration

### 7. Use Redis Cluster
\`\`\`bash
redis-cli --cluster create <node1>:6379 <node2>:6379 <node3>:6379
\`\`\`

### 8. Implement Persistence
\`\`\`bash
save 900 1
save 300 10
save 60 10000
\`\`\`

### 9. Docker Redis Configuration
\`\`\`yaml
services:
  redis:
    image: redis:7
    command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
\`\`\`

## Prevention
- Set appropriate memory limits
- Monitor memory usage continuously
- Implement eviction policies
- Use Redis clustering for scale
- Regular key cleanup

## References
- Redis Memory: https://redis.io/docs/manual/eviction/
- Redis Configuration: https://redis.io/docs/manual/config/`,
    category: 'other',
    version: '1.0.0',
    tags: ['redis', 'memory', 'oom', 'performance'],
    difficulty: 'intermediate',
    estimatedTime: '20 minutes',
    prerequisites: ['Redis installed', 'Redis CLI access'],
    author: 'Admin',
    isActive: true,
    errorType: 'performance',
    symptoms: ['OOM error', 'Redis crashes', 'Cannot write to Redis'],
    rootCause: 'Redis exceeds configured memory limit or system out of memory',
    solution: 'Set memory limit, configure eviction policy, optimize data structures, use clustering',
    references: ['https://redis.io/docs/manual/eviction/'],
    severity: 'high',
    affectedComponents: ['Redis database', 'Application caching', 'Performance'],
    isErrorDoc: true
  },
  {
    technology: 'Kubernetes',
    title: 'Kubernetes Service Not Accessible Externally',
    description: 'Kubernetes Service not accessible from outside the cluster',
    content: `# Kubernetes Service External Access Issue

## Problem
Kubernetes Service deployed but not accessible from outside the cluster.

## Symptoms
- Service not accessible via external IP
- Connection timeout when accessing service
- Service works internally but not externally
- LoadBalancer pending

## Root Cause
Wrong service type, missing ingress, or cloud provider configuration issues.

## Solution

### 1. Check Service Type
\`\`\`bash
kubectl get svc <service-name>
kubectl describe svc <service-name>
\`\`\`

### 2. Use Correct Service Type

#### ClusterIP (Internal Only)
\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: internal-service
spec:
  type: ClusterIP
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
\`\`\`

#### NodePort (External Access)
\`\`\`bash
kubectl get nodes -o wide
curl <node-ip>:<node-port>
\`\`\`

\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: nodeport-service
spec:
  type: NodePort
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080
\`\`\`

#### LoadBalancer (Cloud Provider)
\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: loadbalancer-service
spec:
  type: LoadBalancer
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
\`\`\`

### 3. Use Ingress Controller
\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app-service
            port:
              number: 80
\`\`\`

### 4. Port Forwarding (Development)
\`\`\`bash
kubectl port-forward svc/<service-name> 8080:80
\`\`\`

### 5. Check Cloud Provider
- Verify LoadBalancer support
- Check cloud provider permissions
- Ensure proper quotas

### 6. Troubleshoot Network
\`\`\`bash
kubectl exec -it <pod-name> -- curl http://<service-name>
kubectl get endpoints <service-name>
\`\`\`

## Prevention
- Use appropriate service types
- Implement ingress for HTTP/HTTPS
- Monitor service health
- Use proper networking policies
- Document service exposure

## References
- Kubernetes Services: https://kubernetes.io/docs/concepts/services-networking/service/
- Ingress: https://kubernetes.io/docs/concepts/services-networking/ingress/`,
    category: 'orchestration',
    version: '1.0.0',
    tags: ['kubernetes', 'service', 'networking', 'ingress'],
    difficulty: 'intermediate',
    estimatedTime: '30 minutes',
    prerequisites: ['kubectl installed', 'Kubernetes cluster'],
    author: 'Admin',
    isActive: true,
    errorType: 'network',
    symptoms: ['Service not accessible externally', 'Connection timeout', 'LoadBalancer pending'],
    rootCause: 'Wrong service type, missing ingress, or cloud provider issues',
    solution: 'Use correct service type (NodePort/LoadBalancer), implement ingress, check cloud provider',
    references: ['https://kubernetes.io/docs/concepts/services-networking/service/'],
    severity: 'high',
    affectedComponents: ['Kubernetes services', 'External access', 'Application availability'],
    isErrorDoc: true
  },
  {
    technology: 'Jenkins',
    title: 'Jenkins Pipeline Timeout Error',
    description: 'Jenkins pipeline fails with timeout error during long-running builds',
    content: `# Jenkins Pipeline Timeout Error

## Problem
Jenkins pipeline fails with timeout error during long-running builds or deployments.

## Symptoms
- "Build timed out" error
- Pipeline aborts unexpectedly
- Incomplete deployments
- Intermittent failures

## Root Cause
Default timeout settings too short or build genuinely takes too long.

## Solution

### 1. Increase Pipeline Timeout
\`\`\`groovy
pipeline {
    agent any
    options {
        timeout(time: 2, unit: 'HOURS')
    }
    stages {
        stage('Build') {
            steps {
                sh 'make build'
            }
        }
    }
}
\`\`\`

### 2. Stage-Level Timeout
\`\`\`groovy
stage('Deploy') {
    steps {
        timeout(time: 1, unit: 'HOURS') {
            sh 'make deploy'
        }
    }
}
\`\`\`

### 3. Step-Level Timeout
\`\`\`groovy
steps {
    timeout(time: 30, unit: 'MINUTES') {
        sh 'npm install'
    }
}
\`\`\`

### 4. Configure Global Timeout
- Go to Manage Jenkins → Configure System
- Set default timeout for builds

### 5. Use Declarative Timeout
\`\`\`groovy
timeout(time: 90, unit: 'MINUTES', activity: true) {
    sh 'long-running-command'
}
\`\`\`

### 6. Optimize Build Process
- Parallelize stages
- Cache dependencies
- Use incremental builds
- Optimize test execution

### 7. Monitor Build Duration
\`\`\`groovy
stage('Monitor') {
    steps {
        script {
            def duration = currentBuild.durationString
            echo "Build duration: \${duration}"
        }
    }
}
\`\`\`

### 8. Retry Failed Steps
\`\`\`groovy
retry(3) {
    sh 'flaky-command'
}
\`\`\`

## Prevention
- Set appropriate timeouts
- Monitor build performance
- Optimize build process
- Use parallel execution
- Implement caching strategies

## References
- Jenkins Pipeline: https://www.jenkins.io/doc/book/pipeline/
- Timeout Directive: https://www.jenkins.io/doc/book/pipeline/syntax/#timeout`,
    category: 'cicd',
    version: '1.0.0',
    tags: ['jenkins', 'pipeline', 'timeout', 'build-failure'],
    difficulty: 'intermediate',
    estimatedTime: '20 minutes',
    prerequisites: ['Jenkins installed', 'Pipeline configured'],
    author: 'Admin',
    isActive: true,
    errorType: 'runtime',
    symptoms: ['Build timed out', 'Pipeline aborts', 'Incomplete deployments'],
    rootCause: 'Timeout settings too short or build takes too long',
    solution: 'Increase timeout settings, optimize build process, use parallel execution',
    references: ['https://www.jenkins.io/doc/book/pipeline/syntax/#timeout'],
    severity: 'medium',
    affectedComponents: ['Jenkins pipelines', 'Build execution', 'Deployment process'],
    isErrorDoc: true
  },
  {
    technology: 'Docker',
    title: 'Docker Container DNS Resolution Failure',
    description: 'Docker containers cannot resolve DNS names or connect to external services',
    content: `# Docker DNS Resolution Failure

## Problem
Docker containers cannot resolve DNS names or connect to external services.

## Symptoms
- "Temporary failure in name resolution" error
- Cannot ping external domains
- Container cannot reach internet
- Application connection failures

## Root Cause
DNS misconfiguration, network issues, or firewall blocking DNS queries.

## Solution

### 1. Check Container DNS
\`\`\`bash
docker exec <container-id> cat /etc/resolv.conf
docker exec <container-id> nslookup google.com
\`\`\`

### 2. Configure DNS in Docker Daemon
\`\`\`json
{
  "dns": ["8.8.8.8", "8.8.4.4"],
  "dns-opts": ["timeout:2", "attempts:3"]
}
\`\`\`

### 3. Restart Docker
\`\`\`bash
sudo systemctl restart docker
\`\`\`

### 4. Set DNS per Container
\`\`\`bash
docker run --dns 8.8.8.8 --dns 8.8.4.4 your-image
\`\`\`

### 5. Docker Compose DNS
\`\`\`yaml
services:
  app:
    image: your-image
    dns:
      - 8.8.8.8
      - 8.8.4.4
\`\`\`

### 6. Check Host DNS
\`\`\`bash
cat /etc/resolv.conf
nslookup google.com
\`\`\`

### 7. Fix Network Mode
\`\`\`bash
docker run --network host your-image
\`\`\`

### 8. Check Firewall
\`\`\`bash
sudo ufw allow 53/tcp
sudo ufw allow 53/udp
sudo iptables -L -n
\`\`\`

### 9. Use Custom DNS Server
\`\`\`yaml
services:
  dns:
    image: andyshinn/dnsmasq
    ports:
      - "53:53/tcp"
      - "53:53/udp"
\`\`\`

### 10. Kubernetes DNS
\`\`\`yaml
apiVersion: v1
kind: Pod
spec:
  dnsPolicy: "None"
  dnsConfig:
    nameservers:
      - 8.8.8.8
      - 8.8.4.4
\`\`\`

## Prevention
- Use reliable DNS servers
- Monitor DNS resolution
- Implement DNS caching
- Test network connectivity
- Document DNS configuration

## References
- Docker DNS: https://docs.docker.com/config/containers/container-networking/#dns-services
- Docker Daemon: https://docs.docker.com/engine/reference/commandline/dockerd/`,
    category: 'containerization',
    version: '1.0.0',
    tags: ['docker', 'dns', 'networking', 'resolution'],
    difficulty: 'intermediate',
    estimatedTime: '25 minutes',
    prerequisites: ['Docker installed', 'Network access'],
    author: 'Admin',
    isActive: true,
    errorType: 'network',
    symptoms: ['DNS resolution failure', 'Cannot resolve domains', 'Network connectivity issues'],
    rootCause: 'DNS misconfiguration, network issues, or firewall blocking',
    solution: 'Configure DNS settings, check firewall, use reliable DNS servers',
    references: ['https://docs.docker.com/config/containers/container-networking/#dns-services'],
    severity: 'medium',
    affectedComponents: ['Docker containers', 'Network connectivity', 'External service access'],
    isErrorDoc: true
  },
  {
    technology: 'GitLab CI',
    title: 'GitLab CI Runner Offline Error',
    description: 'GitLab CI jobs fail with "runner is offline" error',
    content: `# GitLab CI Runner Offline Error

## Problem
GitLab CI jobs fail with "runner is offline" or "runner not responding" error.

## Symptoms
- Jobs stuck in pending state
- "Runner is offline" error
- No jobs picked up by runner
- Runner status shows offline

## Root Cause
Runner not running, network issues, or GitLab server connectivity problems.

## Solution

### 1. Check Runner Status
\`\`\`bash
sudo gitlab-runner verify
sudo gitlab-runner status
\`\`\`

### 2. Start Runner
\`\`\`bash
sudo gitlab-runner start
sudo gitlab-runner run
\`\`\`

### 3. Check Runner Configuration
\`\`\`bash
sudo cat /etc/gitlab-runner/config.toml
\`\`\`

### 4. Re-register Runner
\`\`\`bash
sudo gitlab-runner unregister
sudo gitlab-runner register \\
  --url https://gitlab.com/ \\
  --registration-token <token> \\
  --executor docker
\`\`\`

### 5. Check GitLab Server Connectivity
\`\`\`bash
curl https://gitlab.com/api/v4/
ping gitlab.com
\`\`\`

### 6. Update Runner
\`\`\`bash
sudo gitlab-runner verify
sudo gitlab-runner install
\`\`\`

### 7. Check Logs
\`\`\`bash
sudo gitlab-runner --debug run
tail -f /var/log/gitlab-runner/gitlab-runner.log
\`\`\`

### 8. Docker Runner Issues
\`\`\`bash
docker ps
docker logs gitlab-runner
\`\`\`

### 9. Configure Runner Tags
\`\`\`toml
[[runners]]
  [runners.docker]
    image = "ubuntu:20.04"
  [runners.custom_build_dir]
    enabled = true
\`\`\`

### 10. Check Runner Limits
- Verify concurrent job limits
- Check resource availability
- Review runner configuration

## Prevention
- Monitor runner health
- Implement runner auto-scaling
- Use multiple runners
- Regular runner maintenance
- Network monitoring

## References
- GitLab Runner: https://docs.gitlab.com/runner/
- Runner Troubleshooting: https://docs.gitlab.com/runner/faq/`,
    category: 'cicd',
    version: '1.0.0',
    tags: ['gitlab', 'ci-cd', 'runner', 'offline'],
    difficulty: 'intermediate',
    estimatedTime: '20 minutes',
    prerequisites: ['GitLab Runner installed', 'GitLab account'],
    author: 'Admin',
    isActive: true,
    errorType: 'network',
    symptoms: ['Runner offline', 'Jobs stuck pending', 'No jobs picked up'],
    rootCause: 'Runner not running, network issues, or GitLab server connectivity',
    solution: 'Start runner, re-register if needed, check connectivity, update runner',
    references: ['https://docs.gitlab.com/runner/'],
    severity: 'high',
    affectedComponents: ['GitLab CI/CD', 'Job execution', 'Pipeline automation'],
    isErrorDoc: true
  },
  {
    technology: 'MongoDB',
    title: 'MongoDB Connection Pool Exhausted',
    description: 'MongoDB connection pool exhausted causing application connection failures',
    content: `# MongoDB Connection Pool Exhausted

## Problem
Application fails to connect to MongoDB due to exhausted connection pool.

## Symptoms
- "Connection pool exhausted" error
- Application cannot connect to database
- Slow database queries
- High connection count

## Root Cause
Too many connections opened without proper closing or connection pool size too small.

## Solution

### 1. Check Connection Count
\`\`\`javascript
db.serverStatus().connections
\`\`\`

### 2. Increase Connection Pool Size
\`\`\`javascript
const mongoose = require('mongoose');
mongoose.connect(uri, {
  poolSize: 50,
  maxPoolSize: 100,
  minPoolSize: 10
});
\`\`\`

### 3. Configure Connection Timeout
\`\`\`javascript
mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000
});
\`\`\`

### 4. Implement Connection Reuse
\`\`\`javascript
// Single connection instance
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to MongoDB');
});
\`\`\`

### 5. Close Unused Connections
\`\`\`javascript
// Close connection when done
mongoose.connection.close();
\`\`\`

### 6. Use Connection Pooling
\`\`\`javascript
const pool = mongoose.createConnection(uri, {
  poolSize: 20
});
\`\`\`

### 7. Monitor Connection Usage
\`\`\`javascript
setInterval(() => {
  console.log('Active connections:', mongoose.connection.readyState);
}, 60000);
\`\`\`

### 8. MongoDB Configuration
\`\`\`
# mongod.conf
net:
  maxIncomingConnections: 65536
\`\`\`

### 9. Implement Retry Logic
\`\`\`javascript
async function connectWithRetry(uri, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(uri);
      console.log('Connected successfully');
      return;
    } catch (err) {
      console.log(\`Connection attempt \${i + 1} failed\`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  throw new Error('Failed to connect after retries');
}
\`\`\`

## Prevention
- Use connection pooling
- Monitor connection usage
- Implement proper connection lifecycle
- Set appropriate pool sizes
- Use connection timeouts

## References
- MongoDB Connections: https://docs.mongodb.com/manual/reference/connection-string/
- Mongoose Connection: https://mongoosejs.com/docs/connections.html`,
    category: 'other',
    version: '1.0.0',
    tags: ['mongodb', 'database', 'connection-pool', 'performance'],
    difficulty: 'advanced',
    estimatedTime: '30 minutes',
    prerequisites: ['MongoDB installed', 'Node.js application'],
    author: 'Admin',
    isActive: true,
    errorType: 'performance',
    symptoms: ['Connection pool exhausted', 'Cannot connect to database', 'Slow queries'],
    rootCause: 'Too many connections or pool size too small',
    solution: 'Increase pool size, implement connection reuse, monitor connections',
    references: ['https://docs.mongodb.com/manual/reference/connection-string/'],
    severity: 'high',
    affectedComponents: ['MongoDB database', 'Application connectivity', 'Performance'],
    isErrorDoc: true
  },
  {
    technology: 'Nginx',
    title: 'Nginx 413 Request Entity Too Large',
    description: 'Nginx returns 413 error when uploading large files',
    content: `# Nginx 413 Request Entity Too Large

## Problem
Nginx returns 413 Request Entity Too Large error when uploading files.

## Symptoms
- "413 Request Entity Too Large" error
- File uploads fail
- Large POST requests rejected
- Upload progress stops

## Root Cause
Default client_max_body_size limit is too low for large file uploads.

## Solution

### 1. Increase client_max_body_size
\`\`\`nginx
http {
    client_max_body_size 100M;
}
\`\`\`

### 2. Per Location Configuration
\`\`\`nginx
server {
    location /upload {
        client_max_body_size 100M;
        proxy_pass http://backend;
    }
}
\`\`\`

### 3. Per Server Configuration
\`\`\`nginx
server {
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://backend;
    }
}
\`\`\`

### 4. Restart Nginx
\`\`\`bash
sudo nginx -t
sudo systemctl reload nginx
\`\`\`

### 5. Configure in Docker
\`\`\`nginx
events {}
http {
    client_max_body_size 100M;
    server {
        listen 80;
        location / {
            proxy_pass http://backend;
        }
    }
}
\`\`\`

### 6. Docker Compose
\`\`\`yaml
services:
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
\`\`\`

### 7. Application Configuration
- Ensure backend also accepts large files
- Configure upload limits in application
- Use chunked uploads for very large files

### 8. Security Considerations
- Set reasonable limits
- Implement file type validation
- Scan uploaded files
- Use virus scanning

### 9. Monitor Uploads
\`\`\`nginx
log_format upload '$remote_addr - $remote_user [$time_local] '
                 '"$request" $status $body_bytes_sent '
                 '"$http_referer" "$http_user_agent" '
                 '$request_length $request_time';

access_log /var/log/nginx/upload.log upload;
\`\`\`

## Prevention
- Set appropriate size limits
- Implement file validation
- Use chunked uploads
- Monitor upload sizes
- Document upload requirements

## References
- Nginx Documentation: https://nginx.org/en/docs/http/ngx_http_core_module.html#client_max_body_size
- File Uploads: https://nginx.org/en/docs/http/ngx_http_core_module.html`,
    category: 'other',
    version: '1.0.0',
    tags: ['nginx', 'file-upload', '413-error', 'configuration'],
    difficulty: 'beginner',
    estimatedTime: '15 minutes',
    prerequisites: ['Nginx installed', 'Configuration access'],
    author: 'Admin',
    isActive: true,
    errorType: 'configuration',
    symptoms: ['413 Request Entity Too Large', 'File uploads fail', 'Uploads rejected'],
    rootCause: 'Default client_max_body_size limit too low',
    solution: 'Increase client_max_body_size in nginx configuration',
    references: ['https://nginx.org/en/docs/http/ngx_http_core_module.html#client_max_body_size'],
    severity: 'medium',
    affectedComponents: ['Nginx server', 'File uploads', 'Application functionality'],
    isErrorDoc: true
  },
  {
    technology: 'Kubernetes',
    title: 'Kubernetes ResourceQuota Exceeded',
    description: 'Pods fail to schedule due to ResourceQuota limits being exceeded',
    content: `# Kubernetes ResourceQuota Exceeded

## Problem
Pods fail to schedule or are rejected due to ResourceQuota limits being exceeded.

## Symptoms
- "Exceeded quota" error
- Pods stuck in pending state
- Cannot create new resources
- Resource limit warnings

## Root Cause
Namespace has exceeded its configured resource quotas for CPU, memory, or object counts.

## Solution

### 1. Check ResourceQuota
\`\`\`bash
kubectl get resourcequota -n <namespace>
kubectl describe resourcequota <quota-name> -n <namespace>
\`\`\`

### 2. Check Resource Usage
\`\`\`bash
kubectl describe namespace <namespace>
kubectl top nodes
kubectl top pods -n <namespace>
\`\`\`

### 3. Increase ResourceQuota
\`\`\`yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-resources
  namespace: my-namespace
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
\`\`\`

### 4. Create New ResourceQuota
\`\`\`bash
kubectl apply -f resource-quota.yaml
\`\`\`

### 5. Check Pod Resource Requests
\`\`\`bash
kubectl get pods -n <namespace> -o jsonpath='{.items[*].spec.containers[*].resources}'
\`\`\`

### 6. Reduce Resource Requests
\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: reduced-pod
spec:
  containers:
  - name: app
    image: app-image
    resources:
      requests:
        cpu: "100m"
        memory: "128Mi"
      limits:
        cpu: "200m"
        memory: "256Mi"
\`\`\`

### 7. Delete Unused Resources
\`\`\`bash
kubectl delete pods --all -n <namespace>
kubectl delete deployments --all -n <namespace>
\`\`\`

### 8. Use LimitRange
\`\`\`yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: limit-range
  namespace: my-namespace
spec:
  limits:
  - default:
      cpu: "500m"
      memory: "512Mi"
    defaultRequest:
      cpu: "100m"
      memory: "128Mi"
\`\`\`

### 9. Monitor Quota Usage
\`\`\`bash
kubectl get resourcequota -n <namespace> -o yaml
\`\`\`

## Prevention
- Set appropriate quotas
- Monitor resource usage
- Implement resource limits
- Regular cleanup of unused resources
- Use horizontal pod autoscaling

## References
- Kubernetes ResourceQuota: https://kubernetes.io/docs/concepts/policy/resource-quotas/
- LimitRange: https://kubernetes.io/docs/concepts/policy/limit-range/`,
    category: 'orchestration',
    version: '1.0.0',
    tags: ['kubernetes', 'resource-quota', 'limits', 'scheduling'],
    difficulty: 'intermediate',
    estimatedTime: '25 minutes',
    prerequisites: ['kubectl installed', 'Kubernetes cluster'],
    author: 'Admin',
    isActive: true,
    errorType: 'configuration',
    symptoms: ['Exceeded quota error', 'Pods stuck pending', 'Cannot create resources'],
    rootCause: 'Namespace exceeded configured resource quotas',
    solution: 'Increase quotas, reduce resource requests, delete unused resources',
    references: ['https://kubernetes.io/docs/concepts/policy/resource-quotas/'],
    severity: 'medium',
    affectedComponents: ['Kubernetes namespace', 'Resource management', 'Pod scheduling'],
    isErrorDoc: true
  },
  {
    technology: 'AWS',
    title: 'AWS S3 Access Denied Error',
    description: 'AWS S3 operations fail with Access Denied due to IAM permissions',
    content: `# AWS S3 Access Denied Error

## Problem
AWS S3 operations fail with "Access Denied" error due to insufficient IAM permissions.

## Symptoms
- "Access Denied" error
- Cannot list buckets
- Cannot upload/download files
- IAM policy errors

## Root Cause
IAM user or role lacks necessary S3 permissions or bucket policy restrictions.

## Solution

### 1. Check IAM Permissions
\`\`\`bash
aws iam get-user-policy --user-name <username> --policy-name <policy-name>
aws iam list-attached-user-policies --user-name <username>
\`\`\`

### 2. Grant S3 Permissions
\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::bucket-name",
        "arn:aws:s3:::bucket-name/*"
      ]
    }
  ]
}
\`\`\`

### 3. Check Bucket Policy
\`\`\`bash
aws s3api get-bucket-policy --bucket bucket-name
\`\`\`

### 4. Update Bucket Policy
\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::account-id:user/username"
      },
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::bucket-name",
        "arn:aws:s3:::bucket-name/*"
      ]
    }
  ]
}
\`\`\`

### 5. Check Bucket Ownership
\`\`\`bash
aws s3api get-bucket-acl --bucket bucket-name
\`\`\`

### 6. Use S3 Full Access Policy
\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": "*"
    }
  ]
}
\`\`\`

### 7. Verify AWS Credentials
\`\`\`bash
aws configure list
aws sts get-caller-identity
\`\`\`

### 8. Check MFA Requirements
- Verify MFA is not required
- Provide MFA token if needed
- Check session duration

### 9. Use Bucket Public Access (if appropriate)
\`\`\`bash
aws s3api put-public-access-block \\
  --bucket bucket-name \\
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
\`\`\`

### 10. Test Access
\`\`\`bash
aws s3 ls s3://bucket-name
aws s3 cp file.txt s3://bucket-name/
\`\`\`

## Prevention
- Use least privilege principle
- Implement proper IAM policies
- Regular permission audits
- Use bucket policies carefully
- Monitor access logs

## References
- AWS S3 Permissions: https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-overview.html
- IAM Policies: https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html`,
    category: 'other',
    version: '1.0.0',
    tags: ['aws', 's3', 'iam', 'access-denied'],
    difficulty: 'intermediate',
    estimatedTime: '25 minutes',
    prerequisites: ['AWS CLI installed', 'S3 bucket'],
    author: 'Admin',
    isActive: true,
    errorType: 'security',
    symptoms: ['Access Denied error', 'Cannot access S3', 'IAM permission errors'],
    rootCause: 'IAM user or role lacks necessary S3 permissions',
    solution: 'Grant proper IAM permissions, update bucket policy, verify credentials',
    references: ['https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-overview.html'],
    severity: 'high',
    affectedComponents: ['AWS S3', 'IAM permissions', 'Data access'],
    isErrorDoc: true
  },
  {
    technology: 'Terraform',
    title: 'Terraform Provider Authentication Error',
    description: 'Terraform fails to authenticate with cloud provider during plan/apply',
    content: `# Terraform Provider Authentication Error

## Problem
Terraform fails to authenticate with cloud provider (AWS, Azure, GCP) during plan or apply.

## Symptoms
- "Error: error configuring Terraform AWS Provider"
- "Authentication failed" error
- "Invalid credentials" error
- Provider initialization fails

## Root Cause
Missing or invalid cloud provider credentials, or incorrect provider configuration.

## Solution

### 1. AWS Provider

#### Environment Variables
\`\`\`bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="us-east-1"
\`\`\`

#### AWS Credentials File
\`\`\`bash
aws configure
\`\`\`

#### Shared Credentials File
\`\`\`hcl
provider "aws" {
  region                  = "us-east-1"
  shared_credentials_file = "~/.aws/credentials"
  profile                 = "default"
}
\`\`\`

#### Assume Role
\`\`\`hcl
provider "aws" {
  region  = "us-east-1"
  assume_role {
    role_arn = "arn:aws:iam::123456789012:role/TerraformRole"
  }
}
\`\`\`

### 2. Azure Provider

#### Service Principal
\`\`\`bash
az login
az account set --subscription <subscription-id>
\`\`\`

#### Environment Variables
\`\`\`bash
export ARM_CLIENT_ID="your-client-id"
export ARM_CLIENT_SECRET="your-client-secret"
export ARM_SUBSCRIPTION_ID="your-subscription-id"
export ARM_TENANT_ID="your-tenant-id"
\`\`\`

#### Managed Identity
\`\`\`hcl
provider "azurerm" {
  features {}
  use_msi = true
}
\`\`\`

### 3. GCP Provider

#### Service Account
\`\`\`bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
\`\`\`

#### Provider Configuration
\`\`\`hcl
provider "google" {
  project = "my-project-id"
  region  = "us-central1"
  credentials = file("account.json")
}
\`\`\`

### 4. Verify Credentials
\`\`\`bash
aws sts get-caller-identity
az account show
gcloud auth list
\`\`\`

### 5. Check Provider Version
\`\`\`hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
\`\`\`

### 6. Reinitialize Providers
\`\`\`bash
terraform init -upgrade
\`\`\`

### 7. Use Terraform Cloud
- Configure workspace variables
- Use Terraform Cloud authentication
- Implement proper secrets management

## Prevention
- Use environment variables for credentials
- Implement proper IAM roles
- Use service accounts
- Rotate credentials regularly
- Use Terraform Cloud for enterprise

## References
- AWS Provider: https://registry.terraform.io/providers/hashicorp/aws/latest/docs
- Azure Provider: https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs
- GCP Provider: https://registry.terraform.io/providers/hashicorp/google/latest/docs`,
    category: 'iac',
    version: '1.0.0',
    tags: ['terraform', 'authentication', 'aws', 'azure', 'gcp'],
    difficulty: 'intermediate',
    estimatedTime: '20 minutes',
    prerequisites: ['Terraform installed', 'Cloud provider account'],
    author: 'Admin',
    isActive: true,
    errorType: 'security',
    symptoms: ['Authentication failed', 'Invalid credentials', 'Provider initialization fails'],
    rootCause: 'Missing or invalid cloud provider credentials',
    solution: 'Configure environment variables, use service accounts, verify credentials',
    references: ['https://registry.terraform.io/providers/hashicorp/aws/latest/docs'],
    severity: 'high',
    affectedComponents: ['Terraform providers', 'Cloud provider access', 'Infrastructure deployment'],
    isErrorDoc: true
  },
  {
    technology: 'Docker',
    title: 'Docker Overlay Network Communication Failure',
    description: 'Docker containers on overlay network cannot communicate with each other',
    content: `# Docker Overlay Network Communication Failure

## Problem
Docker containers on overlay network cannot communicate across swarm nodes.

## Symptoms
- Containers cannot reach each other
- Connection timeout between services
- DNS resolution fails between containers
- Swarm service discovery issues

## Root Cause
Overlay network misconfiguration, firewall blocking, or swarm cluster issues.

## Solution

### 1. Check Network Status
\`\`\`bash
docker network ls
docker network inspect <network-name>
docker network inspect overlay-network
\`\`\`

### 2. Verify Swarm Status
\`\`\`bash
docker node ls
docker service ls
docker service ps <service-name>
\`\`\`

### 3. Check Container Network
\`\`\`bash
docker inspect <container-id> | grep -A 10 Network
docker exec <container-id> ip addr
\`\`\`

### 4. Test Connectivity
\`\`\`bash
docker exec <container1> ping <container2-ip>
docker exec <container1> curl http://<service-name>
\`\`\`

### 5. Create Overlay Network
\`\`\`bash
docker network create --driver overlay --attachable my-overlay
\`\`\`

### 6. Attach Services to Network
\`\`\`yaml
version: '3.8'
services:
  app:
    image: app-image
    networks:
      - my-overlay
networks:
  my-overlay:
    external: true
\`\`\`

### 7. Check Firewall Rules
\`\`\`bash
sudo ufw allow 2377/tcp
sudo ufw allow 7946/tcp
sudo ufw allow 7946/udp
sudo ufw allow 4789/udp
\`\`\`

### 8. Verify DNS Resolution
\`\`\`bash
docker exec <container-id> nslookup <service-name>
docker exec <container-id> cat /etc/resolv.conf
\`\`\`

### 9. Check Swarm Routing Mesh
\`\`\`bash
docker network inspect ingress --verbose
\`\`\`

### 10. Re-create Network
\`\`\`bash
docker network rm my-overlay
docker network create --driver overlay my-overlay
\`\`\`

## Prevention
- Use proper network drivers
- Configure firewall rules
- Monitor network health
- Test connectivity regularly
- Document network architecture

## References
- Docker Networking: https://docs.docker.com/engine/swarm/networking/
- Overlay Networks: https://docs.docker.com/network/overlay/`,
    category: 'containerization',
    version: '1.0.0',
    tags: ['docker', 'overlay-network', 'swarm', 'networking'],
    difficulty: 'advanced',
    estimatedTime: '30 minutes',
    prerequisites: ['Docker Swarm', 'Multiple nodes'],
    author: 'Admin',
    isActive: true,
    errorType: 'network',
    symptoms: ['Containers cannot communicate', 'Connection timeout', 'DNS resolution fails'],
    rootCause: 'Overlay network misconfiguration or firewall blocking',
    solution: 'Check network status, verify swarm, configure firewall, re-create network',
    references: ['https://docs.docker.com/engine/swarm/networking/'],
    severity: 'high',
    affectedComponents: ['Docker swarm', 'Overlay network', 'Service communication'],
    isErrorDoc: true
  },
  {
    technology: 'Jenkins',
    title: 'Jenkins Slave Node Connection Failed',
    description: 'Jenkins master cannot connect to slave nodes',
    content: `# Jenkins Slave Node Connection Failed

## Problem
Jenkins master cannot connect to slave nodes, causing build failures.

## Symptoms
- "Connection refused" error
- Slave shows offline
- Jobs fail to schedule on slaves
- Master cannot communicate with slaves

## Root Cause
Network issues, incorrect slave configuration, or slave agent not running.

## Solution

### 1. Check Slave Status
- Go to Manage Jenkins → Manage Nodes
- Check slave node status
- View slave logs

### 2. Verify Slave Agent Running
\`\`\`bash
# On slave node
ps aux | grep java
systemctl status jenkins-slave
\`\`\`

### 3. Start Slave Agent
\`\`\`bash
java -jar agent.jar -url http://jenkins-master:8080 -secret <secret> -name "slave-node"
\`\`\`

### 4. Check Network Connectivity
\`\`\`bash
# From master to slave
ping slave-node-ip
telnet slave-node-ip <slave-port>
\`\`\`

### 5. Configure Slave Node
- Go to Manage Jenkins → Manage Nodes
- Click on slave node
- Configure remote root directory
- Set launch method (SSH, JNLP, etc.)

### 6. SSH Configuration
\`\`\`bash
# Generate SSH key on master
ssh-keygen -t rsa

# Copy to slave
ssh-copy-id jenkins@slave-node

# Test connection
ssh jenkins@slave-node
\`\`\`

### 7. Firewall Configuration
\`\`\`bash
# On slave
sudo ufw allow <jenkins-master-ip>/32
sudo ufw allow 22/tcp
\`\`\`

### 8. Check Java Version
\`\`\`bash
java -version
# Ensure compatible Java version
\`\`\`

### 9. Reconnect Slave
- Go to Manage Jenkins → Manage Nodes
- Click "Disconnect" then "Relaunch Agent"

### 10. Check Slave Logs
\`\`\`bash
# On slave
tail -f /var/log/jenkins/slave.log
\`\`\`

## Prevention
- Use proper network configuration
- Monitor slave health
- Implement slave auto-reconnect
- Regular maintenance
- Document slave setup

## References
- Jenkins Distributed Builds: https://www.jenkins.io/doc/book/using/using-agents/
- Slave Configuration: https://www.jenkins.io/doc/book/managing/nodes/`,
    category: 'cicd',
    version: '1.0.0',
    tags: ['jenkins', 'slave-node', 'distributed-builds', 'networking'],
    difficulty: 'intermediate',
    estimatedTime: '25 minutes',
    prerequisites: ['Jenkins master', 'Slave nodes'],
    author: 'Admin',
    isActive: true,
    errorType: 'network',
    symptoms: ['Slave offline', 'Connection refused', 'Jobs fail on slaves'],
    rootCause: 'Network issues or slave agent not running',
    solution: 'Start slave agent, check network, configure SSH, verify firewall',
    references: ['https://www.jenkins.io/doc/book/using/using-agents/'],
    severity: 'high',
    affectedComponents: ['Jenkins slaves', 'Build execution', 'Distributed builds'],
    isErrorDoc: true
  },
  {
    technology: 'Kubernetes',
    title: 'Kubernetes PersistentVolume Claim Pending',
    description: 'PVC stuck in pending state, unable to bind to PersistentVolume',
    content: `# Kubernetes PVC Pending State

## Problem
PersistentVolumeClaim (PVC) stuck in pending state, unable to bind to PersistentVolume.

## Symptoms
- PVC status shows Pending
- Pod cannot start due to unbound PVC
- No available volumes
- Storage class issues

## Root Cause
No matching PersistentVolume, storage class misconfiguration, or insufficient storage.

## Solution

### 1. Check PVC Status
\`\`\`bash
kubectl get pvc
kubectl describe pvc <pvc-name>
\`\`\`

### 2. Check Events
\`\`\`bash
kubectl get events --sort-by=.metadata.creationTimestamp
\`\`\`

### 3. Check Available PVs
\`\`\`bash
kubectl get pv
kubectl describe pv <pv-name>
\`\`\`

### 4. Check Storage Classes
\`\`\`bash
kubectl get storageclass
kubectl describe storageclass <sc-name>
\`\`\`

### 5. Create Matching PV
\`\`\`yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-name
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: manual
  hostPath:
    path: /mnt/data
\`\`\`

### 6. Fix PVC Specification
\`\`\`yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-name
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: manual
\`\`\`

### 7. Use Dynamic Provisioning
\`\`\`yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: dynamic-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: gp2  # AWS EBS
\`\`\`

### 8. Check Storage Class Default
\`\`\`bash
kubectl patch storageclass <sc-name> -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
\`\`\`

### 9. Verify Access Modes
- ReadWriteOnce (RWO)
- ReadOnlyMany (ROX)
- ReadWriteMany (RWX)

### 10. Troubleshoot Cloud Provider
- Check cloud provider quotas
- Verify storage availability
- Check IAM permissions

## Prevention
- Use dynamic provisioning
- Set appropriate storage classes
- Monitor storage usage
- Implement proper reclaim policies
- Document storage requirements

## References
- Kubernetes Volumes: https://kubernetes.io/docs/concepts/storage/persistent-volumes/
- Storage Classes: https://kubernetes.io/docs/concepts/storage/storage-classes/`,
    category: 'orchestration',
    version: '1.0.0',
    tags: ['kubernetes', 'pvc', 'persistent-volume', 'storage'],
    difficulty: 'intermediate',
    estimatedTime: '30 minutes',
    prerequisites: ['kubectl installed', 'Kubernetes cluster'],
    author: 'Admin',
    isActive: true,
    errorType: 'configuration',
    symptoms: ['PVC pending', 'Pod cannot start', 'No available volumes'],
    rootCause: 'No matching PV, storage class misconfiguration, or insufficient storage',
    solution: 'Create matching PV, fix storage class, use dynamic provisioning',
    references: ['https://kubernetes.io/docs/concepts/storage/persistent-volumes/'],
    severity: 'high',
    affectedComponents: ['Kubernetes storage', 'Pod scheduling', 'Application data'],
    isErrorDoc: true
  },
  {
    technology: 'Ansible',
    title: 'Ansible SSH Connection Failed',
    description: 'Ansible cannot connect to target hosts via SSH',
    content: `# Ansible SSH Connection Failed

## Problem
Ansible playbooks fail with SSH connection errors when trying to manage remote hosts.

## Symptoms
- "SSH connection failed" error
- "UNREACHABLE" error
- Playbook execution stops
- Cannot connect to inventory hosts

## Root Cause
SSH misconfiguration, authentication issues, or network connectivity problems.

## Solution

### 1. Test SSH Connection
\`\`\`bash
ssh user@target-host
ssh -vvv user@target-host
\`\`\`

### 2. Check Ansible Inventory
\`\`\`ini
[webservers]
host1 ansible_host=192.168.1.10 ansible_user=ubuntu
host2 ansible_host=192.168.1.11 ansible_user=ubuntu
\`\`\`

### 3. Configure SSH Key Authentication
\`\`\`bash
# Generate SSH key
ssh-keygen -t rsa

# Copy to target
ssh-copy-id user@target-host
\`\`\`

### 4. Update ansible.cfg
\`\`\`ini
[defaults]
host_key_checking = False
private_key_file = ~/.ssh/id_rsa
remote_user = ubuntu
\`\`\`

### 5. Use SSH Agent
\`\`\`bash
ssh-add ~/.ssh/id_rsa
\`\`\`

### 6. Check SSH Config
\`\`\`bash
cat ~/.ssh/config
\`\`\`

### 7. Add SSH Config Entry
\`\`\`
Host target-host
    HostName 192.168.1.10
    User ubuntu
    IdentityFile ~/.ssh/id_rsa
    StrictHostKeyChecking no
\`\`\`

### 8. Test with Ansible Ping
\`\`\`bash
ansible all -m ping -i inventory.ini
ansible all -m ping -u ubuntu -i inventory.ini
\`\`\`

### 9. Use Password Authentication
\`\`\`bash
ansible-playbook playbook.yml -u ubuntu -k
\`\`\`

### 10. Check Firewall
\`\`\`bash
sudo ufw allow 22/tcp
sudo iptables -L -n
\`\`\`

### 11. Increase SSH Timeout
\`\`\`ini
[defaults]
timeout = 30
\`\`\`

## Prevention
- Use SSH key authentication
- Implement proper inventory management
- Monitor SSH connectivity
- Use SSH config files
- Regular connection testing

## References
- Ansible Connection: https://docs.ansible.com/ansible/latest/collections/ansible/builtin/ssh_connection.html
- SSH Configuration: https://www.ssh.com/academy/ssh/config`,
    category: 'other',
    version: '1.0.0',
    tags: ['ansible', 'ssh', 'connection', 'automation'],
    difficulty: 'beginner',
    estimatedTime: '20 minutes',
    prerequisites: ['Ansible installed', 'SSH access'],
    author: 'Admin',
    isActive: true,
    errorType: 'network',
    symptoms: ['SSH connection failed', 'UNREACHABLE error', 'Playbook fails'],
    rootCause: 'SSH misconfiguration, authentication issues, or network problems',
    solution: 'Configure SSH keys, update ansible.cfg, test connectivity, check firewall',
    references: ['https://docs.ansible.com/ansible/latest/collections/ansible/builtin/ssh_connection.html'],
    severity: 'medium',
    affectedComponents: ['Ansible automation', 'SSH connectivity', 'Host management'],
    isErrorDoc: true
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing error docs
    await DevOpsDoc.deleteMany({ isErrorDoc: true });
    console.log('Cleared existing error documentation');

    // Insert error docs
    await DevOpsDoc.insertMany(errorDocs);
    console.log(`${errorDocs.length} error documentation entries inserted successfully`);

    // Disconnect
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();
