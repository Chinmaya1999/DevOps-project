class JenkinsGenerator {
  static generate(config) {
    const {
      projectName,
      repositoryUrl,
      branch = 'main',
      dockerImage,
      environmentVariables = {},
      buildSteps = [],
      testCommand,
      deployCommand
    } = config;

    let jenkinsfile = `pipeline {
    agent any
    
    environment {
        PROJECT_NAME = "${projectName}"
        BRANCH = "${branch}"
        REPO_URL = "${repositoryUrl}"
    `;

    // Add environment variables
    if (Object.keys(environmentVariables).length > 0) {
      Object.entries(environmentVariables).forEach(([key, value]) => {
        jenkinsfile += `\n        ${key.toUpperCase()} = "${value}"`;
      });
    }

    jenkinsfile += `
    }
    
    tools {
        maven 'Maven-3.8.1'
        jdk 'JDK-11'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM', 
                    branches: [[name: "*/${branch}"]],
                    userRemoteConfigs: [[url: "${repositoryUrl}"]]
                ])
                echo "Checked out branch: ${branch}"
            }
        }
        
        stage('Build') {
            steps {
                echo "Building project..."
                sh 'mvn clean compile -DskipTests'
            }
        }`;

    // Add custom build steps if provided
    if (buildSteps.length > 0) {
      jenkinsfile += `
        
        stage('Custom Build Steps') {
            steps {`;
      buildSteps.forEach(step => {
        jenkinsfile += `\n                sh '${step}'`;
      });
      jenkinsfile += `
            }
        }`;
    }

    // Add test stage if test command is provided
    if (testCommand) {
      jenkinsfile += `
        
        stage('Test') {
            steps {
                echo "Running tests..."
                sh '${testCommand}'
            }
            post {
                always {
                    junit 'target/surefire-reports/*.xml'
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'target/site/jacoco',
                        reportFiles: 'index.html',
                        reportName: 'JaCoCo Coverage Report'
                    ])
                }
            }
        }`;
    }

    // Add Docker stage if Docker image is specified
    if (dockerImage) {
      jenkinsfile += `
        
        stage('Docker Build') {
            steps {
                echo "Building Docker image..."
                script {
                    def image = docker.build("${dockerImage}:\${BUILD_NUMBER}")
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-credentials') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }`;
    }

    // Add deploy stage if deploy command is provided
    if (deployCommand) {
      jenkinsfile += `
        
        stage('Deploy') {
            steps {
                echo "Deploying application..."
                sh '${deployCommand}'
            }
        }`;
    }

    jenkinsfile += `
    }
    
    post {
        success {
            echo "Pipeline executed successfully!"
            archiveArtifacts artifacts: 'target/*.jar', fingerprint: true
        }
        failure {
            echo "Pipeline failed!"
            mail to: 'devops-team@company.com',
                 subject: "Pipeline Failed: \${env.JOB_NAME} - \${env.BUILD_NUMBER}",
                 body: "The pipeline for ${projectName} failed. Check the console output at \${env.BUILD_URL}"
        }
        always {
            cleanWs()
        }
    }
}`;

    return jenkinsfile;
  }
}

module.exports = JenkinsGenerator;
