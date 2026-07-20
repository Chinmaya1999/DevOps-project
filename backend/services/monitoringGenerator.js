class MonitoringGenerator {
  static generate(config) {
    const {
      projectName,
      namespace = 'monitoring',
      retentionDays = 15,
      alertManagerEmail = 'alerts@example.com',
      enableGrafana = true,
      enablePrometheus = true,
      enableNodeExporter = true,
      enableAlertManager = true,
      enableLoki = true,
      enablePromtail = true
    } = config;

    const manifests = [];

    // Namespace
    manifests.push(this.generateNamespace(namespace));

    // Prometheus ConfigMap
    if (enablePrometheus) {
      manifests.push(this.generatePrometheusConfigMap(projectName));
      manifests.push(this.generatePrometheusDeployment(projectName, namespace));
      manifests.push(this.generatePrometheusService(projectName, namespace));
    }

    // Grafana
    if (enableGrafana) {
      manifests.push(this.generateGrafanaConfigMap(projectName));
      manifests.push(this.generateGrafanaDeployment(projectName, namespace));
      manifests.push(this.generateGrafanaService(projectName, namespace));
      manifests.push(this.generateGrafanaIngress(projectName, namespace));
    }

    // Node Exporter DaemonSet
    if (enableNodeExporter) {
      manifests.push(this.generateNodeExporterDaemonSet(namespace));
      manifests.push(this.generateNodeExporterService(namespace));
    }

    // AlertManager
    if (enableAlertManager) {
      manifests.push(this.generateAlertManagerConfigMap(projectName, alertManagerEmail));
      manifests.push(this.generateAlertManagerDeployment(projectName, namespace));
      manifests.push(this.generateAlertManagerService(projectName, namespace));
    }

    // Loki
    if (enableLoki) {
      manifests.push(this.generateLokiConfigMap(projectName, retentionDays));
      manifests.push(this.generateLokiDeployment(projectName, namespace));
      manifests.push(this.generateLokiService(projectName, namespace));
    }

    // Promtail
    if (enablePromtail) {
      manifests.push(this.generatePromtailConfigMap(projectName));
      manifests.push(this.generatePromtailDaemonSet(namespace));
    }

    return manifests.join('\n---\n\n');
  }

  static generateNamespace(namespace) {
    return `apiVersion: v1
kind: Namespace
metadata:
  name: ${namespace}
  labels:
    name: ${namespace}
    monitoring: enabled`;
  }

  static generatePrometheusConfigMap(projectName) {
    return `apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
      external_labels:
        cluster: '${projectName}'
        environment: 'production'
    
    scrape_configs:
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\\d+)?;(\\d+)
            replacement: $1:$2
            target_label: __address__
          - action: labelmap
            regex: __meta_kubernetes_pod_label_(.+)
          - source_labels: [__meta_kubernetes_namespace]
            action: replace
            target_label: kubernetes_namespace
          - source_labels: [__meta_kubernetes_pod_name]
            action: replace
            target_label: kubernetes_pod_name
      
      - job_name: 'kubernetes-nodes'
        kubernetes_sd_configs:
          - role: node
        relabel_configs:
          - source_labels: [__address__]
            regex: '(.*):10250'
            replacement: '${1}:9100'
            target_label: __address__
      
      - job_name: 'kubernetes-services'
        kubernetes_sd_configs:
          - role: service
        relabel_configs:
          - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
    
    alerting:
      alertmanagers:
        - static_configs:
            - targets:
                - alertmanager:9093`;
  }

  static generatePrometheusDeployment(projectName, namespace) {
    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: ${namespace}
  labels:
    app: prometheus
    project: ${projectName}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
        project: ${projectName}
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
        - name: data
          mountPath: /prometheus
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
      volumes:
      - name: config
        configMap:
          name: prometheus-config
      - name: data
        emptyDir: {}`;
  }

  static generatePrometheusService(projectName, namespace) {
    return `apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: ${namespace}
  labels:
    app: prometheus
    project: ${projectName}
spec:
  selector:
    app: prometheus
  ports:
  - port: 9090
    targetPort: 9090
    protocol: TCP
  type: ClusterIP`;
  }

  static generateGrafanaConfigMap(projectName) {
    return `apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-config
  namespace: monitoring
data:
  grafana.ini: |
    [server]
    root_url = https://grafana.${projectName}.com
    
    [database]
    type = sqlite3
    path = /var/lib/grafana/grafana.db
    
    [security]
    admin_user = admin
    admin_password = admin123
    
    [auth.anonymous]
    enabled = false
    
    [users]
    allow_sign_up = false
    
    [dashboards]
    default_home_dashboard_path = /etc/grafana/provisioning/dashboards/default.json`;
  }

  static generateGrafanaDeployment(projectName, namespace) {
    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: ${namespace}
  labels:
    app: grafana
    project: ${projectName}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
        project: ${projectName}
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:latest
        ports:
        - containerPort: 3000
        env:
        - name: GF_SECURITY_ADMIN_USER
          value: "admin"
        - name: GF_SECURITY_ADMIN_PASSWORD
          value: "admin123"
        - name: GF_INSTALL_PLUGINS
          value: "grafana-piechart-panel"
        volumeMounts:
        - name: config
          mountPath: /etc/grafana
        - name: data
          mountPath: /var/lib/grafana
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
      volumes:
      - name: config
        configMap:
          name: grafana-config
      - name: data
        emptyDir: {}`;
  }

  static generateGrafanaService(projectName, namespace) {
    return `apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: ${namespace}
  labels:
    app: grafana
    project: ${projectName}
spec:
  selector:
    app: grafana
  ports:
  - port: 3000
    targetPort: 3000
    protocol: TCP
  type: ClusterIP`;
  }

  static generateGrafanaIngress(projectName, namespace) {
    return `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: grafana
  namespace: ${namespace}
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - grafana.${projectName}.com
    secretName: grafana-tls
  rules:
  - host: grafana.${projectName}.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: grafana
            port:
              number: 3000`;
  }

  static generateNodeExporterDaemonSet(namespace) {
    return `apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
  namespace: ${namespace}
  labels:
    app: node-exporter
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
    spec:
      hostPID: true
      hostNetwork: true
      containers:
      - name: node-exporter
        image: prom/node-exporter:latest
        ports:
        - containerPort: 9100
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "200m"
        volumeMounts:
        - name: proc
          mountPath: /host/proc
          readOnly: true
        - name: sys
          mountPath: /host/sys
          readOnly: true
        - name: root
          mountPath: /host/root
          readOnly: true
      volumes:
      - name: proc
        hostPath:
          path: /proc
      - name: sys
        hostPath:
          path: /sys
      - name: root
        hostPath:
          path: /`;
  }

  static generateNodeExporterService(namespace) {
    return `apiVersion: v1
kind: Service
metadata:
  name: node-exporter
  namespace: ${namespace}
  labels:
    app: node-exporter
spec:
  selector:
    app: node-exporter
  ports:
  - port: 9100
    targetPort: 9100
    protocol: TCP
  type: ClusterIP`;
  }

  static generateAlertManagerConfigMap(projectName, email) {
    return `apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: monitoring
data:
  alertmanager.yml: |
    global:
      resolve_timeout: 5m
      smtp_smarthost: 'smtp.gmail.com:587'
      smtp_from: 'alerts@${projectName}.com'
      smtp_auth_username: 'alerts@${projectName}.com'
      smtp_auth_password: 'your-password'
    
    route:
      group_by: ['alertname', 'cluster']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
      receiver: 'default'
      routes:
      - match:
          severity: critical
        receiver: 'critical'
    
    receivers:
    - name: 'default'
      email_configs:
      - to: '${email}'
        headers:
          Subject: '[Alert] {{ .GroupLabels.alertname }}'
    
    - name: 'critical'
      email_configs:
      - to: '${email}'
        headers:
          Subject: '[CRITICAL] {{ .GroupLabels.alertname }}'`;
  }

  static generateAlertManagerDeployment(projectName, namespace) {
    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: alertmanager
  namespace: ${namespace}
  labels:
    app: alertmanager
    project: ${projectName}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: alertmanager
  template:
    metadata:
      labels:
        app: alertmanager
        project: ${projectName}
    spec:
      containers:
      - name: alertmanager
        image: prom/alertmanager:latest
        ports:
        - containerPort: 9093
        volumeMounts:
        - name: config
          mountPath: /etc/alertmanager
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
      volumes:
      - name: config
        configMap:
          name: alertmanager-config`;
  }

  static generateAlertManagerService(projectName, namespace) {
    return `apiVersion: v1
kind: Service
metadata:
  name: alertmanager
  namespace: ${namespace}
  labels:
    app: alertmanager
    project: ${projectName}
spec:
  selector:
    app: alertmanager
  ports:
  - port: 9093
    targetPort: 9093
    protocol: TCP
  type: ClusterIP`;
  }

  static generateLokiConfigMap(projectName, retentionDays) {
    return `apiVersion: v1
kind: ConfigMap
metadata:
  name: loki-config
  namespace: monitoring
data:
  loki-config.yaml: |
    auth_enabled: false
    
    server:
      http_listen_port: 3100
    
    ingester:
      lifecycler:
        address: 127.0.0.1
        ring:
          kvstore:
            store: inmemory
          replication_factor: 1
      chunk_idle_period: 5m
      chunk_retain_period: 30s
    
    schema_config:
      configs:
        - from: 2020-10-24
          store: boltdb-shipper
          object_store: filesystem
          schema: v11
          index:
            prefix: index_
            period: 24h
    
    storage_config:
      boltdb_shipper:
        active_index_directory: /loki/index
        cache_location: /loki/cache
        shared_store: filesystem
      filesystem:
        directory: /loki/chunks
    
    limits_config:
      enforce_metric_name: false
      reject_old_samples: true
      reject_old_samples_max_age: 168h
      retention_period: ${retentionDays}d
    
    chunk_store_config:
      max_look_back_period: ${retentionDays}d`;
  }

  static generateLokiDeployment(projectName, namespace) {
    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: loki
  namespace: ${namespace}
  labels:
    app: loki
    project: ${projectName}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: loki
  template:
    metadata:
      labels:
        app: loki
        project: ${projectName}
    spec:
      containers:
      - name: loki
        image: grafana/loki:latest
        ports:
        - containerPort: 3100
        volumeMounts:
        - name: config
          mountPath: /etc/loki
        - name: data
          mountPath: /loki
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
      volumes:
      - name: config
        configMap:
          name: loki-config
      - name: data
        emptyDir: {}`;
  }

  static generateLokiService(projectName, namespace) {
    return `apiVersion: v1
kind: Service
metadata:
  name: loki
  namespace: ${namespace}
  labels:
    app: loki
    project: ${projectName}
spec:
  selector:
    app: loki
  ports:
  - port: 3100
    targetPort: 3100
    protocol: TCP
  type: ClusterIP`;
  }

  static generatePromtailConfigMap(projectName) {
    return `apiVersion: v1
kind: ConfigMap
metadata:
  name: promtail-config
  namespace: monitoring
data:
  promtail-config.yaml: |
    server:
      http_listen_port: 9080
    
    clients:
      - url: http://loki:3100/loki/api/v1/push
    
    scrape_configs:
      - job_name: kubernetes-pods
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __path__
            regex: (.+)
          - action: labelmap
            regex: __meta_kubernetes_pod_label_(.+)
          - source_labels: [__meta_kubernetes_namespace]
            action: replace
            target_label: namespace
          - source_labels: [__meta_kubernetes_pod_name]
            action: replace
            target_label: pod
          - source_labels: [__meta_kubernetes_pod_node_name]
            action: replace
            target_label: node`;
  }

  static generatePromtailDaemonSet(namespace) {
    return `apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: promtail
  namespace: ${namespace}
  labels:
    app: promtail
spec:
  selector:
    matchLabels:
      app: promtail
  template:
    metadata:
      labels:
        app: promtail
    spec:
      containers:
      - name: promtail
        image: grafana/promtail:latest
        ports:
        - containerPort: 9080
        volumeMounts:
        - name: config
          mountPath: /etc/promtail
        - name: varlog
          mountPath: /var/log
          readOnly: true
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
      volumes:
      - name: config
        configMap:
          name: promtail-config
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers`;
  }

  static getTemplate() {
    return {
      name: 'Monitoring Stack Generator',
      description: 'Generate complete monitoring stack with Prometheus, Grafana, AlertManager, Loki, and Promtail',
      fields: [
        {
          name: 'projectName',
          label: 'Project Name',
          type: 'text',
          required: true,
          placeholder: 'my-awesome-project'
        },
        {
          name: 'namespace',
          label: 'Namespace',
          type: 'text',
          defaultValue: 'monitoring',
          placeholder: 'monitoring'
        },
        {
          name: 'retentionDays',
          label: 'Log Retention Days',
          type: 'number',
          defaultValue: 15,
          placeholder: '15'
        },
        {
          name: 'alertManagerEmail',
          label: 'Alert Manager Email',
          type: 'email',
          defaultValue: 'alerts@example.com',
          placeholder: 'alerts@example.com'
        },
        {
          name: 'enableGrafana',
          label: 'Enable Grafana',
          type: 'checkbox',
          defaultValue: true
        },
        {
          name: 'enablePrometheus',
          label: 'Enable Prometheus',
          type: 'checkbox',
          defaultValue: true
        },
        {
          name: 'enableNodeExporter',
          label: 'Enable Node Exporter',
          type: 'checkbox',
          defaultValue: true
        },
        {
          name: 'enableAlertManager',
          label: 'Enable AlertManager',
          type: 'checkbox',
          defaultValue: true
        },
        {
          name: 'enableLoki',
          label: 'Enable Loki',
          type: 'checkbox',
          defaultValue: true
        },
        {
          name: 'enablePromtail',
          label: 'Enable Promtail',
          type: 'checkbox',
          defaultValue: true
        }
      ]
    };
  }
}

module.exports = MonitoringGenerator;
