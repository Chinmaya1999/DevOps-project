const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(10).max(128).pattern(/[A-Za-z]/).pattern(/\d/).required().messages({'string.min':'Password must be at least 10 characters long','string.pattern.base':'Password must contain letters and numbers'}),
  workExperience: Joi.string().optional(),
  domains: Joi.array().items(Joi.string()).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const generateJenkinsSchema = Joi.object({
  projectName: Joi.string().pattern(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,62}$/).required().messages({'string.pattern.base': 'projectName may only contain letters, numbers, - and _'}),
  repositoryUrl: Joi.string().uri().required(),
  branch: Joi.string().default('main'),
  dockerImage: Joi.string().optional(),
  environmentVariables: Joi.object().optional(),
  buildSteps: Joi.array().items(Joi.string()).optional(),
  testCommand: Joi.string().optional(),
  deployCommand: Joi.string().optional()
});

const generateGitHubActionsSchema = Joi.object({
  projectName: Joi.string().pattern(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,62}$/).required().messages({'string.pattern.base': 'projectName may only contain letters, numbers, - and _'}),
  repositoryUrl: Joi.string().uri().required(),
  branch: Joi.string().default('main'),
  nodeVersion: Joi.string().default('18'),
  dockerImage: Joi.string().optional(),
  environmentVariables: Joi.object().optional(),
  testCommand: Joi.string().default('npm test'),
  buildCommand: Joi.string().default('npm run build')
});

const generateAnsibleSchema = Joi.object({
  playbookName: Joi.string().required(),
  targetHosts: Joi.array().items(Joi.string()).required(),
  become: Joi.boolean().default(true),
  tasks: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    module: Joi.string().required(),
    parameters: Joi.object().optional()
  })).required()
});

const generateKubernetesSchema = Joi.object({
  appName: Joi.string().required(),
  dockerImage: Joi.string().required(),
  replicas: Joi.number().integer().min(1).default(3),
  containerPort: Joi.number().integer().min(1).max(65535).required(),
  serviceType: Joi.string().valid('ClusterIP', 'NodePort', 'LoadBalancer').default('ClusterIP'),
  servicePort: Joi.number().integer().min(1).max(65535).default(80),
  environmentVariables: Joi.object().optional(),
  resources: Joi.object({
    requests: Joi.object({
      memory: Joi.string().optional(),
      cpu: Joi.string().optional()
    }).optional(),
    limits: Joi.object({
      memory: Joi.string().optional(),
      cpu: Joi.string().optional()
    }).optional()
  }).optional()
});

const generateTerraformSchema = Joi.object({
  projectName: Joi.string().pattern(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,62}$/).required().messages({'string.pattern.base': 'projectName may only contain letters, numbers, - and _'}),
  provider: Joi.string().valid('aws', 'gcp', 'azure').required(),
  region: Joi.string().required(),
  resources: Joi.array().items(Joi.object({
    type: Joi.string().required(),
    name: Joi.string().required(),
    configuration: Joi.object().required()
  })).required()
});

module.exports = {
  registerSchema,
  loginSchema,
  generateJenkinsSchema,
  generateGitHubActionsSchema,
  generateAnsibleSchema,
  generateKubernetesSchema,
  generateTerraformSchema
};


const generateBundleSchema = Joi.object({
  appName: Joi.string().pattern(/^[a-z][a-z0-9-]{1,40}$/).required()
    .messages({ 'string.pattern.base': 'appName must be lowercase letters, numbers and dashes (2-41 chars)' }),
  runtime: Joi.string().valid('node', 'python', 'go', 'static').required(),
  port: Joi.number().integer().min(1).max(65535).default(3000),
  replicas: Joi.number().integer().min(1).max(10).default(2),
  dockerHubUser: Joi.string().pattern(/^[a-z0-9][a-z0-9_-]{1,38}$/).required()
});

module.exports.generateBundleSchema = generateBundleSchema;
