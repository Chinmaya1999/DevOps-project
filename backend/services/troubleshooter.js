/**
 * Rule-based diagnosis of the errors DevOps engineers hit every day.
 * Each rule: a pattern for the pasted log/error, the likely cause, and concrete next steps.
 */
const RULES = [
  // ---- Kubernetes ----
  { id: 'k8s-crashloop', tool: 'Kubernetes', title: 'CrashLoopBackOff', re: /CrashLoopBackOff/i,
    cause: 'The container starts, then exits, and Kubernetes keeps restarting it with growing back-off delays.',
    steps: ['kubectl logs <pod> --previous  (logs of the crashed run)', 'kubectl describe pod <pod>  (check Last State, Exit Code, Events)', 'Exit 1/2 = app error or missing config/env; 137 = OOMKilled; 139 = segfault', 'Verify env vars, ConfigMaps/Secrets and the container command/args', 'Temporarily override the command with "sleep 3600" and exec in to debug'] },
  { id: 'k8s-imagepull', tool: 'Kubernetes', title: 'ImagePullBackOff / ErrImagePull', re: /ImagePullBackOff|ErrImagePull|Failed to pull image/i,
    cause: 'The node cannot download the image: wrong name/tag, private registry without credentials, or registry rate limits.',
    steps: ['kubectl describe pod <pod> | grep -A5 Events  (read the exact registry error)', 'Check the image name and tag exist: docker pull <image>', 'Private registry: kubectl create secret docker-registry regcred ... and add imagePullSecrets', 'Docker Hub "toomanyrequests": authenticate or mirror the image to your own registry', 'Avoid :latest; pin an explicit tag or digest'] },
  { id: 'k8s-oom', tool: 'Kubernetes', title: 'OOMKilled (out of memory)', re: /OOMKilled|exit code:? ?137|Exit Code:\s*137/i,
    cause: 'The container exceeded its memory limit and the kernel killed it.',
    steps: ['kubectl top pod <pod> --containers  (actual usage)', 'Raise resources.limits.memory (and requests) or fix the leak', 'JVM: set -XX:MaxRAMPercentage=75; Node: --max-old-space-size below the limit', 'Add a memory graph/alert (Prometheus container_memory_working_set_bytes)'] },
  { id: 'k8s-pending', tool: 'Kubernetes', title: 'Pod stuck Pending / FailedScheduling', re: /FailedScheduling|Insufficient (cpu|memory)|0\/\d+ nodes are available|Unschedulable/i,
    cause: 'No node can satisfy the pod: not enough CPU/memory, node selectors/taints, or unbound volumes.',
    steps: ['kubectl describe pod <pod>  (the Events line says exactly why)', 'kubectl describe nodes | grep -A6 "Allocated resources"', 'Lower requests, add nodes, or enable Cluster Autoscaler', 'Check nodeSelector/affinity and taints/tolerations', 'Check the PVC is Bound: kubectl get pvc'] },
  { id: 'k8s-config-error', tool: 'Kubernetes', title: 'CreateContainerConfigError', re: /CreateContainerConfigError|couldn't find key .* in (Secret|ConfigMap)|secret ".*" not found|configmap ".*" not found/i,
    cause: 'The pod references a Secret/ConfigMap (or a key in one) that does not exist in its namespace.',
    steps: ['kubectl get secret,configmap -n <namespace>', 'Check spelling of the name and key, and that it is in the SAME namespace', 'Create the missing object before the Deployment is applied'] },
  { id: 'k8s-probe', tool: 'Kubernetes', title: 'Readiness / liveness probe failing', re: /(Readiness|Liveness|Startup) probe failed/i,
    cause: 'The health check endpoint is wrong, too slow to start, or the app is unhealthy; a failing liveness probe restarts the pod.',
    steps: ['kubectl exec <pod> -- wget -qO- localhost:<port><path>  (test the probe by hand)', 'Increase initialDelaySeconds / use a startupProbe for slow apps', 'Make sure the probe port/path match the container', 'Do not make liveness depend on external services'] },
  { id: 'k8s-forbidden', tool: 'Kubernetes', title: 'RBAC: Forbidden', re: /forbidden: User ".*" cannot|is forbidden: .*cannot (get|list|create|delete|patch|update)/i,
    cause: 'The user or ServiceAccount lacks permission for that verb/resource.',
    steps: ['kubectl auth can-i <verb> <resource> --as <user-or-sa>', 'Create a Role/ClusterRole with the minimum verbs and bind it with RoleBinding', 'Avoid cluster-admin; scope to the namespace'] },
  { id: 'k8s-nomatch', tool: 'Kubernetes', title: 'no matches for kind / unknown API version', re: /no matches for kind|unable to recognize .*no matches|resource mapping not found/i,
    cause: 'The CRD is not installed yet, or the manifest uses an API version removed from your cluster version.',
    steps: ['kubectl api-resources | grep -i <kind>', 'Install the operator/CRDs first (apply CRDs before the resources using them)', 'Upgrade the manifest apiVersion (e.g. extensions/v1beta1 → networking.k8s.io/v1)'] },
  // ---- Docker ----
  { id: 'docker-sock', tool: 'Docker', title: 'Permission denied on docker.sock', re: /permission denied.*docker\.sock|Got permission denied while trying to connect to the Docker daemon/i,
    cause: 'The current user is not allowed to talk to the Docker daemon.',
    steps: ['sudo usermod -aG docker $USER && newgrp docker', 'CI: use rootless/Kaniko/BuildKit instead of mounting docker.sock', 'Never chmod 666 /var/run/docker.sock'] },
  { id: 'docker-space', tool: 'Docker', title: 'No space left on device', re: /no space left on device/i,
    cause: 'Disk is full — usually old images, build cache, container logs or volumes.',
    steps: ['df -h && docker system df', 'docker system prune -af --volumes  (CAUTION: removes unused volumes)', 'Set log rotation: --log-opt max-size=10m --log-opt max-file=3', 'journalctl --vacuum-size=200M'] },
  { id: 'docker-port', tool: 'Docker', title: 'Port already allocated', re: /port is already allocated|address already in use|bind: address already in use/i,
    cause: 'Another process or container already listens on that host port.',
    steps: ['sudo lsof -i :<port>  or  ss -ltnp | grep :<port>', 'docker ps  (stop the old container)', 'Map a different host port: -p 8081:80'] },
  { id: 'docker-arch', tool: 'Docker', title: 'exec format error (wrong CPU architecture)', re: /exec format error|no matching manifest for linux\/(arm64|amd64)/i,
    cause: 'The image was built for a different CPU architecture (e.g. built on Apple Silicon, run on amd64).',
    steps: ['docker buildx build --platform linux/amd64,linux/arm64 -t <image> --push .', 'Or run with --platform linux/amd64', 'Check: docker image inspect <image> --format "{{.Architecture}}"'] },
  { id: 'docker-ratelimit', tool: 'Docker', title: 'Docker Hub rate limit', re: /toomanyrequests|You have reached your pull rate limit/i,
    cause: 'Anonymous Docker Hub pulls are limited per IP.',
    steps: ['docker login with an account (higher limit)', 'Mirror base images to ECR/GHCR and pull from there', 'Use a pull-through cache registry'] },
  // ---- Terraform ----
  { id: 'tf-lock', tool: 'Terraform', title: 'Error acquiring the state lock', re: /Error acquiring the state lock|state lock/i,
    cause: 'Another run holds the lock, or a previous run crashed and left it behind.',
    steps: ['Confirm nobody else is running terraform apply', 'terraform force-unlock <LOCK_ID>  (only when you are sure)', 'Prevent: run applies only from CI with concurrency limits'] },
  { id: 'tf-creds', tool: 'Terraform', title: 'No valid credential sources / invalid AWS credentials', re: /No valid credential sources|InvalidClientTokenId|SignatureDoesNotMatch|ExpiredToken|security token included in the request is (invalid|expired)/i,
    cause: 'AWS credentials are missing, wrong or expired.',
    steps: ['aws sts get-caller-identity  (who am I?)', 'Check AWS_PROFILE / AWS_ACCESS_KEY_ID / AWS_SESSION_TOKEN and the region', 'Refresh SSO: aws sso login', 'CI: use OIDC role assumption instead of long-lived keys'] },
  { id: 'tf-exists', tool: 'Terraform', title: 'Resource already exists', re: /AlreadyExists|EntityAlreadyExists|already exists/i,
    cause: 'The resource exists in the cloud but is not in Terraform state.',
    steps: ['terraform import <address> <id>  to adopt it', 'Or rename/delete the existing resource if it is stale', 'Use terraform plan before apply to catch it early'] },
  { id: 'tf-provider', tool: 'Terraform', title: 'Provider / version constraint problem', re: /Failed to query available provider packages|no available releases match|Inconsistent dependency lock file|provider registry/i,
    cause: 'Provider version constraints cannot be satisfied or the lock file is out of date.',
    steps: ['terraform init -upgrade', 'Align required_providers version ranges across modules', 'Commit .terraform.lock.hcl; terraform providers lock -platform=linux_amd64 -platform=darwin_arm64'] },
  { id: 'tf-cycle', tool: 'Terraform', title: 'Dependency cycle', re: /Cycle:/i,
    cause: 'Two or more resources depend on each other.',
    steps: ['terraform graph | dot -Tpng > graph.png to visualise it', 'Break the loop: move the shared attribute to a separate resource (e.g. security group rules as aws_security_group_rule)'] },
  { id: 'aws-denied', tool: 'AWS', title: 'AccessDenied / UnauthorizedOperation', re: /AccessDenied|UnauthorizedOperation|is not authorized to perform/i,
    cause: 'The IAM principal lacks the permission (or an SCP / permission boundary / bucket policy denies it).',
    steps: ['Read the exact action in the error: "not authorized to perform: <service:Action>"', 'Add that action for the specific resource ARN (least privilege)', 'Check SCPs, permission boundaries and resource policies', 'Decode the message: aws sts decode-authorization-message --encoded-message <msg>'] },
  { id: 'aws-throttle', tool: 'AWS', title: 'Throttling / rate exceeded', re: /ThrottlingException|Rate exceeded|RequestLimitExceeded|TooManyRequests/i,
    cause: 'Too many API calls in a short time.',
    steps: ['Retry with exponential backoff and jitter', 'Reduce parallelism (terraform apply -parallelism=5)', 'Request a quota increase if it is steady-state'] },
  // ---- Web / network ----
  { id: 'nginx-502', tool: 'Nginx', title: '502 Bad Gateway / upstream error', re: /502 Bad Gateway|upstream (prematurely closed|timed out)|connect\(\) failed .* upstream|no live upstreams/i,
    cause: 'Nginx cannot get a valid response from the app behind it (app down, wrong port, or too slow).',
    steps: ['curl -v localhost:<app-port>  from the nginx host', 'Check proxy_pass host:port and that the app listens on 0.0.0.0, not 127.0.0.1 in containers', 'journalctl -u nginx / tail /var/log/nginx/error.log', 'Raise proxy_read_timeout for slow endpoints'] },
  { id: 'ssh-hostkey', tool: 'SSH', title: 'Host key changed', re: /REMOTE HOST IDENTIFICATION HAS CHANGED/i,
    cause: 'The server was rebuilt (new key) — or someone is intercepting the connection.',
    steps: ['If you rebuilt the server: ssh-keygen -R <host>', 'If not: STOP and verify with the server owner before reconnecting'] },
  { id: 'ssh-denied', tool: 'SSH', title: 'Permission denied (publickey)', re: /Permission denied \(publickey/i,
    cause: 'The server does not accept your key, or the wrong user / key file permissions are used.',
    steps: ['ssh -vvv user@host  (see which keys are offered)', 'chmod 400 key.pem', 'Use the right username (ec2-user, ubuntu, admin, root)', 'Check the key pair attached to the instance'] },
  { id: 'ssh-timeout', tool: 'SSH', title: 'Connection timed out', re: /Connection timed out|Operation timed out|Connection refused/i,
    cause: 'The port is blocked (security group / firewall), the host is down, or sshd is not listening.',
    steps: ['Check the security group allows 22 from your IP', 'Check the instance is running and has a public IP / route', 'nc -vz <host> 22'] },
  { id: 'tls-cert', tool: 'TLS', title: 'Certificate error (x509)', re: /x509: certificate|certificate has expired|unable to verify the first certificate|CERT_HAS_EXPIRED|SSL certificate problem/i,
    cause: 'The certificate expired, is for another hostname, or the CA chain is missing.',
    steps: ['openssl s_client -connect <host>:443 -servername <host> | openssl x509 -noout -dates -subject', 'Renew: certbot renew  (and confirm the timer runs)', 'Serve the full chain (fullchain.pem), not just the leaf', 'Automate with cert-manager / ACM'] },
  // ---- CI/CD ----
  { id: 'gha-perm', tool: 'GitHub Actions', title: 'Resource not accessible by integration', re: /Resource not accessible by integration/i,
    cause: 'The workflow GITHUB_TOKEN does not have the required permissions.',
    steps: ['Add a permissions: block to the job (e.g. contents: write, packages: write, pull-requests: write)', 'Forked PRs get read-only tokens by design'] },
  { id: 'git-auth', tool: 'Git', title: 'Authentication / permission failure', re: /Authentication failed|Repository not found|could not read Username|Permission denied to/i,
    cause: 'Wrong or expired credentials, or the token lacks repo access.',
    steps: ['Use a fine-grained PAT or SSH deploy key with access to that repository', 'git remote -v  (check the URL)', 'CI: use the built-in token or a GitHub App'] },
  // ---- Linux ----
  { id: 'linux-nofile', tool: 'Linux', title: 'Too many open files', re: /Too many open files|EMFILE/i,
    cause: 'The process hit its file-descriptor limit.',
    steps: ['ulimit -n  and  cat /proc/<pid>/limits', 'systemd: LimitNOFILE=65535; Docker: --ulimit nofile=65535:65535', 'Look for leaked sockets/files (lsof -p <pid> | wc -l)'] },
  { id: 'linux-oom', tool: 'Linux', title: 'Out of memory (kernel OOM killer)', re: /Out of memory: Kill(ed)? process|Cannot allocate memory|oom-kill/i,
    cause: 'The host ran out of RAM and the kernel killed a process.',
    steps: ['dmesg -T | grep -i "killed process"', 'free -m && ps aux --sort=-%mem | head', 'Add memory/swap, set cgroup limits, fix the leak'] },
];

const MAX_LENGTH = 100000;

class Troubleshooter {
  static diagnose(text) {
    if (typeof text !== 'string' || !text.trim()) throw new Error('Paste an error message or log');
    if (text.length > MAX_LENGTH) throw new Error('Input too large');
    const matches = RULES.filter((r) => r.re.test(text)).map(({ id, tool, title, cause, steps }) => ({ id, tool, title, cause, steps }));
    return { matched: matches.length, matches };
  }
}

/** Areas and the symptoms in each — powers the guided "what are you seeing?" flow. */
Troubleshooter.catalog = () => {
  const areas = new Map();
  for (const r of RULES) {
    if (!areas.has(r.tool)) areas.set(r.tool, []);
    areas.get(r.tool).push({ id: r.id, title: r.title });
  }
  return [...areas.entries()].map(([area, issues]) => ({ area, issues }));
};

Troubleshooter.byId = (id) => {
  const r = RULES.find((x) => x.id === id);
  return r ? { id: r.id, tool: r.tool, title: r.title, cause: r.cause, steps: r.steps } : null;
};

Troubleshooter.RULE_COUNT = RULES.length;
module.exports = Troubleshooter;
