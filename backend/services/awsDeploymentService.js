const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');

class AWSDeploymentService {
  constructor() {
    this.ssh = null;
  }

  static getComposeStartCommands(projectName, composeCommand = 'docker compose') {
    return [
      `cd ~/${projectName} && ${composeCommand} pull`,
      `cd ~/${projectName} && ${composeCommand} up -d --remove-orphans`
    ];
  }

  static buildComposeFileContent(projectName, backendImage, frontendImage, deploymentScope = 'both', dockerHubUsername = null) {
    const safeBackendImage = AWSDeploymentService.normalizeImage(backendImage, 'nginx:latest', dockerHubUsername);
    const safeFrontendImage = AWSDeploymentService.normalizeImage(frontendImage, 'nginx:latest', dockerHubUsername);

    let composeContent = `services:\n`;

    if (deploymentScope === 'both' || deploymentScope === 'backend') {
      composeContent += `  backend:
    image: ${safeBackendImage}
    container_name: ${projectName}-backend
    restart: unless-stopped
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
      - PORT=5001
    networks:
      - app-network\n\n`;
    }

    if (deploymentScope === 'both' || deploymentScope === 'frontend') {
      composeContent += `  frontend:
    image: ${safeFrontendImage}
    container_name: ${projectName}-frontend
    restart: unless-stopped
    ports:
      - "8080:80"`;

      if (deploymentScope === 'both') {
        composeContent += `
    depends_on:
      - backend`;
      }

      composeContent += `
    networks:
      - app-network\n\n`;
    }

    composeContent += `networks:
  app-network:
    driver: bridge
`;

    return composeContent;
  }

  async execRemoteCommand(command, options = {}) {
    const result = await this.ssh.execCommand(command);

    if (result.code !== 0 && !options.allowFailure) {
      const detail = result.stderr?.trim() || result.stdout?.trim() || `Command exited with code ${result.code}`;
      throw new Error(detail);
    }

    return result;
  }

  static getDockerInstallCommands(osFamily = 'ubuntu') {
    if (osFamily === 'amazon' || osFamily === 'amzn') {
      return [
        'sudo yum update -y',
        'sudo yum install -y docker',
        'sudo systemctl start docker',
        'sudo systemctl enable docker',
        'sudo usermod -aG docker $USER || true',
        'sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose',
        'sudo chmod +x /usr/local/bin/docker-compose',
        '(docker compose version || docker-compose --version || true)'
      ];
    }

    return [
      'sudo apt-get update -y',
      'sudo apt-get install -y docker.io docker-compose-plugin',
      'sudo systemctl start docker',
      'sudo systemctl enable docker',
      'sudo usermod -aG docker $USER || true',
      'sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose',
      'sudo chmod +x /usr/local/bin/docker-compose',
      '(docker compose version || docker-compose --version || true)'
    ];
  }

  static parseEnvironmentVariables(rawValue) {
    if (!rawValue) {
      return [];
    }

    return rawValue
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((entry) => {
        const separatorIndex = entry.indexOf('=');
        if (separatorIndex === -1) {
          return null;
        }

        const name = entry.slice(0, separatorIndex).trim();
        const value = entry.slice(separatorIndex + 1).trim();
        return name && value ? { name, value } : null;
      })
      .filter(Boolean);
  }

  async connectToServer(config) {
    const { host, username, pemKey, port = 22 } = config;
    
    this.ssh = new NodeSSH();
    
    try {
      await this.ssh.connect({
        host,
        port,
        username,
        privateKey: pemKey,
        readyTimeout: 30000
      });
      
      return { success: true, message: 'SSH connection established' };
    } catch (error) {
      console.error('SSH connection error:', error);
      return { success: false, message: `SSH connection failed: ${error.message}` };
    }
  }

  async disconnect() {
    if (this.ssh) {
      await this.ssh.dispose();
      this.ssh = null;
    }
  }

  async installDocker() {
    const osFamily = await this.detectOsFamily();
    const commands = AWSDeploymentService.getDockerInstallCommands(osFamily);

    for (const cmd of commands) {
      try {
        await this.execRemoteCommand(cmd);
      } catch (error) {
        console.error(`Command failed: ${cmd}`, error);
        return { success: false, message: `Failed to install Docker: ${error.message}` };
      }
    }

    return { success: true, message: 'Docker installed successfully' };
  }

  async detectOsFamily() {
    try {
      const result = await this.execRemoteCommand('cat /etc/os-release', { allowFailure: true });
      if (result.stdout && result.stdout.toLowerCase().includes('amazon')) {
        return 'amazon';
      }
      if (result.stdout && result.stdout.toLowerCase().includes('ubuntu')) {
        return 'ubuntu';
      }
      return 'ubuntu';
    } catch (error) {
      return 'ubuntu';
    }
  }

  async installDockerCompose() {
    const commands = [
      'sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose',
      'sudo chmod +x /usr/local/bin/docker-compose',
      '(docker compose version || docker-compose --version || true)'
    ];

    for (const cmd of commands) {
      try {
        await this.execRemoteCommand(cmd);
      } catch (error) {
        console.error(`Command failed: ${cmd}`, error);
        return { success: false, message: `Failed to install Docker Compose: ${error.message}` };
      }
    }

    return { success: true, message: 'Docker Compose installed successfully' };
  }

  async installNginx() {
    const osFamily = await this.detectOsFamily();
    const commands = osFamily === 'amazon' || osFamily === 'amzn'
      ? [
          'sudo yum install -y nginx || sudo amazon-linux-extras install nginx1 -y',
          'sudo systemctl start nginx',
          'sudo systemctl enable nginx'
        ]
      : [
          'sudo apt-get update -y',
          'sudo apt-get install -y nginx',
          'sudo systemctl start nginx',
          'sudo systemctl enable nginx'
        ];

    for (const cmd of commands) {
      try {
        await this.execRemoteCommand(cmd);
      } catch (error) {
        console.error(`Command failed: ${cmd}`, error);
        return { success: false, message: `Failed to install Nginx: ${error.message}` };
      }
    }

    return { success: true, message: 'Nginx installed successfully' };
  }

  async setupSSL(domain, email) {
    if (!domain) {
      return { success: true, message: 'SSL skipped - no domain provided' };
    }

    const osFamily = await this.detectOsFamily();
    const commands = osFamily === 'amazon' || osFamily === 'amzn'
      ? [
          'sudo yum install -y python3-certbot-nginx || true',
          `sudo certbot --nginx -d ${domain} --non-interactive --agree-tos --email ${email || 'admin@example.com'}`,
          'sudo systemctl restart nginx'
        ]
      : [
          'sudo apt-get update -y',
          'sudo apt-get install -y certbot python3-certbot-nginx',
          `sudo certbot --nginx -d ${domain} --non-interactive --agree-tos --email ${email || 'admin@example.com'}`,
          'sudo systemctl restart nginx'
        ];

    for (const cmd of commands) {
      try {
        await this.execRemoteCommand(cmd);
      } catch (error) {
        console.error(`Command failed: ${cmd}`, error);
        return { success: false, message: `Failed to setup SSL: ${error.message}` };
      }
    }

    return { success: true, message: 'SSL configured successfully' };
  }

  async createProjectDirectory(projectName) {
    try {
      await this.execRemoteCommand(`mkdir -p ~/${projectName}`);
      return { success: true, message: `Project directory created: ${projectName}` };
    } catch (error) {
      return { success: false, message: `Failed to create directory: ${error.message}` };
    }
  }

  async uploadFile(localPath, remotePath) {
    try {
      await this.ssh.putFile(localPath, remotePath);
      return { success: true, message: `File uploaded: ${remotePath}` };
    } catch (error) {
      return { success: false, message: `Failed to upload file: ${error.message}` };
    }
  }

  static isPlaceholderImageValue(image) {
    if (!image || typeof image !== 'string') {
      return true;
    }

    const trimmed = image.trim().toLowerCase();
    if (!trimmed) {
      return true;
    }

    const placeholderValues = [
      'my-html-site',
      'my-html',
      'my-app',
      'my-project',
      'my-site',
      'frontend',
      'backend',
      'app',
      'image',
      'docker-image',
      'placeholder',
      'example',
      'sample'
    ];

    return placeholderValues.some((value) => trimmed === value);
  }

  static normalizeImage(image, fallback = 'nginx:latest', dockerHubUsername = null) {
    if (!image || typeof image !== 'string') {
      return fallback;
    }

    const trimmed = image.trim();
    if (!trimmed) {
      return fallback;
    }

    const isBareRepoName = !trimmed.includes('/') && !trimmed.includes(':') && !trimmed.includes('@');
    if (dockerHubUsername && isBareRepoName) {
      return `${dockerHubUsername}/${trimmed}:latest`;
    }

    if (AWSDeploymentService.isPlaceholderImageValue(trimmed)) {
      return fallback;
    }

    return trimmed;
  }

  async createDockerComposeFile(projectName, backendImage, frontendImage, domain = null, deploymentScope = 'both', dockerHubUsername = null) {
    const composeContent = AWSDeploymentService.buildComposeFileContent(projectName, backendImage, frontendImage, deploymentScope, dockerHubUsername);

    try {
      await this.execRemoteCommand(`cat > ~/${projectName}/docker-compose.yml << 'EOF'\n${composeContent}\nEOF`);
      return { success: true, message: 'Docker Compose file created' };
    } catch (error) {
      return { success: false, message: `Failed to create docker-compose: ${error.message}` };
    }
  }

  async updateComposeFile(config, composeContent) {
    const { host, username, pemKey, projectName } = config;

    const connectionResult = await this.connectToServer({ host, username, pemKey });
    if (!connectionResult.success) {
      return connectionResult;
    }

    try {
      await this.execRemoteCommand(`mkdir -p ~/${projectName}`);
      await this.execRemoteCommand(`cat > ~/${projectName}/docker-compose.yml << 'EOF'\n${composeContent}\nEOF`);
      await this.execRemoteCommand(`cd ~/${projectName} && docker compose pull || docker-compose pull || true`);
      await this.execRemoteCommand(`cd ~/${projectName} && docker compose up -d --remove-orphans || docker-compose up -d --remove-orphans || true`);
      return { success: true, message: 'Compose file updated and containers refreshed' };
    } catch (error) {
      return { success: false, message: `Failed to update compose file: ${error.message}` };
    } finally {
      await this.disconnect();
    }
  }

  async createNginxConfig(domain, backendPort = 5001, frontendPort = 8080) {
    let nginxConfig;

    if (domain) {
      nginxConfig = `
server {
    listen 80;
    server_name ${domain};
`;

      if (frontendPort) {
        nginxConfig += `
    location / {
        proxy_pass http://localhost:${frontendPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
`;
      }

      if (backendPort) {
        nginxConfig += `
    location /api {
        proxy_pass http://localhost:${backendPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
`;
      }

      nginxConfig += `}
`;
    } else {
      nginxConfig = `
server {
    listen 80 default_server;
    server_name _;
`;

      if (frontendPort) {
        nginxConfig += `
    location / {
        proxy_pass http://localhost:${frontendPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
`;
      }

      if (backendPort) {
        nginxConfig += `
    location /api {
        proxy_pass http://localhost:${backendPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
`;
      }

      nginxConfig += `}
`;
    }

    try {
      const configName = domain || 'default';
      const sitesAvailablePath = `/etc/nginx/sites-available/${configName}`;
      const sitesEnabledPath = `/etc/nginx/sites-enabled/${configName}`;

      await this.execRemoteCommand(`sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled`, { allowFailure: true });
      await this.execRemoteCommand(`sudo cat > ${sitesAvailablePath} << 'EOF'\n${nginxConfig}\nEOF`, { allowFailure: true });

      if (domain) {
        await this.execRemoteCommand(`sudo ln -sf ${sitesAvailablePath} ${sitesEnabledPath}`, { allowFailure: true });
      } else {
        await this.execRemoteCommand(`sudo ln -sf ${sitesAvailablePath} /etc/nginx/sites-enabled/default`, { allowFailure: true });
      }

      await this.execRemoteCommand('sudo nginx -t', { allowFailure: true });
      await this.execRemoteCommand('sudo systemctl reload nginx', { allowFailure: true });

      return { success: true, message: 'Nginx configured successfully' };
    } catch (error) {
      return { success: false, message: `Failed to configure Nginx: ${error.message}` };
    }
  }

  async pullAndStartContainers(projectName) {
    try {
      const composeCommand = await this.detectComposeCommand();
      const commands = AWSDeploymentService.getComposeStartCommands(projectName, composeCommand);
      await this.execRemoteCommand(commands[0]);
      await this.execRemoteCommand(commands[1]);
      
      return { success: true, message: 'Containers started successfully' };
    } catch (error) {
      return { success: false, message: `Failed to start containers: ${error.message}` };
    }
  }

  async detectComposeCommand() {
    const probes = [
      { command: 'docker compose version', value: 'docker compose' },
      { command: 'docker-compose --version', value: 'docker-compose' }
    ];

    for (const probe of probes) {
      const result = await this.execRemoteCommand(probe.command, { allowFailure: true });
      if (result.code === 0) {
        return probe.value;
      }
    }

    return 'docker compose';
  }

  async getContainerPort(config) {
    const { host, username, pemKey, projectName } = config;

    const connectionResult = await this.connectToServer({ host, username, pemKey });
    if (!connectionResult.success) {
      return null;
    }

    try {
      const result = await this.ssh.execCommand(`cd ~/${projectName} && docker ps --format '{{.Names}}\t{{.Ports}}'`);
      const lines = (result.stdout || '').split(/\r?\n/).filter(Boolean);
      for (const line of lines) {
        const match = line.match(/:(\d+)->/);
        if (match) {
          return Number(match[1]);
        }
      }
      return null;
    } catch (error) {
      return null;
    } finally {
      await this.disconnect();
    }
  }

  async deployProject(config) {
    const {
      host,
      username,
      pemKey,
      projectName,
      backendImage,
      frontendImage,
      domain,
      email,
      enableSSL,
      deploymentScope = 'both',
      dockerHubUsername = null
    } = config;

    // Connect to server
    const connectionResult = await this.connectToServer({ host, username, pemKey });
    if (!connectionResult.success) {
      return connectionResult;
    }

    try {
      // Install dependencies
      const dockerResult = await this.installDocker();
      if (!dockerResult.success) return dockerResult;

      const composeResult = await this.installDockerCompose();
      if (!composeResult.success) return composeResult;

      const nginxResult = await this.installNginx();
      if (!nginxResult.success) return nginxResult;

      // Create project directory
      const dirResult = await this.createProjectDirectory(projectName);
      if (!dirResult.success) return dirResult;

      // Create docker-compose file
      const composeFileResult = await this.createDockerComposeFile(projectName, backendImage, frontendImage, domain, deploymentScope, dockerHubUsername);
      if (!composeFileResult.success) return composeFileResult;

      // Configure Nginx
      const nginxConfigResult = await this.createNginxConfig(domain, deploymentScope === 'both' || deploymentScope === 'backend' ? 5001 : null, deploymentScope === 'both' || deploymentScope === 'frontend' ? 8080 : null);
      if (!nginxConfigResult.success) return nginxConfigResult;

      // Setup SSL if domain provided and enabled
      if (domain && enableSSL) {
        const sslResult = await this.setupSSL(domain, email);
        if (!sslResult.success) return sslResult;
      }

      // Pull and start containers
      const deployResult = await this.pullAndStartContainers(projectName);
      if (!deployResult.success) return deployResult;

      const publishedPort = deploymentScope === 'both' || deploymentScope === 'frontend' ? 8080 : null;
      const url = domain
        ? `https://${domain}`
        : publishedPort
          ? `http://${host}:${publishedPort}`
          : `http://${host}`;

      return {
        success: true,
        message: 'Project deployed successfully',
        url,
        domain,
        host,
        port: publishedPort
      };

    } catch (error) {
      return { success: false, message: `Deployment failed: ${error.message}` };
    } finally {
      await this.disconnect();
    }
  }

  async testConnection(config) {
    const { host, username, pemKey } = config;
    
    const result = await this.connectToServer({ host, username, pemKey });
    await this.disconnect();
    
    return result;
  }

  async deleteDeployment(config) {
    const { host, username, pemKey, projectName } = config;

    const connectionResult = await this.connectToServer({ host, username, pemKey });
    if (!connectionResult.success) {
      return connectionResult;
    }

    try {
      // Stop and remove containers
      await this.ssh.execCommand(`cd ~/${projectName} && docker-compose down`);
      
      // Remove project directory
      await this.ssh.execCommand(`rm -rf ~/${projectName}`);
      
      // Remove nginx config
      await this.ssh.execCommand(`sudo rm -f /etc/nginx/sites-available/${projectName}`);
      await this.ssh.execCommand(`sudo rm -f /etc/nginx/sites-enabled/${projectName}`);
      await this.ssh.execCommand('sudo nginx -t');
      await this.ssh.execCommand('sudo systemctl reload nginx');

      return { success: true, message: 'Deployment deleted successfully' };
    } catch (error) {
      return { success: false, message: `Failed to delete deployment: ${error.message}` };
    } finally {
      await this.disconnect();
    }
  }

  async stopDeployment(config) {
    const { host, username, pemKey, projectName } = config;

    const connectionResult = await this.connectToServer({ host, username, pemKey });
    if (!connectionResult.success) {
      return connectionResult;
    }

    try {
      await this.ssh.execCommand(`cd ~/${projectName} && docker-compose stop`);
      
      return { success: true, message: 'Deployment stopped successfully' };
    } catch (error) {
      return { success: false, message: `Failed to stop deployment: ${error.message}` };
    } finally {
      await this.disconnect();
    }
  }

  async restartDeployment(config) {
    const { host, username, pemKey, projectName } = config;

    const connectionResult = await this.connectToServer({ host, username, pemKey });
    if (!connectionResult.success) {
      return connectionResult;
    }

    try {
      await this.ssh.execCommand(`cd ~/${projectName} && docker-compose restart`);
      
      return { success: true, message: 'Deployment restarted successfully' };
    } catch (error) {
      return { success: false, message: `Failed to restart deployment: ${error.message}` };
    } finally {
      await this.disconnect();
    }
  }

  async checkHealth(config) {
    const { host, username, pemKey, projectName, applicationUrl } = config;

    const connectionResult = await this.connectToServer({ host, username, pemKey });
    if (!connectionResult.success) {
      return { success: false, isHealthy: false, message: 'Cannot connect to server' };
    }

    try {
      // Check if containers are running
      const result = await this.ssh.execCommand(`cd ~/${projectName} && docker-compose ps`);
      
      if (result.stderr && result.stderr.includes('exited')) {
        return { success: true, isHealthy: false, message: 'Containers are not running' };
      }

      // Check container status
      const statusResult = await this.ssh.execCommand(`cd ~/${projectName} && docker-compose ps --format json`);
      
      if (statusResult.stdout) {
        const containers = JSON.parse(statusResult.stdout);
        const allRunning = containers.every(c => c.State === 'running');
        
        if (!allRunning) {
          return { success: true, isHealthy: false, message: 'Some containers are not running' };
        }
      }

      return { success: true, isHealthy: true, message: 'Deployment is healthy' };
    } catch (error) {
      return { success: true, isHealthy: false, message: `Health check failed: ${error.message}` };
    } finally {
      await this.disconnect();
    }
  }
}

module.exports = new AWSDeploymentService();
