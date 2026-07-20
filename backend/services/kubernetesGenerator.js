class KubernetesGenerator {
  static generate(config) {
    const {
      appName,
      dockerImage,
      replicas = 3,
      containerPort,
      serviceType = 'ClusterIP',
      servicePort = 80,
      environmentVariables = {},
      resources = {}
    } = config;

    const deploymentYaml = this.generateDeployment(appName, dockerImage, replicas, containerPort, serviceType, servicePort, environmentVariables, resources);
    const serviceYaml = this.generateService(appName, serviceType, servicePort, containerPort);
    const ingressYaml = this.generateIngress(appName, servicePort);
    const configMapYaml = this.generateConfigMap(appName, environmentVariables);
    const hpaYaml = this.generateHorizontalPodAutoscaler(appName);

    return {
      deployment: deploymentYaml,
      service: serviceYaml,
      ingress: ingressYaml,
      configMap: configMapYaml,
      hpa: hpaYaml
    };
  }

  static generateDeployment(appName, dockerImage, replicas, containerPort, serviceType, servicePort, environmentVariables, resources) {
    let deployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${appName}-deployment
  labels:
    app: ${appName}
    version: v1
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app: ${appName}
  template:
    metadata:
      labels:
        app: ${appName}
        version: v1
    spec:
      containers:
      - name: ${appName}
        image: ${dockerImage}
        imagePullPolicy: Always
        ports:
        - containerPort: ${containerPort}
          protocol: TCP`;

    // Add environment variables
    if (Object.keys(environmentVariables).length > 0) {
      deployment += `
        env:`;
      Object.entries(environmentVariables).forEach(([key, value]) => {
        deployment += `
        - name: ${key}
          value: "${value}"`;
      });
    }

    // Add resources if specified
    if (resources && (resources.requests || resources.limits)) {
      deployment += `
        resources:`;
      
      if (resources.requests) {
        deployment += `
          requests:`;
        if (resources.requests.memory) {
          deployment += `
            memory: ${resources.requests.memory}`;
        }
        if (resources.requests.cpu) {
          deployment += `
            cpu: ${resources.requests.cpu}`;
        }
      }
      
      if (resources.limits) {
        deployment += `
          limits:`;
        if (resources.limits.memory) {
          deployment += `
            memory: ${resources.limits.memory}`;
        }
        if (resources.limits.cpu) {
          deployment += `
            cpu: ${resources.limits.cpu}`;
        }
      }
    }

    deployment += `
        livenessProbe:
          httpGet:
            path: /health
            port: ${containerPort}
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: ${containerPort}
          initialDelaySeconds: 5
          periodSeconds: 5
        startupProbe:
          httpGet:
            path: /startup
            port: ${containerPort}
          failureThreshold: 30
          periodSeconds: 10
      
      restartPolicy: Always
      terminationGracePeriodSeconds: 30`;

    deployment += `

---
# Service for ${appName}
apiVersion: v1
kind: Service
metadata:
  name: ${appName}-service
  labels:
    app: ${appName}
spec:
  type: ${serviceType}
  ports:
  - port: ${servicePort}
    targetPort: ${containerPort}
    protocol: TCP
    name: http
  selector:
    app: ${appName}`;

    return deployment;
  }

  static generateService(appName, serviceType, servicePort, containerPort) {
    return `apiVersion: v1
kind: Service
metadata:
  name: ${appName}-service
  labels:
    app: ${appName}
spec:
  type: ${serviceType}
  ports:
  - port: ${servicePort}
    targetPort: ${containerPort}
    protocol: TCP
    name: http
  selector:
    app: ${appName}`;
  }

  static generateIngress(appName, servicePort) {
    return `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${appName}-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - ${appName}.example.com
    secretName: ${appName}-tls
  rules:
  - host: ${appName}.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${appName}-service
            port:
              number: ${servicePort}`;
  }

  static generateConfigMap(appName, environmentVariables) {
    if (Object.keys(environmentVariables).length === 0) {
      return null;
    }

    let configMap = `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${appName}-config
  labels:
    app: ${appName}
data:
`;

    Object.entries(environmentVariables).forEach(([key, value]) => {
      configMap += `  ${key}: "${value}"\n`;
    });

    return configMap;
  }

  static generateHorizontalPodAutoscaler(appName) {
    return `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${appName}-hpa
  labels:
    app: ${appName}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${appName}-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max`;
  }
}

module.exports = KubernetesGenerator;
