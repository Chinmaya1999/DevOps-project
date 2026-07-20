class SSLGenerator {
  static generate(config) {
    const {
      domain,
      email,
      provider = 'letsencrypt',
      dnsProvider = 'route53',
      cloudflareApiKey = '',
      cloudflareEmail = ''
    } = config;

    const manifests = [];

    // Cert-Manager Namespace
    manifests.push(this.generateCertManagerNamespace());

    // Cert-Manager Installation
    manifests.push(this.generateCertManagerInstall());

    // Cluster Issuer based on provider
    if (provider === 'letsencrypt') {
      if (dnsProvider === 'route53') {
        manifests.push(this.generateRoute53ClusterIssuer(email));
      } else if (dnsProvider === 'cloudflare') {
        manifests.push(this.generateCloudflareClusterIssuer(cloudflareEmail, cloudflareApiKey));
      } else {
        manifests.push(this.generateHTTP01ClusterIssuer(email));
      }
    }

    // Certificate for domain
    manifests.push(this.generateCertificate(domain, provider));

    // Ingress with SSL
    manifests.push(this.generateSSLIngress(domain));

    // HTTP to HTTPS redirect
    manifests.push(this.generateHTTPRedirect());

    return manifests.join('\n---\n\n');
  }

  static generateCertManagerNamespace() {
    return `apiVersion: v1
kind: Namespace
metadata:
  name: cert-manager
  labels:
    name: cert-manager`;
  }

  static generateCertManagerInstall() {
    return `# Cert-Manager Installation
# Apply with: kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# After installation, verify with:
# kubectl get pods --namespace cert-manager`;
  }

  static generateRoute53ClusterIssuer(email) {
    return `apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
  namespace: cert-manager
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ${email}
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - dns01:
        route53:
          region: us-east-1
          hostedZoneID: YOUR_HOSTED_ZONE_ID
          accessKeyID: AWS_ACCESS_KEY_ID
          secretAccessKeySecretRef:
            name: route53-credentials
            key: secret-access-key`;
  }

  static generateCloudflareClusterIssuer(email, apiKey) {
    return `apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
  namespace: cert-manager
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ${email}
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - dns01:
        cloudflare:
          email: ${email}
          apiTokenSecretRef:
            name: cloudflare-api-token
            key: api-token`;
  }

  static generateHTTP01ClusterIssuer(email) {
    return `apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
  namespace: cert-manager
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ${email}
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx`;
  }

  static generateCertificate(domain, provider) {
    return `apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: ${domain.replace(/\./g, '-')}-tls
  namespace: default
spec:
  secretName: ${domain.replace(/\./g, '-')}-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  commonName: ${domain}
  dnsNames:
  - ${domain}
  - www.${domain}`;
  }

  static generateSSLIngress(domain) {
    const secretName = `${domain.replace(/\./g, '-')}-tls`;
    return `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${domain.replace(/\./g, '-')}-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - ${domain}
    - www.${domain}
    secretName: ${secretName}
  rules:
  - host: ${domain}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app-service
            port:
              number: 80
  - host: www.${domain}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app-service
            port:
              number: 80`;
  }

  static generateHTTPRedirect() {
    return `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: http-redirect
  annotations:
    nginx.ingress.kubernetes.io/permanent-redirect: "https://$host$request_uri"
spec:
  ingressClassName: nginx
  rules:
  - http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app-service
            port:
              number: 80`;
  }

  static generateDNSRecords(domain, ipAddress) {
    return `# DNS Records Configuration for ${domain}

# A Record for root domain
${domain} A ${ipAddress}

# A Record for www subdomain
www.${domain} A ${ipAddress}

# Optional: CNAME for common subdomains
api.${domain} CNAME ${domain}
app.${domain} CNAME ${domain}
staging.${domain} CNAME ${domain}`;
  }

  static getTemplate() {
    return {
      name: 'SSL/HTTPS Generator',
      description: 'Generate SSL certificates and HTTPS configuration with Let\'s Encrypt',
      fields: [
        {
          name: 'domain',
          label: 'Domain Name',
          type: 'text',
          required: true,
          placeholder: 'example.com'
        },
        {
          name: 'email',
          label: 'Email for Let\'s Encrypt',
          type: 'email',
          required: true,
          placeholder: 'admin@example.com'
        },
        {
          name: 'provider',
          label: 'SSL Provider',
          type: 'select',
          defaultValue: 'letsencrypt',
          options: [
            { value: 'letsencrypt', label: 'Let\'s Encrypt (Free)' },
            { value: 'self-signed', label: 'Self-Signed (Development)' }
          ]
        },
        {
          name: 'dnsProvider',
          label: 'DNS Provider',
          type: 'select',
          defaultValue: 'route53',
          options: [
            { value: 'route53', label: 'AWS Route53' },
            { value: 'cloudflare', label: 'Cloudflare' },
            { value: 'http01', label: 'HTTP-01 Challenge' }
          ]
        },
        {
          name: 'cloudflareEmail',
          label: 'Cloudflare Email',
          type: 'email',
          placeholder: 'admin@example.com',
          description: 'Required if using Cloudflare DNS'
        },
        {
          name: 'cloudflareApiKey',
          label: 'Cloudflare API Key',
          type: 'password',
          placeholder: 'Your Cloudflare API Key',
          description: 'Required if using Cloudflare DNS'
        }
      ]
    };
  }
}

module.exports = SSLGenerator;
