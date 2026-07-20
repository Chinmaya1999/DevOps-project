const mongoose = require('mongoose');
const DevOpsDoc = require('./models/DevOpsDoc');

const sampleDocs = [
  {
    technology: 'Jenkins',
    title: 'Complete Jenkins Setup Guide',
    description: 'Step-by-step guide to install and configure Jenkins CI/CD server with best practices',
    content: `# Jenkins Setup Guide

## Prerequisites
- Java 8 or higher installed
- At least 2GB RAM
- 10GB disk space
- Ubuntu/Debian/CentOS/RHEL

## Installation Steps

### 1. Install Java
\`\`\`bash
sudo apt update
sudo apt install openjdk-11-jdk
\`\`\`

### 2. Add Jenkins Repository
\`\`\`bash
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
echo deb https://pkg.jenkins.io/debian-stable binary/ | sudo tee /etc/apt/sources.list.d/jenkins.list
\`\`\`

### 3. Install Jenkins
\`\`\`bash
sudo apt update
sudo apt install jenkins
\`\`\`

### 4. Start and Enable Jenkins
\`\`\`bash
sudo systemctl start jenkins
sudo systemctl enable jenkins
\`\`\`

## Configuration

### 1. Unlock Jenkins
1. Open http://localhost:8080 in browser
2. Get initial password: \`sudo cat /var/lib/jenkins/secrets/initialAdminPassword\`
3. Enter password and create admin user

### 2. Install Plugins
1. Go to Manage Jenkins → Manage Plugins
2. Install recommended plugins
3. Restart Jenkins

## Security Setup

### 1. Configure Security
1. Go to Manage Jenkins → Configure Global Security
2. Enable security realms
3. Set authorization strategy

### 2. Create Users
1. Go to Manage Jenkins → Manage Users
2. Create new users with appropriate permissions

## Troubleshooting

### Common Issues
- Port 8080 blocked: Check firewall settings
- Permission denied: Check Jenkins user permissions
- Out of memory: Increase heap size in jenkins.service

### Logs Location
\`\`\`bash
/var/log/jenkins/jenkins.log
\`\`\`

## Backup and Recovery

### Backup Configuration
\`\`\`bash
sudo cp -r /var/lib/jenkins /backup/jenkins-$(date +%Y%m%d)
\`\`\`

### Restore Configuration
\`\`\`bash
sudo systemctl stop jenkins
sudo cp -r /backup/jenkins-YYYYMMDD/* /var/lib/jenkins/
sudo systemctl start jenkins
\`\`\``,
    category: 'cicd',
    version: '2.0.0',
    tags: ['jenkins', 'ci-cd', 'automation', 'build'],
    difficulty: 'intermediate',
    estimatedTime: '45 minutes',
    prerequisites: ['Java 8+', '2GB RAM', '10GB disk space', 'Linux OS'],
    author: 'Admin',
    isActive: true
  },
  {
    technology: 'Docker',
    title: 'Docker Installation and Configuration',
    description: 'Complete guide to install Docker and start containerizing applications',
    content: `# Docker Setup Guide

## Prerequisites
- 64-bit Linux/Windows/macOS
- 2GB RAM minimum
- Virtualization enabled in BIOS

## Installation

### Ubuntu/Debian
\`\`\`bash
sudo apt update
sudo apt install docker.io docker-compose
sudo usermod -aG docker $USER
\`\`\`

### CentOS/RHEL
\`\`\`bash
sudo yum install docker docker-compose
sudo usermod -aG docker $USER
\`\`\`

### Windows
1. Download Docker Desktop from docker.com
2. Run installer
3. Restart system

## Basic Usage

### Pull Images
\`\`\`bash
docker pull nginx:latest
docker pull ubuntu:20.04
\`\`\`

### Run Containers
\`\`\`bash
docker run -d -p 80:80 --name web-server nginx
docker run -it --name ubuntu-shell ubuntu:20.04 /bin/bash
\`\`\`

### Container Management
\`\`\`bash
docker ps                    # List running containers
docker stop <container-id>    # Stop container
docker rm <container-id>       # Remove container
docker images                 # List images
\`\`\`

## Docker Compose

### Example docker-compose.yml
\`\`\`yaml
version: '3.8'
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./html:/usr/share/nginx/html
  db:
    image: mysql:5.7
    environment:
      MYSQL_ROOT_PASSWORD: password
\`\`\`

### Run Compose
\`\`\`bash
docker-compose up -d
docker-compose down
\`\`\`

## Best Practices

### Security
- Use non-root user in containers
- Don't run containers with --privileged
- Keep Docker updated

### Performance
- Use .dockerignore to exclude unnecessary files
- Multi-stage builds for smaller images
- Resource limits for containers

## Troubleshooting

### Permission Issues
\`\`\`bash
sudo usermod -aG docker $USER
newgrp docker
\`\`\`

### Port Conflicts
\`\`\`bash
docker ps -a                    # Show all containers
docker rm <container-id>        # Remove conflicting container
\`\`\``,
    category: 'containerization',
    version: '1.5.0',
    tags: ['docker', 'containers', 'virtualization'],
    difficulty: 'beginner',
    estimatedTime: '30 minutes',
    prerequisites: ['64-bit OS', '2GB RAM', 'Virtualization enabled'],
    author: 'Admin',
    isActive: true
  },
  {
    technology: 'Kubernetes',
    title: 'Kubernetes Cluster Setup',
    description: 'Deploy and configure a production-ready Kubernetes cluster',
    content: `# Kubernetes Setup Guide

## Prerequisites
- Multiple Linux nodes (minimum 3)
- 2 CPU cores per node
- 4GB RAM per node
- Network connectivity between nodes
- Container runtime installed

## Installation Options

### Option 1: kubeadm (Recommended)
\`\`\`bash
# Install kubeadm, kubelet, kubectl
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt update
sudo apt install -y kubelet kubeadm kubectl
\`\`\`

### Initialize Master Node
\`\`\`bash
sudo kubeadm init --pod-network-cidr=10.244.0.0/16
\`\`\`

### Configure kubectl
\`\`\`bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
\`\`\`

### Install Network Plugin
\`\`\`bash
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
\`\`\`

### Join Worker Nodes
\`\`\`bash
# On master: Get join command
sudo kubeadm token create --print-join-command

# On workers: Use the join command
sudo kubeadm join <master-ip>:6443 --token <token> --discovery-token-ca-cert-hash <hash>
\`\`\`

## Pod Network Configuration

### Flannel (Default)
\`\`\`bash
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
\`\`\`

### Calico (Alternative)
\`\`\`bash
kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml
\`\`\`

## Storage Setup

### Persistent Volumes
\`\`\`yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: app-data
spec:
  accessModes:
    - ReadWriteOnce
  capacity:
    storage: 10Gi
  hostPath:
    path: /data/app
\`\`\`

### Storage Class
\`\`\`yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp2
\`\`\`

## Application Deployment

### Sample Deployment
\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: web-app
        image: nginx:latest
        ports:
        - containerPort: 80
\`\`\`

### Service Exposure
\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app-service
spec:
  selector:
    app: web-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: LoadBalancer
\`\`\`

## Monitoring and Logging

### Install Metrics Server
\`\`\`bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
\`\`\`

### Check Cluster Status
\`\`\`bash
kubectl get nodes
kubectl get pods --all-namespaces
kubectl cluster-info
\`\`\`

## Security Best Practices

### RBAC Setup
\`\`\`yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
\`\`\`

### Network Policies
\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
\`\`\`

## Troubleshooting

### Common Issues
- Nodes NotReady: Check kubelet status
- Pod pending: Check resources, image pull
- Network issues: Verify CNI configuration

### Debug Commands
\`\`\`bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl get events
\`\`\``,
    category: 'orchestration',
    version: '1.8.0',
    tags: ['kubernetes', 'k8s', 'containers', 'orchestration'],
    difficulty: 'advanced',
    estimatedTime: '2 hours',
    prerequisites: ['Multiple nodes', '4GB RAM per node', 'Container runtime'],
    author: 'Admin',
    isActive: true
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

    // Clear existing docs
    await DevOpsDoc.deleteMany({});
    console.log('Cleared existing DevOps documentation');

    // Insert sample docs
    await DevOpsDoc.insertMany(sampleDocs);
    console.log('Sample DevOps documentation inserted successfully');

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
