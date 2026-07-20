class DockerfileGenerator {
  generateDockerfile(config) {
    const {
      baseImage,
      appType,
      nodeVersion = '18',
      pythonVersion = '3.11',
      javaVersion = '17',
      port = '3000',
      workingDir = '/app',
      dependencies = [],
      buildCommands = [],
      startCommand,
      environment = {},
      exposePort = true,
      healthCheck = false,
      multiStage = false,
      optimizeForProduction = true
    } = config;

    // Handle dependencies that might come as string from textarea
    const processedDependencies = Array.isArray(dependencies) 
      ? dependencies 
      : (typeof dependencies === 'string' ? dependencies.split('\n').filter(dep => dep.trim()) : []);

    // Handle buildCommands that might come as string from textarea
    const processedBuildCommands = Array.isArray(buildCommands) 
      ? buildCommands 
      : (typeof buildCommands === 'string' ? buildCommands.split('\n').filter(cmd => cmd.trim()) : []);

    const processedConfig = {
      ...config,
      dependencies: processedDependencies,
      buildCommands: processedBuildCommands
    };

    let dockerfile = '';

    // Multi-stage build header
    if (multiStage) {
      dockerfile += this.generateMultiStageBuild(processedConfig);
    } else {
      dockerfile += this.generateSingleStageBuild(processedConfig);
    }

    return dockerfile;
  }

  generateSingleStageBuild(config) {
    const {
      baseImage,
      appType,
      nodeVersion = '18',
      pythonVersion = '3.11',
      javaVersion = '17',
      port = '3000',
      workingDir = '/app',
      dependencies = [],
      buildCommands = [],
      startCommand,
      environment = {},
      exposePort = true,
      healthCheck = false,
      optimizeForProduction = true
    } = config;

    let dockerfile = '';

    // FROM instruction
    if (baseImage) {
      dockerfile += `FROM ${baseImage}\n`;
    } else {
      dockerfile += this.getBaseImage(appType, nodeVersion, pythonVersion, javaVersion);
    }

    // Labels
    dockerfile += this.generateLabels(config);

    // Working directory
    dockerfile += `\nWORKDIR ${workingDir}\n`;

    // Environment variables
    if (Object.keys(environment).length > 0) {
      dockerfile += '\n# Environment variables\n';
      Object.entries(environment).forEach(([key, value]) => {
        dockerfile += `ENV ${key}=${value}\n`;
      });
    }

    // Copy dependencies first for better caching
    if (dependencies.length > 0) {
      dockerfile += '\n# Install dependencies\n';
      dependencies.forEach(dep => {
        dockerfile += `${dep}\n`;
      });
    }

    // Copy application code
    dockerfile += '\n# Copy application code\n';
    dockerfile += 'COPY . .\n';

    // Build commands
    if (buildCommands.length > 0) {
      dockerfile += '\n# Build application\n';
      buildCommands.forEach(cmd => {
        dockerfile += `RUN ${cmd}\n`;
      });
    }

    // Production optimizations
    if (optimizeForProduction) {
      dockerfile += this.generateProductionOptimizations(appType);
    }

    // Expose port
    if (exposePort && port) {
      dockerfile += `\nEXPOSE ${port}\n`;
    }

    // Health check
    if (healthCheck) {
      dockerfile += this.generateHealthCheck(appType, port);
    }

    // Start command
    dockerfile += '\n# Start application\n';
    if (startCommand) {
      dockerfile += `CMD ${startCommand}\n`;
    } else {
      dockerfile += this.getDefaultStartCommand(appType, port);
    }

    return dockerfile;
  }

  generateMultiStageBuild(config) {
    const {
      appType,
      nodeVersion = '18',
      pythonVersion = '3.11',
      javaVersion = '17',
      port = '3000',
      workingDir = '/app',
      dependencies = [],
      buildCommands = [],
      startCommand,
      environment = {},
      exposePort = true,
      healthCheck = false
    } = config;

    let dockerfile = '';

    // Build stage
    dockerfile += '# Build stage\n';
    dockerfile += this.getBuildImage(appType, nodeVersion, pythonVersion, javaVersion);
    dockerfile += '\nWORKDIR /app\n';

    // Copy and install dependencies in build stage
    if (dependencies.length > 0) {
      dockerfile += '\n# Install build dependencies\n';
      dependencies.forEach(dep => {
        dockerfile += `${dep}\n`;
      });
    }

    dockerfile += '\n# Copy source code\n';
    dockerfile += 'COPY . .\n';

    // Build commands
    if (buildCommands.length > 0) {
      dockerfile += '\n# Build application\n';
      buildCommands.forEach(cmd => {
        dockerfile += `RUN ${cmd}\n`;
      });
    }

    // Production stage
    dockerfile += '\n# Production stage\n';
    dockerfile += this.getProductionImage(appType, nodeVersion, pythonVersion, javaVersion);
    dockerfile += '\nWORKDIR ' + workingDir + '\n';

    // Environment variables
    if (Object.keys(environment).length > 0) {
      dockerfile += '\n# Environment variables\n';
      Object.entries(environment).forEach(([key, value]) => {
        dockerfile += `ENV ${key}=${value}\n`;
      });
    }

    // Copy built application from build stage
    dockerfile += '\n# Copy built application\n';
    dockerfile += this.getProductionCopyCommands(appType);

    // Expose port
    if (exposePort && port) {
      dockerfile += `\nEXPOSE ${port}\n`;
    }

    // Health check
    if (healthCheck) {
      dockerfile += this.generateHealthCheck(appType, port);
    }

    // Start command
    dockerfile += '\n# Start application\n';
    if (startCommand) {
      dockerfile += `CMD ${startCommand}\n`;
    } else {
      dockerfile += this.getDefaultStartCommand(appType, port);
    }

    return dockerfile;
  }

  getBaseImage(appType, nodeVersion, pythonVersion, javaVersion) {
    switch (appType) {
      case 'node':
        return `FROM node:${nodeVersion}-alpine\n`;
      case 'python':
        return `FROM python:${pythonVersion}-slim\n`;
      case 'java':
        return `FROM openjdk:${javaVersion}-slim\n`;
      case 'nginx':
        return 'FROM nginx:alpine\n';
      case 'apache':
        return 'FROM httpd:alpine\n';
      case 'static':
        return 'FROM nginx:alpine\n';
      default:
        return 'FROM alpine:latest\n';
    }
  }

  getBuildImage(appType, nodeVersion, pythonVersion, javaVersion) {
    switch (appType) {
      case 'node':
        return `FROM node:${nodeVersion}-alpine AS builder\n`;
      case 'python':
        return `FROM python:${pythonVersion}-slim AS builder\n`;
      case 'java':
        return `FROM maven:3.8-openjdk-${javaVersion} AS builder\n`;
      default:
        return 'FROM alpine:latest AS builder\n';
    }
  }

  getProductionImage(appType, nodeVersion, pythonVersion, javaVersion) {
    switch (appType) {
      case 'node':
        return `FROM node:${nodeVersion}-alpine AS production\n`;
      case 'python':
        return `FROM python:${pythonVersion}-slim AS production\n`;
      case 'java':
        return `FROM openjdk:${javaVersion}-slim AS production\n`;
      case 'static':
        return 'FROM nginx:alpine AS production\n';
      default:
        return 'FROM alpine:latest AS production\n';
    }
  }

  generateLabels(config) {
    const { name, version, maintainer, description } = config;
    let labels = '\n# Labels\n';
    
    if (name) labels += `LABEL "app.name"="${name}"\n`;
    if (version) labels += `LABEL "app.version"="${version}"\n`;
    if (maintainer) labels += `LABEL "maintainer"="${maintainer}"\n`;
    if (description) labels += `LABEL "description"="${description}"\n`;
    
    labels += 'LABEL "generated-by"="DevOps Pipeline Generator"\n';
    labels += `LABEL "generated-at"="${new Date().toISOString()}"\n`;
    
    return labels;
  }

  generateProductionOptimizations(appType) {
    let optimizations = '\n# Production optimizations\n';
    
    switch (appType) {
      case 'node':
        optimizations += 'RUN npm ci --only=production && npm cache clean --force\n';
        break;
      case 'python':
        optimizations += 'RUN pip install --no-cache-dir -r requirements.txt\n';
        break;
    }
    
    return optimizations;
  }

  generateHealthCheck(appType, port) {
    let healthCheck = '\n# Health check\n';
    
    switch (appType) {
      case 'node':
        healthCheck += `HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\\n`;
        healthCheck += `  CMD curl -f http://localhost:${port}/ || exit 1\n`;
        break;
      case 'python':
        healthCheck += `HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\\n`;
        healthCheck += `  CMD curl -f http://localhost:${port}/ || exit 1\n`;
        break;
      case 'nginx':
        healthCheck += 'HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\\n';
        healthCheck += '  CMD curl -f http://localhost/ || exit 1\n';
        break;
      default:
        healthCheck += 'HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\\n';
        healthCheck += '  CMD echo "Service is running" || exit 1\n';
    }
    
    return healthCheck;
  }

  getProductionCopyCommands(appType) {
    switch (appType) {
      case 'node':
        return 'COPY --from=builder /app/node_modules ./node_modules\nCOPY --from=builder /app/dist ./dist\nCOPY --from=builder /app/package*.json ./\n';
      case 'python':
        return 'COPY --from=builder /app/requirements.txt ./\nCOPY --from=builder /app /app\n';
      case 'java':
        return 'COPY --from=builder /target/*.jar app.jar\n';
      case 'static':
        return 'COPY --from=builder /app/dist/* /usr/share/nginx/html/\nCOPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf\n';
      default:
        return 'COPY --from=builder /app /app\n';
    }
  }

  getDefaultStartCommand(appType, port) {
    switch (appType) {
      case 'node':
        return `CMD ["npm", "start"]\n`;
      case 'python':
        if (port) {
          return `CMD ["python", "app.py", "--port", "${port}"]\n`;
        }
        return 'CMD ["python", "app.py"]\n';
      case 'java':
        return 'CMD ["java", "-jar", "app.jar"]\n';
      case 'nginx':
        return 'CMD ["nginx", "-g", "daemon off;"]\n';
      case 'apache':
        return 'CMD ["httpd-foreground"]\n';
      case 'static':
        return 'CMD ["nginx", "-g", "daemon off;"]\n';
      default:
        return 'CMD ["./start.sh"]\n';
    }
  }

  getTemplate() {
    return {
      name: 'Dockerfile Generator',
      description: 'Generate production-ready Dockerfile for containerization with best practices',
      fields: [
        {
          name: 'appType',
          label: 'Application Type',
          type: 'select',
          required: true,
          options: [
            { value: 'node', label: 'Node.js - For Express, React, Next.js apps' },
            { value: 'python', label: 'Python - For Django, Flask, FastAPI apps' },
            { value: 'java', label: 'Java - For Spring Boot, Maven apps' },
            { value: 'nginx', label: 'Nginx - For static web servers' },
            { value: 'apache', label: 'Apache - For web servers' },
            { value: 'static', label: 'Static Website - For HTML/CSS/JS sites' },
            { value: 'custom', label: 'Custom - For other applications' }
          ]
        },
        {
          name: 'baseImage',
          label: 'Custom Base Image (Optional)',
          type: 'text',
          placeholder: 'e.g., ubuntu:20.04 or alpine:latest',
          description: 'Override default base image with custom one'
        },
        {
          name: 'nodeVersion',
          label: 'Node.js Version',
          type: 'select',
          defaultValue: '18',
          options: [
            { value: '16', label: '16.x (LTS)' },
            { value: '18', label: '18.x (LTS - Recommended)' },
            { value: '20', label: '20.x (LTS)' },
            { value: '21', label: '21.x (Latest)' }
          ],
          description: 'Choose Node.js version for your application'
        },
        {
          name: 'pythonVersion',
          label: 'Python Version',
          type: 'select',
          defaultValue: '3.11',
          options: [
            { value: '3.9', label: '3.9' },
            { value: '3.10', label: '3.10' },
            { value: '3.11', label: '3.11 (Recommended)' },
            { value: '3.12', label: '3.12 (Latest)' }
          ],
          description: 'Choose Python version for your application'
        },
        {
          name: 'javaVersion',
          label: 'Java Version',
          type: 'select',
          defaultValue: '17',
          options: [
            { value: '11', label: '11 (LTS)' },
            { value: '17', label: '17 (LTS - Recommended)' },
            { value: '21', label: '21 (Latest)' }
          ],
          description: 'Choose Java version for your application'
        },
        {
          name: 'port',
          label: 'Application Port',
          type: 'text',
          defaultValue: '3000',
          placeholder: 'e.g., 3000, 8080, 5000',
          description: 'Port your application runs on inside container'
        },
        {
          name: 'workingDir',
          label: 'Working Directory',
          type: 'text',
          defaultValue: '/app',
          placeholder: 'e.g., /app, /usr/src/app',
          description: 'Directory where your application code will be placed'
        },
        {
          name: 'dependencies',
          label: 'Dependencies Installation Commands',
          type: 'textarea',
          placeholder: 'RUN npm install\nRUN pip install -r requirements.txt\nRUN apt-get update && apt-get install -y curl',
          description: 'Commands to install dependencies (one per line)',
          examples: [
            'Node.js: RUN npm install',
            'Python: RUN pip install -r requirements.txt',
            'System: RUN apt-get update && apt-get install -y curl'
          ]
        },
        {
          name: 'buildCommands',
          label: 'Build Commands',
          type: 'textarea',
          placeholder: 'RUN npm run build\nRUN mvn package\nRUN python manage.py collectstatic',
          description: 'Commands to build your application (one per line)',
          examples: [
            'Node.js: RUN npm run build',
            'Java: RUN mvn package',
            'Python: RUN python manage.py collectstatic'
          ]
        },
        {
          name: 'startCommand',
          label: 'Start Command',
          type: 'text',
          placeholder: 'CMD ["npm", "start"] or CMD ["python", "app.py"]',
          description: 'Command to start your application',
          examples: [
            'Node.js: CMD ["npm", "start"]',
            'Python: CMD ["python", "app.py"]',
            'Java: CMD ["java", "-jar", "app.jar"]'
          ]
        },
        {
          name: 'environment',
          label: 'Environment Variables',
          type: 'keyvalue',
          placeholder: 'NODE_ENV=production\nPORT=3000\nDATABASE_URL=mongodb://localhost:27017',
          description: 'Environment variables for your application (key=value format)',
          examples: [
            'NODE_ENV=production',
            'PORT=3000',
            'DATABASE_URL=mongodb://localhost:27017'
          ]
        },
        {
          name: 'exposePort',
          label: 'Expose Port',
          type: 'checkbox',
          defaultValue: true,
          description: 'Expose the application port for container networking'
        },
        {
          name: 'healthCheck',
          label: 'Include Health Check',
          type: 'checkbox',
          defaultValue: false,
          description: 'Add health check endpoint monitoring for container orchestration'
        },
        {
          name: 'multiStage',
          label: 'Multi-stage Build',
          type: 'checkbox',
          defaultValue: false,
          description: 'Use multi-stage builds for smaller final images (recommended for production)'
        },
        {
          name: 'optimizeForProduction',
          label: 'Production Optimizations',
          type: 'checkbox',
          defaultValue: true,
          description: 'Include production optimizations like cleanup and caching'
        },
        {
          name: 'name',
          label: 'Application Name',
          type: 'text',
          placeholder: 'My Web Application',
          description: 'Name of your application (used for labels)'
        },
        {
          name: 'version',
          label: 'Version',
          type: 'text',
          placeholder: '1.0.0',
          description: 'Application version (used for labels)'
        },
        {
          name: 'maintainer',
          label: 'Maintainer',
          type: 'text',
          placeholder: 'your-email@example.com',
          description: 'Maintainer email (used for labels)'
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          placeholder: 'A production-ready web application built with modern technologies',
          description: 'Application description (used for labels)'
        }
      ]
    };
  }
}

module.exports = new DockerfileGenerator();
