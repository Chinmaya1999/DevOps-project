class GitHubActionsGenerator {
  static generate(config) {
    const {
      projectName,
      repositoryUrl,
      branch = 'main',
      nodeVersion = '18',
      dockerImage,
      environmentVariables = {},
      testCommand = 'npm test',
      buildCommand = 'npm run build'
    } = config;

    let workflow = `name: CI/CD Pipeline for ${projectName}

on:
  push:
    branches: [ ${branch} ]
  pull_request:
    branches: [ ${branch} ]

env:
  NODE_VERSION: ${nodeVersion}
  PROJECT_NAME: ${projectName}
`;

    // Add environment variables
    if (Object.keys(environmentVariables).length > 0) {
      workflow += '  # Environment variables\n';
      Object.entries(environmentVariables).forEach(([key, value]) => {
        workflow += `  ${key.toUpperCase()}: ${value}\n`;
      });
    }

    workflow += `
jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [${nodeVersion}]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: ${testCommand}
      
    - name: Upload coverage reports
      if: matrix.node-version == '${nodeVersion}'
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
        
  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: \${{ env.NODE_VERSION }}
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build application
      run: ${buildCommand}
      
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-files
        path: |
          dist/
          build/
        retention-days: 30`;

    // Add Docker build stage if Docker image is specified
    if (dockerImage) {
      workflow += `
        
  docker:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/${branch}'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
      
    - name: Login to Docker Hub
      uses: docker/login-action@v3
      with:
        username: \${{ secrets.DOCKER_USERNAME }}
        password: \${{ secrets.DOCKER_PASSWORD }}
        
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${dockerImage}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}
          
    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: \${{ steps.meta.outputs.tags }}
        labels: \${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max`;
    }

    workflow += `
        
  deploy:
    needs: [test, build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/${branch}'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: build-files
        path: ./build
        
    - name: Deploy to production
      run: |
        echo "Deploying to production..."
        # Add your deployment commands here
        # Example: scp, kubectl apply, etc.
        
    - name: Notify deployment
      uses: 8398a7/action-slack@v3
      if: always()
      with:
        status: \${{ job.status }}
        channel: '#deployments'
        webhook_url: \${{ secrets.SLACK_WEBHOOK }}
        text: |
          Deployment Status: \${{ job.status }}
          Project: ${projectName}
          Commit: \${{ github.sha }}
          Branch: \${{ github.ref }}
`;

    return workflow;
  }
}

module.exports = GitHubActionsGenerator;
