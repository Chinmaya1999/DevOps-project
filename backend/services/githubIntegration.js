const axios = require('axios');

class GitHubIntegration {
  constructor() {
    this.baseURL = 'https://api.github.com';
    this.axiosInstance = axios.create({
      timeout: 300000, // 5 minutes timeout for GitHub API calls
      headers: {
        Accept: 'application/vnd.github.v3+json'
      }
    });
  }

  async getUserRepositories(token) {
    try {
      const response = await this.axiosInstance.get(`${this.baseURL}/user/repos`, {
        headers: {
          Authorization: `token ${token}`
        },
        params: {
          per_page: 100,
          sort: 'updated'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch repositories: ${error.message}`);
    }
  }

  async getRepositoryDetails(owner, repo, token) {
    try {
      const response = await this.axiosInstance.get(`${this.baseURL}/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `token ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch repository details: ${error.message}`);
    }
  }

  async analyzeRepository(owner, repo, token) {
    try {
      const [repoDetails, languages, contents, commits] = await Promise.all([
        this.getRepositoryDetails(owner, repo, token),
        this.getRepositoryLanguages(owner, repo, token),
        this.getRepositoryContents(owner, repo, token),
        this.getRecentCommits(owner, repo, token)
      ]);

      const analysis = {
        repository: repoDetails,
        languages: languages,
        structure: this.analyzeStructure(contents),
        framework: this.detectFramework(languages, contents),
        recommendations: this.generateRecommendations(repoDetails, languages, contents),
        cicd: this.generateCICDRecommendations(repoDetails, languages),
        infrastructure: this.generateInfrastructureRecommendations(repoDetails, languages),
        docker: this.generateDockerRecommendations(languages, contents),
        kubernetes: this.generateKubernetesRecommendations(repoDetails)
      };

      return analysis;
    } catch (error) {
      throw new Error(`Failed to analyze repository: ${error.message}`);
    }
  }

  async getRepositoryLanguages(owner, repo, token) {
    try {
      const response = await this.axiosInstance.get(`${this.baseURL}/repos/${owner}/${repo}/languages`, {
        headers: {
          Authorization: `token ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch languages: ${error.message}`);
    }
  }

  async getRepositoryContents(owner, repo, token, path = '') {
    try {
      const response = await this.axiosInstance.get(`${this.baseURL}/repos/${owner}/${repo}/contents/${path}`, {
        headers: {
          Authorization: `token ${token}`
        }
      });
      return response.data;
    } catch (error) {
      return [];
    }
  }

  async getRecentCommits(owner, repo, token) {
    try {
      const response = await this.axiosInstance.get(`${this.baseURL}/repos/${owner}/${repo}/commits`, {
        headers: {
          Authorization: `token ${token}`
        },
        params: {
          per_page: 10
        }
      });
      return response.data;
    } catch (error) {
      return [];
    }
  }

  analyzeStructure(contents) {
    const structure = {
      hasPackageJson: false,
      hasRequirementsTxt: false,
      hasPomXml: false,
      hasDockerfile: false,
      hasKubernetes: false,
      hasTerraform: false,
      hasGithubActions: false,
      hasJenkinsfile: false,
      hasGitlabCi: false,
      hasTests: false
    };

    if (Array.isArray(contents)) {
      contents.forEach(item => {
        const name = item.name.toLowerCase();
        if (name === 'package.json') structure.hasPackageJson = true;
        if (name === 'requirements.txt') structure.hasRequirementsTxt = true;
        if (name === 'pom.xml') structure.hasPomXml = true;
        if (name === 'dockerfile') structure.hasDockerfile = true;
        if (name === 'k8s' || name === 'kubernetes') structure.hasKubernetes = true;
        if (name === 'terraform' || name === '.terraform') structure.hasTerraform = true;
        if (name === '.github') structure.hasGithubActions = true;
        if (name === 'jenkinsfile') structure.hasJenkinsfile = true;
        if (name === '.gitlab-ci.yml') structure.hasGitlabCi = true;
        if (name.includes('test') || name.includes('spec')) structure.hasTests = true;
      });
    }

    return structure;
  }

  detectFramework(languages, contents) {
    const primaryLanguage = Object.keys(languages).reduce((a, b) => 
      languages[a] > languages[b] ? a : b
    );

    const frameworks = {
      JavaScript: ['React', 'Vue', 'Angular', 'Express', 'Next.js'],
      TypeScript: ['React', 'Vue', 'Angular', 'Express', 'Next.js'],
      Python: ['Django', 'Flask', 'FastAPI'],
      Java: ['Spring Boot', 'Maven', 'Gradle'],
      Go: ['Gin', 'Echo'],
      Ruby: ['Rails'],
      PHP: ['Laravel']
    };

    return {
      primaryLanguage,
      detectedFrameworks: frameworks[primaryLanguage] || [],
      confidence: this.calculateFrameworkConfidence(languages, contents)
    };
  }

  calculateFrameworkConfidence(languages, contents) {
    const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0);
    const primaryLanguageBytes = Math.max(...Object.values(languages));
    return (primaryLanguageBytes / totalBytes * 100).toFixed(2);
  }

  generateRecommendations(repoDetails, languages, contents) {
    const recommendations = [];

    // CI/CD recommendations
    if (!this.hasCICD(contents)) {
      recommendations.push({
        type: 'cicd',
        priority: 'high',
        message: 'No CI/CD pipeline detected. Consider implementing GitHub Actions, GitLab CI, or Jenkins.',
        action: 'Setup CI/CD pipeline'
      });
    }

    // Containerization
    if (!this.hasDocker(contents)) {
      recommendations.push({
        type: 'docker',
        priority: 'high',
        message: 'No Dockerfile detected. Containerize your application for better deployment consistency.',
        action: 'Create Dockerfile'
      });
    }

    // Infrastructure as Code
    if (!this.hasIaC(contents)) {
      recommendations.push({
        type: 'iac',
        priority: 'medium',
        message: 'No Infrastructure as Code detected. Consider using Terraform for reproducible infrastructure.',
        action: 'Setup Terraform'
      });
    }

    // Kubernetes
    if (!this.hasK8s(contents)) {
      recommendations.push({
        type: 'kubernetes',
        priority: 'medium',
        message: 'No Kubernetes manifests detected. Consider deploying to Kubernetes for scalability.',
        action: 'Create Kubernetes manifests'
      });
    }

    // Testing
    if (!this.hasTests(contents)) {
      recommendations.push({
        type: 'testing',
        priority: 'high',
        message: 'No test files detected. Add automated tests to ensure code quality.',
        action: 'Add unit and integration tests'
      });
    }

    // Security
    recommendations.push({
      type: 'security',
      priority: 'high',
      message: 'Implement security scanning and dependency vulnerability checks.',
      action: 'Add security scanning'
    });

    return recommendations;
  }

  generateCICDRecommendations(repoDetails, languages) {
    const primaryLanguage = Object.keys(languages).reduce((a, b) => 
      languages[a] > languages[b] ? a : b
    );

    const cicdOptions = {
      'GitHub Actions': {
        recommended: true,
        reason: 'Native GitHub integration, free for public repositories',
        config: '.github/workflows/ci.yml'
      },
      'GitLab CI': {
        recommended: repoDetails.private,
        reason: 'Built-in GitLab integration, comprehensive features',
        config: '.gitlab-ci.yml'
      },
      'Jenkins': {
        recommended: false,
        reason: 'Requires self-hosted infrastructure, more complex setup',
        config: 'Jenkinsfile'
      },
      'Azure DevOps': {
        recommended: false,
        reason: 'Best for Azure-based deployments',
        config: 'azure-pipelines.yml'
      }
    };

    return {
      recommended: 'GitHub Actions',
      options: cicdOptions,
      stages: ['Build', 'Test', 'Security Scan', 'Deploy']
    };
  }

  generateInfrastructureRecommendations(repoDetails, languages) {
    return {
      recommended: 'Terraform',
      providers: ['AWS', 'Azure', 'GCP'],
      resources: [
        { name: 'VPC', priority: 'high' },
        { name: 'EC2/ECS', priority: 'high' },
        { name: 'RDS', priority: 'medium' },
        { name: 'S3', priority: 'medium' },
        { name: 'Load Balancer', priority: 'high' },
        { name: 'Security Groups', priority: 'high' }
      ],
      estimatedCost: '$50-200/month depending on usage'
    };
  }

  generateDockerRecommendations(languages, contents) {
    const primaryLanguage = Object.keys(languages).reduce((a, b) => 
      languages[a] > languages[b] ? a : b
    );

    const dockerConfigs = {
      JavaScript: {
        baseImage: 'node:18-alpine',
        port: 3000,
        buildCommand: 'npm run build',
        startCommand: 'npm start'
      },
      TypeScript: {
        baseImage: 'node:18-alpine',
        port: 3000,
        buildCommand: 'npm run build',
        startCommand: 'npm start'
      },
      Python: {
        baseImage: 'python:3.11-slim',
        port: 8000,
        buildCommand: 'pip install -r requirements.txt',
        startCommand: 'python app.py'
      },
      Java: {
        baseImage: 'openjdk:17-slim',
        port: 8080,
        buildCommand: 'mvn package',
        startCommand: 'java -jar app.jar'
      },
      Go: {
        baseImage: 'golang:1.21-alpine',
        port: 8080,
        buildCommand: 'go build',
        startCommand: './app'
      }
    };

    return dockerConfigs[primaryLanguage] || dockerConfigs.JavaScript;
  }

  generateKubernetesRecommendations(repoDetails) {
    return {
      recommended: true,
      resources: [
        'Deployment',
        'Service',
        'Ingress',
        'ConfigMap',
        'Secret',
        'HorizontalPodAutoscaler',
        'NetworkPolicy'
      ],
      replicas: {
        min: 2,
        max: 10,
        targetCPU: 70,
        targetMemory: 80
      },
      ingress: {
        enabled: true,
        ssl: true,
        domain: `${repoDetails.name}.example.com`
      }
    };
  }

  hasCICD(contents) {
    if (Array.isArray(contents)) {
      return contents.some(item => 
        item.name === '.github' || 
        item.name === 'Jenkinsfile' || 
        item.name === '.gitlab-ci.yml'
      );
    }
    return false;
  }

  hasDocker(contents) {
    if (Array.isArray(contents)) {
      return contents.some(item => item.name === 'Dockerfile');
    }
    return false;
  }

  hasIaC(contents) {
    if (Array.isArray(contents)) {
      return contents.some(item => 
        item.name === 'terraform' || 
        item.name === '.terraform' ||
        item.name.endsWith('.tf')
      );
    }
    return false;
  }

  hasK8s(contents) {
    if (Array.isArray(contents)) {
      return contents.some(item => 
        item.name === 'k8s' || 
        item.name === 'kubernetes' ||
        item.name.endsWith('.yaml') && item.name.includes('k8s')
      );
    }
    return false;
  }

  hasTests(contents) {
    if (Array.isArray(contents)) {
      return contents.some(item => 
        item.name.includes('test') || 
        item.name.includes('spec')
      );
    }
    return false;
  }

  async detectTechStack(owner, repo, token) {
    try {
      const contents = await this.getRepositoryContents(owner, repo, token);
      const languages = await this.getRepositoryLanguages(owner, repo, token);
      
      const stack = [];
      
      // Detect from languages
      if (languages.JavaScript || languages.TypeScript) {
        stack.push('JavaScript');
        if (languages.TypeScript) stack.push('TypeScript');
      }
      if (languages.Python) stack.push('Python');
      if (languages.Java) stack.push('Java');
      if (languages.Go) stack.push('Go');
      if (languages.Ruby) stack.push('Ruby');
      if (languages.PHP) stack.push('PHP');
      if (languages.Rust) stack.push('Rust');
      
      // Detect from files
      if (Array.isArray(contents)) {
        const fileNames = contents.map(item => item.name.toLowerCase());
        
        if (fileNames.includes('package.json')) {
          stack.push('Node.js');
          // Try to detect React/Next.js
          try {
            const packageJson = await this.getFileContent(owner, repo, 'package.json', token);
            if (packageJson) {
              const pkg = JSON.parse(packageJson);
              if (pkg.dependencies?.react || pkg.devDependencies?.react) {
                stack.push('React');
              }
              if (pkg.dependencies?.next || pkg.devDependencies?.next) {
                stack.push('Next.js');
              }
              if (pkg.dependencies?.vue || pkg.devDependencies?.vue) {
                stack.push('Vue.js');
              }
              if (pkg.dependencies?.angular || pkg.devDependencies?.angular) {
                stack.push('Angular');
              }
              if (pkg.dependencies?.express || pkg.devDependencies?.express) {
                stack.push('Express');
              }
            }
          } catch (e) {
            // Ignore errors reading package.json
          }
        }
        
        if (fileNames.includes('requirements.txt')) {
          stack.push('Python');
          // Try to detect Django/Flask
          try {
            const requirements = await this.getFileContent(owner, repo, 'requirements.txt', token);
            if (requirements) {
              if (requirements.toLowerCase().includes('django')) {
                stack.push('Django');
              }
              if (requirements.toLowerCase().includes('flask')) {
                stack.push('Flask');
              }
              if (requirements.toLowerCase().includes('fastapi')) {
                stack.push('FastAPI');
              }
            }
          } catch (e) {
            // Ignore errors reading requirements.txt
          }
        }
        
        if (fileNames.includes('pom.xml')) {
          stack.push('Java');
          stack.push('Maven');
        }
        
        if (fileNames.includes('build.gradle')) {
          stack.push('Java');
          stack.push('Gradle');
        }
        
        if (fileNames.includes('composer.json')) {
          stack.push('PHP');
          stack.push('Laravel');
        }
        
        if (fileNames.includes('go.mod')) {
          stack.push('Go');
        }
        
        if (fileNames.includes('gemfile')) {
          stack.push('Ruby');
          stack.push('Rails');
        }
        
        if (fileNames.includes('cargo.toml')) {
          stack.push('Rust');
        }
      }
      
      // Remove duplicates and return
      return [...new Set(stack)];
    } catch (error) {
      console.error('Error detecting tech stack:', error);
      return ['Node.js', 'React']; // Default fallback
    }
  }

  async getFileContent(owner, repo, path, token) {
    try {
      // First try the GitHub Contents API
      const response = await this.axiosInstance.get(`${this.baseURL}/repos/${owner}/${repo}/contents/${path}`, {
        headers: {
          Authorization: `token ${token}`
        }
      });
      
      console.log('GitHub API response for file content:', response.data);
      
      // If content is available, decode it
      if (response.data.content) {
        return Buffer.from(response.data.content, 'base64').toString('utf-8');
      }
      
      // If no content but there's a download_url, try fetching from there
      if (response.data.download_url) {
        console.log('Fetching content from download_url:', response.data.download_url);
        const rawResponse = await this.axiosInstance.get(response.data.download_url, {
          headers: {
            Authorization: `token ${token}`
          }
        });
        return rawResponse.data;
      }
      
      // Fallback: Try raw.githubusercontent.com directly
      console.log('Trying fallback to raw.githubusercontent.com');
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;
      const fallbackResponse = await this.axiosInstance.get(rawUrl, {
        headers: {
          Authorization: `token ${token}`
        }
      });
      return fallbackResponse.data;
      
    } catch (error) {
      console.error('Error fetching file content:', error.response?.data || error.message);
      return null;
    }
  }

  async getFileStructure(owner, repo, token, path = '', depth = 0, maxDepth = 3) {
    try {
      // Limit recursion depth to prevent timeout on large repos
      if (depth > maxDepth) {
        return [];
      }

      const contents = await this.getRepositoryContents(owner, repo, token, path);
      
      if (!Array.isArray(contents)) {
        return [];
      }

      const structure = [];
      
      for (const item of contents) {
        if (item.type === 'dir') {
          const children = await this.getFileStructure(owner, repo, token, item.path, depth + 1, maxDepth);
          structure.push({
            name: item.name,
            path: item.path,
            type: 'dir',
            children: children
          });
        } else {
          structure.push({
            name: item.name,
            path: item.path,
            type: 'file',
            size: item.size
          });
        }
      }
      
      return structure;
    } catch (error) {
      console.error('Error getting file structure:', error);
      return [];
    }
  }

  async updateFileContent(owner, repo, token, path, content, message) {
    try {
      // First get the current file to get the SHA
      const currentFile = await this.axiosInstance.get(`${this.baseURL}/repos/${owner}/${repo}/contents/${path}`, {
        headers: {
          Authorization: `token ${token}`
        }
      });

      const sha = currentFile.data.sha;
      const encodedContent = Buffer.from(content).toString('base64');

      const response = await this.axiosInstance.put(`${this.baseURL}/repos/${owner}/${repo}/contents/${path}`, {
        message: message || `Update ${path}`,
        content: encodedContent,
        sha: sha
      }, {
        headers: {
          Authorization: `token ${token}`
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to update file: ${error.message}`);
    }
  }

  async buildAndPushDockerImage(token, owner, repo, dockerHubUsername, dockerHubToken, imageName, tag = 'latest') {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    const logs = [];
    const log = (message) => {
      logs.push(message);
      console.log(message);
    };

    try {
      log('Starting Docker build process...');
      log(`Repository: ${owner}/${repo}`);
      log(`Docker Hub: ${dockerHubUsername}/${imageName}:${tag}`);

      // Clone the repository
      log('Cloning repository...');
      const repoUrl = `https://${token}@github.com/${owner}/${repo}.git`;
      await execPromise(`git clone ${repoUrl} /tmp/${repo}`);
      log('Repository cloned successfully');

      // Change to repository directory
      const repoDir = `/tmp/${repo}`;
      process.chdir(repoDir);

      // Login to Docker Hub
      log('Logging into Docker Hub...');
      await execPromise(`echo ${dockerHubToken} | docker login -u ${dockerHubUsername} --password-stdin`);
      log('Docker Hub login successful');

      // Build Docker image
      log('Building Docker image...');
      const fullImageName = `${dockerHubUsername}/${imageName}:${tag}`;
      await execPromise(`docker build -t ${fullImageName} .`);
      log('Docker image built successfully');

      // Push to Docker Hub
      log('Pushing to Docker Hub...');
      await execPromise(`docker push ${fullImageName}`);
      log('Docker image pushed successfully');

      // Cleanup
      log('Cleaning up...');
      process.chdir('/tmp');
      await execPromise(`rm -rf ${repoDir}`);
      log('Cleanup complete');

      return { logs: logs.join('\n'), success: true };
    } catch (error) {
      log(`Error: ${error.message}`);
      return { logs: logs.join('\n'), success: false, error: error.message };
    }
  }

  async getRepositoryBranches(owner, repo, token) {
    try {
      const response = await this.axiosInstance.get(`${this.baseURL}/repos/${owner}/${repo}/branches`, {
        headers: {
          Authorization: `token ${token}`
        },
        params: {
          per_page: 100
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch branches: ${error.message}`);
    }
  }

  async getRepositoryCommits(owner, repo, token, branch = 'main', limit = 10) {
    try {
      const response = await this.axiosInstance.get(`${this.baseURL}/repos/${owner}/${repo}/commits`, {
        headers: {
          Authorization: `token ${token}`
        },
        params: {
          sha: branch,
          per_page: limit
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch commits: ${error.message}`);
    }
  }
}

module.exports = new GitHubIntegration();
