pipeline {
    agent any

    environment {
        DOCKER_USERNAME = 'awsmallick1999'
        DOCKER_CREDENTIALS_ID = 'docker'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    credentialsId: 'github',
                    url: 'https://github.com/Chinmaya1999/CMdevops.git'
            }
        }

        stage('Build Backend Image') {
            steps {
                script {
                    docker.build("${DOCKER_USERNAME}/mern-backend:latest", "./backend")
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                script {
                    docker.build("${DOCKER_USERNAME}/mern-frontend:latest", "./frontend")
                }
            }
        }

        stage('Push Backend to Docker Hub') {
            steps {
                script {
                    docker.withRegistry('', DOCKER_CREDENTIALS_ID) {
                        docker.image("${DOCKER_USERNAME}/mern-backend:latest").push()
                    }
                }
            }
        }

        stage('Push Frontend to Docker Hub') {
            steps {
                script {
                    docker.withRegistry('', DOCKER_CREDENTIALS_ID) {
                        docker.image("${DOCKER_USERNAME}/mern-frontend:latest").push()
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    sh """
                        # Replace Docker username in deployment files
                        sed -i 's/\${DOCKER_USERNAME}/${DOCKER_USERNAME}/g' k8s/*.yaml
                        
                        # Apply Kubernetes configurations
                        kubectl apply -f k8s/secret.yaml
                        kubectl apply -f k8s/backend-deployment.yaml
                        kubectl apply -f k8s/frontend-deployment.yaml
                        kubectl apply -f k8s/ingress.yaml
                        
                        # Wait for deployments to be ready
                        kubectl rollout status deployment/backend-deployment
                        kubectl rollout status deployment/frontend-deployment
                    """
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment successful! Application is now running on Kubernetes.'
        }
        failure {
            echo 'Deployment failed. Please check the logs.'
        }
    }
}
