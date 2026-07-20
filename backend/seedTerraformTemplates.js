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
    isActive: true
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
    isActive: true
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
    isActive: true
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
    isActive: true
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
    isActive: true
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
    isActive: true
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
    isActive: true
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
    isActive: true
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
