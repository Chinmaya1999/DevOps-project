const express = require('express');
const { auth } = require('../middleware/auth');
const GenerateController = require('../controllers/generateController');

const archiver = require('archiver');
const BundleGenerator = require('../services/bundleGenerator');
const { generateBundleSchema } = require('../utils/validators');
const { requireFeature, enforceGenerationQuota } = require('../middleware/subscription');

const router = express.Router();

// Get available templates - public endpoint
router.get('/templates', GenerateController.getTemplates);

// All other generate routes require authentication
router.use(auth);

// Free plan: capped generations per month (bundle is Pro-only and checked on its own route)
router.use((req, res, next) => (req.method === 'POST' && req.path !== '/bundle' ? enforceGenerationQuota(req, res, next) : next()));

// Generate Jenkins pipeline
router.post('/jenkins', GenerateController.generateJenkins);

// Generate GitHub Actions workflow
router.post('/github-actions', GenerateController.generateGitHubActions);

// Generate GitLab CI pipeline
router.post('/gitlab-ci', GenerateController.generateGitLabCI);

// Generate Azure DevOps pipeline
router.post('/azure-devops', GenerateController.generateAzureDevOps);

// Generate Monitoring stack
router.post('/monitoring', GenerateController.generateMonitoring);

// Generate SSL/HTTPS configuration
router.post('/ssl', GenerateController.generateSSL);

// Generate Ansible playbook
router.post('/ansible', GenerateController.generateAnsible);

// Generate Kubernetes resources
router.post('/kubernetes', GenerateController.generateKubernetes);

// Generate Terraform configuration
router.post('/terraform', GenerateController.generateTerraform);

// Generate Dockerfile
router.post('/dockerfile', GenerateController.generateDockerfile);

// Generate Bash script
router.post('/bash', GenerateController.generateBash);

// Generate Shell script
router.post('/shell', GenerateController.generateShell);

// Generate Python script
router.post('/python', GenerateController.generatePython);

// Full-stack bundle: Dockerfile + compose + CI/CD + Kubernetes, downloaded as a ZIP
router.post('/bundle', requireFeature('bundle'), (req, res) => {
  const { error, value } = generateBundleSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: 'Validation failed', details: error.details[0].message });
  }
  const files = BundleGenerator.generate(value);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${value.appName}-devops-bundle.zip"`);
  const zip = archiver('zip', { zlib: { level: 9 } });
  zip.on('error', () => res.destroy());
  zip.pipe(res);
  files.forEach((f) => zip.append(f.content, { name: `${value.appName}/${f.path}` }));
  zip.finalize();
});

module.exports = router;
