const mongoose = require('mongoose');
const TerraformTemplate = require('./models/TerraformTemplate');
require('dotenv').config();

const staticTerraformTemplates = [
  // AWS VPC Demo
  {
    subjectName: 'AWS VPC with Public and Private Subnets',
    description: 'Create a complete VPC setup with public and private subnets, internet gateway, and NAT gateway',
    yamlContent: `# AWS VPC Configuration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "main-vpc"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name = "main-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.\${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  map_public_ip_on_launch = true
  
  tags = {
    Name = "public-subnet-\${count.index + 1}"
    Type = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.\${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name = "private-subnet-\${count.index + 1}"
    Type = "private"
  }
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}`,
    category: 'networking',
    provider: 'aws',
    tags: ['vpc', 'networking', 'subnets', 'igw', 'nat'],
    difficulty: 'intermediate',
    estimatedTime: '20 minutes',
    prerequisites: ['AWS account configured', 'Terraform installed'],
    author: 'System',
    isActive: true,
    commonIssues: ['CIDR block conflicts with existing VPCs', 'Insufficient IP addresses', 'Availability zone not available'],
    solutions: ['Check existing VPC CIDR blocks before creating', 'Use larger CIDR blocks (e.g., /16 instead of /24)', 'Verify availability zones in region'],
    requiredFiles: ['main.tf', 'variables.tf', 'outputs.tf'],
    troubleshootingSteps: '1. Run terraform plan to check for conflicts\\n2. Verify AWS credentials are configured\\n3. Check region availability\\n4. Review VPC console for overlapping CIDRs',
    references: ['https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/vpc'],
    versionCompatibility: 'Terraform >= 1.0, AWS Provider >= 4.0'
  },
  
  // AWS EC2 Demo
  {
    subjectName: 'EC2 Instance with Security Group',
    description: 'Launch an EC2 instance with proper security group configuration and user data',
    yamlContent: `# AWS EC2 Instance Configuration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# EC2 Instance
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  subnet_id     = aws_subnet.public[0].id
  
  vpc_security_group_ids = [aws_security_group.web.id]
  
  tags = {
    Name = "\${var.app_name}-server"
    Environment = var.environment
  }
}

# Security Group
resource "aws_security_group" "web" {
  name_prefix = "\${var.app_name}-sg-"
  vpc_id      = aws_vpc.main.id
  
  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # HTTP access
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "\${var.app_name}-sg"
  }
}

# Get latest Ubuntu AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"]
  }
  owners = ["099720109477"]
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "web-app"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "dev"
}`,
    category: 'compute',
    provider: 'aws',
    tags: ['ec2', 'instance', 'security-group', 'ubuntu'],
    difficulty: 'beginner',
    estimatedTime: '15 minutes',
    prerequisites: ['AWS VPC existing', 'SSH key pair'],
    author: 'System',
    isActive: true,
    commonIssues: ['Instance fails to start', 'Cannot SSH into instance', 'Security group blocking traffic'],
    solutions: ['Check instance state in console', 'Verify security group allows SSH from your IP', 'Ensure key pair is correctly associated'],
    requiredFiles: ['main.tf', 'variables.tf', 'outputs.tf', 'key.pem'],
    troubleshootingSteps: '1. Verify AMI is available in region\n2. Check subnet exists and is in VPC\n3. Verify security group rules\n4. Check instance logs in console',
    references: ['https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/instance'],
    versionCompatibility: 'Terraform >= 1.0, AWS Provider >= 4.0'
  },

  // AWS RDS Demo
  {
    subjectName: 'RDS PostgreSQL Database',
    description: 'Create a secure RDS PostgreSQL instance with backup and monitoring',
    yamlContent: `# AWS RDS PostgreSQL Configuration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "\${var.app_name}-subnet-group"
  subnet_ids = aws_subnet.private[*].id
  
  tags = {
    Name = "\${var.app_name}-subnet-group"
    Environment = var.environment
  }
}

# RDS Instance
resource "aws_db_instance" "postgres" {
  identifier = "\${var.app_name}-db"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class
  
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp2"
  storage_encrypted     = true
  
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  
  backup_retention_period = var.backup_retention_period
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = var.skip_final_snapshot
  
  deletion_protection = false
  
  tags = {
    Name = "\${var.app_name}-postgres"
    Environment = var.environment
  }
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "web-app"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  description = "Initial storage allocation (GB)"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "appdb"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "appuser"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot when destroying"
  type        = bool
  default     = false
}`,
    category: 'storage',
    provider: 'aws',
    tags: ['rds', 'postgresql', 'database', 'backup'],
    difficulty: 'intermediate',
    estimatedTime: '25 minutes',
    prerequisites: ['VPC with private subnets', 'Database credentials'],
    author: 'System',
    isActive: true,
    commonIssues: ['Database creation timeout', 'Cannot connect to database', 'Insufficient storage'],
    solutions: ['Check VPC and subnet configuration', 'Verify security group allows database port', 'Increase allocated storage'],
    requiredFiles: ['main.tf', 'variables.tf', 'outputs.tf'],
    troubleshootingSteps: '1. Verify subnet group has at least 2 subnets in different AZs\n2. Check security group allows inbound traffic on port 5432\n3. Verify IAM permissions for RDS\n4. Check database event logs',
    references: ['https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/db_instance'],
    versionCompatibility: 'Terraform >= 1.0, AWS Provider >= 4.0'
  },

  // GCP VPC Demo
  {
    subjectName: 'GCP VPC with Firewall Rules',
    description: 'Create a GCP VPC network with custom firewall rules for web and SSH access',
    yamlContent: `# GCP VPC Configuration
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
}

# VPC Network
resource "google_compute_network" "main" {
  name                    = "\${var.app_name}-vpc"
  auto_create_subnetworks = false
  
  routing_mode = "REGIONAL"
  
  tags = {
    environment = var.environment
  }
}

# Subnets
resource "google_compute_subnetwork" "public" {
  name          = "\${var.app_name}-public-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.gcp_region
  network       = google_compute_network.main.id
  
  private_ip_google_access = false
  
  tags = {
    environment = var.environment
    type        = "public"
  }
}

# Firewall Rules
resource "google_compute_firewall" "allow_ssh" {
  name    = "\${var.app_name}-allow-ssh"
  network = google_compute_network.main.name
  
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
  
  source_ranges = ["0.0.0.0/0"]
  
  target_tags = ["ssh"]
}

resource "google_compute_firewall" "allow_http" {
  name    = "\${var.app_name}-allow-http"
  network = google_compute_network.main.name
  
  allow {
    protocol = "tcp"
    ports    = ["80"]
  }
  
  source_ranges = ["0.0.0.0/0"]
  
  target_tags = ["web"]
}

# Variables
variable "gcp_project" {
  description = "GCP project ID"
  type        = string
}

variable "gcp_region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "web-app"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "dev"
}`,
    category: 'networking',
    provider: 'gcp',
    tags: ['vpc', 'firewall', 'network', 'gcp'],
    difficulty: 'intermediate',
    estimatedTime: '15 minutes',
    prerequisites: ['GCP project', 'Compute API enabled'],
    author: 'System',
    isActive: true,
    commonIssues: ['VPC creation fails', 'Firewall rules not applying', 'Subnet CIDR conflicts'],
    solutions: ['Verify Compute API is enabled', 'Check project permissions', 'Ensure CIDR ranges do not overlap'],
    requiredFiles: ['main.tf', 'variables.tf', 'outputs.tf'],
    troubleshootingSteps: '1. Verify GCP credentials are configured\n2. Check project ID is correct\n3. Ensure Compute API is enabled\n4. Review GCP console for error details',
    references: ['https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_network'],
    versionCompatibility: 'Terraform >= 1.0, GCP Provider >= 4.0'
  },

  // GCP GCE Demo
  {
    subjectName: 'Google Compute Engine Instance',
    description: 'Create a GCE instance with startup script and proper tags',
    yamlContent: `# GCP Compute Engine Configuration
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
}

# Compute Engine Instance
resource "google_compute_instance" "web" {
  name         = "\${var.app_name}-instance"
  machine_type = var.machine_type
  zone         = var.gcp_zone
  
  tags = ["web", "http-server", "https-server"]
  
  boot_disk {
    initialize_params {
      image = data.google_compute_image.ubuntu.self_link
      size  = var.disk_size
      type  = "pd-balanced"
    }
  }
  
  network_interface {
    network    = google_compute_network.main.id
    subnetwork = google_compute_subnetwork.public.id
    
    access_config {
      # Ephemeral IP
    }
  }
  
  metadata = {
    startup-script = "#!/bin/bash\\napt-get update\\napt-get install -y nginx"
  }
  
  labels = {
    environment = var.environment
    app         = var.app_name
  }
}

# Get latest Ubuntu image
data "google_compute_image" "ubuntu" {
  family  = "ubuntu-2004-lts"
  project = "ubuntu-os-cloud"
}

# Variables
variable "gcp_project" {
  description = "GCP project ID"
  type        = string
}

variable "gcp_region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "gcp_zone" {
  description = "GCP zone"
  type        = string
  default     = "us-central1-a"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "web-app"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "dev"
}

variable "machine_type" {
  description = "Machine type"
  type        = string
  default     = "e2-medium"
}

variable "disk_size" {
  description = "Boot disk size in GB"
  type        = number
  default     = 20
}`,
    category: 'compute',
    provider: 'gcp',
    tags: ['gce', 'instance', 'compute-engine', 'startup-script'],
    difficulty: 'beginner',
    estimatedTime: '10 minutes',
    prerequisites: ['GCP project', 'VPC network'],
    author: 'System',
    isActive: true,
    commonIssues: ['Instance fails to start', 'Startup script not executing', 'Cannot SSH into instance'],
    solutions: ['Check machine type availability in zone', 'Verify startup script syntax', 'Ensure firewall allows SSH'],
    requiredFiles: ['main.tf', 'variables.tf', 'outputs.tf'],
    troubleshootingSteps: '1. Verify zone exists in region\n2. Check machine type is available\n3. Review startup script logs\n4. Ensure network and subnet exist',
    references: ['https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_instance'],
    versionCompatibility: 'Terraform >= 1.0, GCP Provider >= 4.0'
  },

  // Azure VNet Demo
  {
    subjectName: 'Azure Virtual Network with Subnets',
    description: 'Create an Azure VNet with public and private subnets, NSG, and route table',
    yamlContent: `# Azure Virtual Network Configuration
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "\${var.app_name}-rg"
  location = var.azure_location
  
  tags = {
    environment = var.environment
  }
}

# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = "\${var.app_name}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  
  tags = {
    environment = var.environment
  }
}

# Public Subnet
resource "azurerm_subnet" "public" {
  name                 = "\${var.app_name}-public-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]
}

# Private Subnet
resource "azurerm_subnet" "private" {
  name                 = "\${var.app_name}-private-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.2.0/24"]
}

# Network Security Group
resource "azurerm_network_security_group" "public" {
  name                = "\${var.app_name}-public-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  
  security_rule {
    name                       = "SSH"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
  
  security_rule {
    name                       = "HTTP"
    priority                   = 1002
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
  
  tags = {
    environment = var.environment
  }
}

# Variables
variable "azure_location" {
  description = "Azure region"
  type        = string
  default     = "East US"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "web-app"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "dev"
}`,
    category: 'networking',
    provider: 'azure',
    tags: ['vnet', 'subnet', 'nsg', 'azure'],
    difficulty: 'intermediate',
    estimatedTime: '20 minutes',
    prerequisites: ['Azure subscription', 'Resource group'],
    author: 'System',
    isActive: true,
    commonIssues: ['VNet creation fails', 'Subnet CIDR conflicts', 'NSG rules not applying'],
    solutions: ['Verify Azure credentials', 'Check address space availability', 'Ensure NSG is associated with subnet'],
    requiredFiles: ['main.tf', 'variables.tf', 'outputs.tf'],
    troubleshootingSteps: '1. Verify Azure CLI is authenticated\n2. Check subscription has sufficient quota\n3. Review Azure portal for error details\n4. Ensure location is valid',
    references: ['https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/virtual_network'],
    versionCompatibility: 'Terraform >= 1.0, Azure Provider >= 3.0'
  },

  // Azure VM Demo
  {
    subjectName: 'Azure Virtual Machine with Extensions',
    description: 'Create an Azure VM with custom script extension and managed disk',
    yamlContent: `# Azure Virtual Machine Configuration
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Public IP
resource "azurerm_public_ip" "main" {
  name                = "\${var.app_name}-pip"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Dynamic"
  sku                = "Basic"
  
  tags = {
    environment = var.environment
  }
}

# Network Interface
resource "azurerm_network_interface" "main" {
  name                = "\${var.app_name}-nic"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  
  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.public.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.main.id
  }
  
  tags = {
    environment = var.environment
  }
}

# Virtual Machine
resource "azurerm_linux_virtual_machine" "main" {
  name                  = "\${var.app_name}-vm"
  location              = azurerm_resource_group.main.location
  resource_group_name   = azurerm_resource_group.main.name
  network_interface_ids = [azurerm_network_interface.main.id]
  size                  = var.vm_size
  
  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }
  
  source_image_reference {
    publisher = "Canonical"
    offer     = "UbuntuServer"
    sku       = "18.04-LTS"
    version   = "latest"
  }
  
  admin_username = var.admin_username
  admin_ssh_key {
    username   = var.admin_username
    public_key = file(var.ssh_public_key_path)
  }
  
  tags = {
    environment = var.environment
  }
}

# Variables
variable "azure_location" {
  description = "Azure region"
  type        = string
  default     = "East US"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "web-app"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "dev"
}

variable "vm_size" {
  description = "VM size"
  type        = string
  default     = "Standard_B1s"
}

variable "admin_username" {
  description = "Admin username"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}`,
    category: 'compute',
    provider: 'azure',
    tags: ['vm', 'virtual-machine', 'ssh', 'azure'],
    difficulty: 'intermediate',
    estimatedTime: '25 minutes',
    prerequisites: ['Azure VNet', 'SSH key pair'],
    author: 'System',
    isActive: true,
    commonIssues: ['VM provisioning fails', 'Cannot SSH into VM', 'Public IP not assigned'],
    solutions: ['Verify VM size is available in region', 'Check SSH key format', 'Ensure NSG allows SSH'],
    requiredFiles: ['main.tf', 'variables.tf', 'outputs.tf', '~/.ssh/id_rsa.pub'],
    troubleshootingSteps: '1. Check Azure portal for VM status\n2. Verify network interface is connected\n3. Review boot diagnostics\n4. Ensure SSH key is in correct format',
    references: ['https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/linux_virtual_machine'],
    versionCompatibility: 'Terraform >= 1.0, Azure Provider >= 3.0'
  },

  // EKS Demo
  {
    subjectName: 'EKS Cluster with Deployment',
    description: 'Create an EKS cluster with sample deployment and service',
    yamlContent: `# EKS Cluster with Kubernetes Resources
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "\${var.app_name}-eks"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.eks_version
  
  vpc_config {
    subnet_ids = aws_subnet.private[*].id
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs    = ["0.0.0.0/0"]
  }
  
  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
  ]
  
  tags = {
    Name = "\${var.app_name}-eks"
    Environment = var.environment
  }
}

# EKS Node Group
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "\${var.app_name}-nodes"
  node_role_arn   = aws_iam_role.eks_node.arn
  subnet_ids      = aws_subnet.private[*].id
  
  scaling_config {
    desired_size = var.desired_nodes
    max_size     = var.max_nodes
    min_size     = var.min_nodes
  }
  
  instance_types = [var.instance_type]
  
  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]
  
  tags = {
    Name = "\${var.app_name}-nodes"
    Environment = var.environment
  }
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "web-app"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "dev"
}

variable "eks_version" {
  description = "EKS version"
  type        = string
  default     = "1.28"
}

variable "instance_type" {
  description = "Node instance type"
  type        = string
  default     = "t3.medium"
}

variable "desired_nodes" {
  description = "Desired number of nodes"
  type        = number
  default     = 2
}

variable "min_nodes" {
  description = "Minimum number of nodes"
  type        = number
  default     = 1
}

variable "max_nodes" {
  description = "Maximum number of nodes"
  type        = number
  default     = 3
}`,
    category: 'other',
    provider: 'aws',
    tags: ['eks', 'kubernetes', 'cluster', 'containers'],
    difficulty: 'advanced',
    estimatedTime: '45 minutes',
    prerequisites: ['AWS VPC', 'IAM permissions', 'kubectl'],
    author: 'System',
    isActive: true,
    commonIssues: ['Cluster creation timeout', 'Nodes not joining cluster', 'IAM permission errors'],
    solutions: ['Verify IAM role has correct permissions', 'Check VPC and subnet configuration', 'Ensure EKS version is available in region'],
    requiredFiles: ['main.tf', 'variables.tf', 'outputs.tf', 'kubeconfig'],
    troubleshootingSteps: '1. Check CloudFormation stack events\\n2. Verify IAM role policies\\n3. Review EKS cluster logs\\n4. Ensure subnets have tags for auto-discovery',
    references: ['https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/eks_cluster'],
    versionCompatibility: 'Terraform >= 1.0, AWS Provider >= 5.0'
  },

  // AWS S3 Bucket
  {
    subjectName: 'AWS S3 Bucket with Versioning',
    description: 'Create an S3 bucket with versioning, encryption, and lifecycle policy',
    yamlContent: `# AWS S3 Bucket Configuration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# S3 Bucket
resource "aws_s3_bucket" "main" {
  bucket = var.bucket_name
  
  tags = {
    Name        = var.bucket_name
    Environment = var.environment
  }
}

# Bucket Versioning
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Public Access Block
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Variables
variable "bucket_name" {
  description = "S3 bucket name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "dev"
}`,
    category: 'storage',
    provider: 'aws',
    tags: ['s3', 'storage', 'bucket', 'versioning'],
    difficulty: 'beginner',
    estimatedTime: '10 minutes',
    prerequisites: ['AWS account', 'Unique bucket name'],
    author: 'System',
    isActive: true,
    commonIssues: ['Bucket name already exists', 'Cannot access bucket', 'Versioning not enabled'],
    solutions: ['Use a globally unique bucket name', 'Check IAM permissions', 'Verify versioning configuration'],
    requiredFiles: ['main.tf', 'variables.tf', 'outputs.tf'],
    troubleshootingSteps: '1. Verify bucket name is globally unique\\n2. Check IAM permissions for S3\\n3. Review bucket policy\\n4. Ensure region is correct',
    references: ['https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket'],
    versionCompatibility: 'Terraform >= 1.0, AWS Provider >= 4.0'
  },

  // AWS Lambda
  {
    subjectName: 'AWS Lambda Function with API Gateway',
    description: 'Create a Lambda function with API Gateway integration',
    yamlContent: `# AWS Lambda Configuration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Lambda Function
resource "aws_lambda_function" "main" {
  function_name = var.function_name
  role          = aws_iam_role.lambda_role.arn
  runtime       = var.runtime
  handler       = var.handler
  filename      = var.lambda_zip_path
  
  timeout = var.timeout
  memory_size = var.memory_size

  environment {
    variables = var.environment_variables
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "\${var.function_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# API Gateway
resource "aws_apigatewayv2_api" "main" {
  name          = var.api_name
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "main" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.main.arn
}

resource "aws_apigatewayv2_route" "main" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/\${aws_apigatewayv2_integration.main.id}"
}

# Variables
variable "function_name" {
  description = "Lambda function name"
  type        = string
}

variable "runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "nodejs18.x"
}

variable "handler" {
  description = "Lambda handler"
  type        = string
  default     = "index.handler"
}

variable "lambda_zip_path" {
  description = "Path to Lambda zip file"
  type        = string
}

variable "timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}

variable "memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 128
}

variable "environment_variables" {
  description = "Environment variables for Lambda"
  type        = map(string)
  default     = {}
}

variable "api_name" {
  description = "API Gateway name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}`,
    category: 'compute',
    provider: 'aws',
    tags: ['lambda', 'serverless', 'api-gateway', 'functions'],
    difficulty: 'intermediate',
    estimatedTime: '30 minutes',
    prerequisites: ['Lambda zip file', 'IAM permissions'],
    author: 'System',
    isActive: true,
    commonIssues: ['Lambda timeout', 'Memory limit exceeded', 'API Gateway integration fails'],
    solutions: ['Increase timeout and memory settings', 'Optimize Lambda code', 'Check IAM role permissions'],
    requiredFiles: ['main.tf', 'variables.tf', 'outputs.tf', 'lambda.zip'],
    troubleshootingSteps: '1. Verify Lambda zip file exists\\n2. Check IAM role has correct permissions\\n3. Review Lambda logs in CloudWatch\\n4. Test Lambda function independently',
    references: ['https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function'],
    versionCompatibility: 'Terraform >= 1.0, AWS Provider >= 4.0'
  },

  // AWS CloudWatch
  {
    subjectName: 'AWS CloudWatch Alarms and Dashboard',
    description: 'Create CloudWatch alarms and dashboard for monitoring',
    yamlContent: `# AWS CloudWatch Configuration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# CloudWatch Alarm for CPU Utilization
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "\${var.instance_id}-cpu-high"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 CPU utilization"
  alarm_actions       = [aws_sns_topic.main.arn]

  dimensions = {
    InstanceId = var.instance_id
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "main" {
  name = var.sns_topic_name
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.main.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = var.dashboard_name

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", "InstanceId", var.instance_id]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "EC2 CPU Utilization"
        }
      }
    ]
  })
}

# Variables
variable "instance_id" {
  description = "EC2 instance ID to monitor"
  type        = string
}

variable "sns_topic_name" {
  description = "SNS topic name for alerts"
  type        = string
  default     = "devops-alerts"
}

variable "alert_email" {
  description = "Email address for alerts"
  type        = string
}

variable "dashboard_name" {
  description = "CloudWatch dashboard name"
  type        = string
  default     = "devops-dashboard"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}`,
    category: 'monitoring',
    provider: 'aws',
    tags: ['cloudwatch', 'monitoring', 'alarms', 'sns'],
    difficulty: 'intermediate',
    estimatedTime: '20 minutes',
    prerequisites: ['EC2 instance', 'SNS subscription'],
    author: 'System',
    isActive: true,
    commonIssues: ['Alarm not triggering', 'Dashboard not displaying metrics', 'SNS notifications not received'],
    solutions: ['Check metric data is being sent', 'Verify IAM permissions', 'Ensure email subscription is confirmed'],
    requiredFiles: ['main.tf', 'variables.tf', 'outputs.tf'],
    troubleshootingSteps: '1. Verify instance ID is correct\\n2. Check CloudWatch agent is running\\n3. Confirm SNS email subscription\\n4. Review alarm history',
    references: ['https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_metric_alarm'],
    versionCompatibility: 'Terraform >= 1.0, AWS Provider >= 4.0'
  },

  // AWS Route53
  {
    subjectName: 'AWS Route53 Hosted Zone and Records',
    description: 'Create Route53 hosted zone with DNS records',
    yamlContent: `# AWS Route53 Configuration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Route53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Environment = var.environment
  }
}

# A Record
resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.\${var.domain_name}"
  type    = "A"
  ttl     = "300"
  records = [var.elb_ip]
}

# CNAME Record
resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.\${var.domain_name}"
  type    = "CNAME"
  ttl     = "300"
  records = [var.api_endpoint]
}

# MX Records for Email
resource "aws_route53_record" "mx" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "MX"
  ttl     = "300"
  records = [
    "10 mail1.\${var.domain_name}",
    "20 mail2.\${var.domain_name}"
  ]
}

# Variables
variable "domain_name" {
  description = "Domain name for hosted zone"
  type        = string
}

variable "elb_ip" {
  description = "Load balancer IP address"
  type        = string
}

variable "api_endpoint" {
  description = "API endpoint for CNAME"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}`,
    category: 'networking',
    provider: 'aws',
    tags: ['route53', 'dns', 'domain', 'records'],
    difficulty: 'beginner',
    estimatedTime: '15 minutes',
    prerequisites: ['Domain name registered', 'AWS account'],
    author: 'System',
    isActive: true,
    commonIssues: ['Domain not resolving', 'Record creation fails', 'NS delegation issues'],
    solutions: ['Verify NS records are delegated', 'Check IAM permissions', 'Ensure domain is registered'],
    requiredFiles: ['main.tf', 'variables.tf', 'outputs.tf'],
    troubleshootingSteps: '1. Verify domain is registered\\n2. Check NS records at registrar\\n3. Use dig or nslookup to test\\n4. Review Route53 console',
    references: ['https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route53_zone'],
    versionCompatibility: 'Terraform >= 1.0, AWS Provider >= 4.0'
  },

  // AWS Application Load Balancer
  {
    subjectName: 'AWS Application Load Balancer',
    description: 'Create an ALB with target groups and listeners',
    yamlContent: `# AWS ALB Configuration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = var.alb_name
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.security_group_id]
  subnets            = var.subnet_ids

  enable_deletion_protection = false

  tags = {
    Environment = var.environment
  }
}

# Target Group
resource "aws_lb_target_group" "main" {
  name     = var.target_group_name
  port     = var.target_port
  protocol = var.target_protocol
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = var.health_check_path
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }
}

# Listener
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = var.listener_port
  protocol          = var.listener_protocol

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# Variables
variable "alb_name" {
  description = "ALB name"
  type        = string
}

variable "security_group_id" {
  description = "Security group ID for ALB"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for ALB"
  type        = list(string)
}

variable "target_group_name" {
  description = "Target group name"
  type        = string
}

variable "target_port" {
  description = "Target port"
  type        = number
  default     = 80
}

variable "target_protocol" {
  description = "Target protocol"
  type        = string
  default     = "HTTP"
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "health_check_path" {
  description = "Health check path"
  type        = string
  default     = "/health"
}

variable "listener_port" {
  description = "Listener port"
  type        = number
  default     = 80
}

variable "listener_protocol" {
  description = "Listener protocol"
  type        = string
  default     = "HTTP"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}`,
    category: 'networking',
    provider: 'aws',
    tags: ['alb', 'load-balancer', 'target-group', 'listener'],
    difficulty: 'intermediate',
    estimatedTime: '25 minutes',
    prerequisites: ['VPC with subnets', 'Security group', 'EC2 instances'],
    author: 'System',
    isActive: true,
    commonIssues: ['ALB not routing traffic', 'Health check failing', 'Target registration fails'],
    solutions: ['Check security group rules', 'Verify health check path', 'Ensure targets are in same VPC'],
    requiredFiles: ['main.tf', 'variables.tf', 'outputs.tf'],
    troubleshootingSteps: '1. Verify subnets are in different AZs\\n2. Check security group allows traffic\\n3. Test health check endpoint\\n4. Review ALB access logs',
    references: ['https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lb'],
    versionCompatibility: 'Terraform >= 1.0, AWS Provider >= 4.0'
  },

  // AWS Auto Scaling Group
  {
    subjectName: 'AWS Auto Scaling Group with Launch Template',
    description: 'Create an ASG with launch template and scaling policies',
    yamlContent: `# AWS Auto Scaling Group Configuration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Launch Template
resource "aws_launch_template" "main" {
  name          = var.launch_template_name
  image_id      = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [var.security_group_id]
  }

  user_data = base64encode(var.user_data_script)

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = var.instance_name
    }
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  desired_capacity    = var.desired_capacity
  max_size            = var.max_size
  min_size            = var.min_size
  vpc_zone_identifier = var.subnet_ids

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  target_group_arns = [var.target_group_arn]

  tag {
    key                 = "Name"
    value               = var.instance_name
    propagate_at_launch = true
  }
}

# Scaling Policy
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_cloudwatch_metric_alarm" "scale_up" {
  alarm_name          = "\${var.instance_name}-scale-up"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "70"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }
}

# Variables
variable "launch_template_name" {
  description = "Launch template name"
  type        = string
}

variable "ami_id" {
  description = "AMI ID for instances"
  type        = string
}

variable "instance_type" {
  description = "Instance type"
  type        = string
  default     = "t2.micro"
}

variable "key_name" {
  description = "SSH key name"
  type        = string
}

variable "security_group_id" {
  description = "Security group ID"
  type        = string
}

variable "user_data_script" {
  description = "User data script"
  type        = string
  default     = ""
}

variable "instance_name" {
  description = "Instance name tag"
  type        = string
}

variable "desired_capacity" {
  description = "Desired capacity"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum size"
  type        = number
  default     = 4
}

variable "min_size" {
  description = "Minimum size"
  type        = number
  default     = 1
}

variable "subnet_ids" {
  description = "Subnet IDs"
  type        = list(string)
}

variable "target_group_arn" {
  description = "Target group ARN for ALB"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}`,
    category: 'compute',
    provider: 'aws',
    tags: ['autoscaling', 'asg', 'scaling', 'ec2'],
    difficulty: 'advanced',
    estimatedTime: '35 minutes',
    prerequisites: ['VPC', 'Launch template', 'Target group'],
    author: 'System',
    isActive: true,
    commonIssues: ['Instances not launching', 'Scaling not triggering', 'Health checks failing'],
    solutions: ['Check launch template configuration', 'Verify IAM roles', 'Review scaling policies'],
    requiredFiles: ['main.tf', 'variables.tf', 'outputs.tf', 'user-data.sh'],
    troubleshootingSteps: '1. Verify launch template is valid\\n2. Check IAM instance profile\\n3. Review scaling activity history\\n4. Test instance launch manually',
    references: ['https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/autoscaling_group'],
    versionCompatibility: 'Terraform >= 1.0, AWS Provider >= 4.0'
  }
];

async function seedTerraformTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing templates (optional - remove if you want to keep existing)
    await TerraformTemplate.deleteMany({});
    console.log('Cleared existing templates');

    // Insert static templates
    const insertedTemplates = await TerraformTemplate.insertMany(staticTerraformTemplates);
    console.log(`Successfully seeded ${insertedTemplates.length} Terraform templates`);

    // Display inserted templates
    insertedTemplates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.subjectName} (${template.provider})`);
    });

  } catch (error) {
    console.error('Error seeding Terraform templates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

seedTerraformTemplates();
