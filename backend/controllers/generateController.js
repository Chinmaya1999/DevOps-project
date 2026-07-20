const GeneratedFile = require('../models/GeneratedFile');
const JenkinsGenerator = require('../services/jenkinsGenerator');
const GitHubActionsGenerator = require('../services/githubActionsGenerator');
const GitLabCIGenerator = require('../services/gitlabCiGenerator');
const AzureDevOpsGenerator = require('../services/azureDevOpsGenerator');
const AnsibleGenerator = require('../services/ansibleGenerator');
const KubernetesGenerator = require('../services/kubernetesGenerator');
const TerraformGenerator = require('../services/terraformGenerator');
const DockerfileGenerator = require('../services/dockerfileGenerator');
const BashGenerator = require('../services/bashGenerator');
const ShellGenerator = require('../services/shellGenerator');
const PythonGenerator = require('../services/pythonGenerator');
const MonitoringGenerator = require('../services/monitoringGenerator');
const SSLGenerator = require('../services/sslGenerator');
const {
  generateJenkinsSchema,
  generateGitHubActionsSchema,
  generateAnsibleSchema,
  generateKubernetesSchema,
  generateTerraformSchema
} = require('../utils/validators');

class GenerateController {
  static async generateJenkins(req, res) {
    try {
      const { error, value } = generateJenkinsSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details[0].message
        });
      }

      const jenkinsfile = JenkinsGenerator.generate(value);
      
      const generatedFile = await GeneratedFile.create({
        userId: req.user.id,
        type: 'jenkins',
        name: value.projectName,
        content: jenkinsfile,
        inputs: value,
        fileName: 'Jenkinsfile',
        description: `Jenkins pipeline for ${value.projectName}`,
        tags: ['jenkins', 'ci-cd', 'pipeline']
      });

      res.json({
        success: true,
        data: {
          id: generatedFile._id,
          content: jenkinsfile,
          fileName: 'Jenkinsfile',
          type: 'jenkins'
        }
      });
    } catch (error) {
      console.error('Jenkins generation error:', error);
      res.status(500).json({ error: 'Failed to generate Jenkins pipeline' });
    }
  }

  static async generateGitHubActions(req, res) {
    try {
      const { error, value } = generateGitHubActionsSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details[0].message
        });
      }

      const workflow = GitHubActionsGenerator.generate(value);
      
      const generatedFile = await GeneratedFile.create({
        userId: req.user.id,
        type: 'github-actions',
        name: value.projectName,
        content: workflow,
        inputs: value,
        fileName: '.github/workflows/ci-cd.yml',
        description: `GitHub Actions workflow for ${value.projectName}`,
        tags: ['github-actions', 'ci-cd', 'workflow']
      });

      res.json({
        success: true,
        data: {
          id: generatedFile._id,
          content: workflow,
          fileName: '.github/workflows/ci-cd.yml',
          type: 'github-actions'
        }
      });
    } catch (error) {
      console.error('GitHub Actions generation error:', error);
      res.status(500).json({ error: 'Failed to generate GitHub Actions workflow' });
    }
  }

  static async generateGitLabCI(req, res) {
    try {
      const gitlabCi = GitLabCIGenerator.generate(req.body);
      
      const generatedFile = await GeneratedFile.create({
        userId: req.user.id,
        type: 'gitlab-ci',
        name: req.body.projectName,
        content: gitlabCi,
        inputs: req.body,
        fileName: '.gitlab-ci.yml',
        description: `GitLab CI pipeline for ${req.body.projectName}`,
        tags: ['gitlab-ci', 'ci-cd', 'pipeline']
      });

      res.json({
        success: true,
        data: {
          id: generatedFile._id,
          content: gitlabCi,
          fileName: '.gitlab-ci.yml',
          type: 'gitlab-ci'
        }
      });
    } catch (error) {
      console.error('GitLab CI generation error:', error);
      res.status(500).json({ error: 'Failed to generate GitLab CI pipeline' });
    }
  }

  static async generateAzureDevOps(req, res) {
    try {
      const azurePipeline = AzureDevOpsGenerator.generate(req.body);
      
      const generatedFile = await GeneratedFile.create({
        userId: req.user.id,
        type: 'azure-devops',
        name: req.body.projectName,
        content: azurePipeline,
        inputs: req.body,
        fileName: 'azure-pipelines.yml',
        description: `Azure DevOps pipeline for ${req.body.projectName}`,
        tags: ['azure-devops', 'ci-cd', 'pipeline']
      });

      res.json({
        success: true,
        data: {
          id: generatedFile._id,
          content: azurePipeline,
          fileName: 'azure-pipelines.yml',
          type: 'azure-devops'
        }
      });
    } catch (error) {
      console.error('Azure DevOps generation error:', error);
      res.status(500).json({ error: 'Failed to generate Azure DevOps pipeline' });
    }
  }

  static async generateMonitoring(req, res) {
    try {
      const monitoringStack = MonitoringGenerator.generate(req.body);
      
      const generatedFile = await GeneratedFile.create({
        userId: req.user.id,
        type: 'monitoring',
        name: req.body.projectName,
        content: monitoringStack,
        inputs: req.body,
        fileName: 'monitoring-stack.yaml',
        description: `Monitoring stack for ${req.body.projectName}`,
        tags: ['monitoring', 'prometheus', 'grafana', 'kubernetes']
      });

      res.json({
        success: true,
        data: {
          id: generatedFile._id,
          content: monitoringStack,
          fileName: 'monitoring-stack.yaml',
          type: 'monitoring'
        }
      });
    } catch (error) {
      console.error('Monitoring generation error:', error);
      res.status(500).json({ error: 'Failed to generate monitoring stack' });
    }
  }

  static async generateSSL(req, res) {
    try {
      const sslConfig = SSLGenerator.generate(req.body);
      
      const generatedFile = await GeneratedFile.create({
        userId: req.user.id,
        type: 'ssl',
        name: req.body.domain,
        content: sslConfig,
        inputs: req.body,
        fileName: 'ssl-configuration.yaml',
        description: `SSL/HTTPS configuration for ${req.body.domain}`,
        tags: ['ssl', 'https', 'cert-manager', 'kubernetes']
      });

      res.json({
        success: true,
        data: {
          id: generatedFile._id,
          content: sslConfig,
          fileName: 'ssl-configuration.yaml',
          type: 'ssl'
        }
      });
    } catch (error) {
      console.error('SSL generation error:', error);
      res.status(500).json({ error: 'Failed to generate SSL configuration' });
    }
  }

  static async generateAnsible(req, res) {
    try {
      const { error, value } = generateAnsibleSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details[0].message
        });
      }

      const playbook = AnsibleGenerator.generate(value);
      const inventory = AnsibleGenerator.generateInventory(value.targetHosts);
      const rolesStructure = AnsibleGenerator.generateRolesDirectory();
      
      const generatedFile = await GeneratedFile.create({
        userId: req.user.id,
        type: 'ansible',
        name: value.playbookName,
        content: playbook,
        inputs: value,
        fileName: `${value.playbookName}.yml`,
        description: `Ansible playbook for ${value.playbookName}`,
        tags: ['ansible', 'automation', 'playbook']
      });

      res.json({
        success: true,
        data: {
          id: generatedFile._id,
          content: playbook,
          inventory: inventory,
          rolesStructure: rolesStructure,
          fileName: `${value.playbookName}.yml`,
          type: 'ansible'
        }
      });
    } catch (error) {
      console.error('Ansible generation error:', error);
      res.status(500).json({ error: 'Failed to generate Ansible playbook' });
    }
  }

  static async generateKubernetes(req, res) {
    try {
      const { error, value } = generateKubernetesSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details[0].message
        });
      }

      const k8sResources = KubernetesGenerator.generate(value);
      
      const generatedFile = await GeneratedFile.create({
        userId: req.user.id,
        type: 'kubernetes',
        name: value.appName,
        content: k8sResources.deployment,
        inputs: value,
        fileName: `${value.appName}-deployment.yaml`,
        description: `Kubernetes deployment for ${value.appName}`,
        tags: ['kubernetes', 'k8s', 'deployment']
      });

      res.json({
        success: true,
        data: {
          id: generatedFile._id,
          ...k8sResources,
          fileName: `${value.appName}-deployment.yaml`,
          type: 'kubernetes'
        }
      });
    } catch (error) {
      console.error('Kubernetes generation error:', error);
      res.status(500).json({ error: 'Failed to generate Kubernetes resources' });
    }
  }

  static async generateTerraform(req, res) {
    try {
      const { error, value } = generateTerraformSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details[0].message
        });
      }

      const terraformFiles = TerraformGenerator.generate(value);
      
      const generatedFile = await GeneratedFile.create({
        userId: req.user.id,
        type: 'terraform',
        name: value.projectName,
        content: terraformFiles.main,
        inputs: value,
        fileName: 'main.tf',
        description: `Terraform configuration for ${value.projectName}`,
        tags: ['terraform', 'infrastructure', 'iac']
      });

      res.json({
        success: true,
        data: {
          id: generatedFile._id,
          ...terraformFiles,
          fileName: 'main.tf',
          type: 'terraform'
        }
      });
    } catch (error) {
      console.error('Terraform generation error:', error);
      res.status(500).json({ error: 'Failed to generate Terraform configuration' });
    }
  }

  static async generateDockerfile(req, res) {
    try {
      const dockerfile = DockerfileGenerator.generateDockerfile(req.body);
      
      const generatedFile = await GeneratedFile.create({
        userId: req.user.id,
        type: 'dockerfile',
        name: req.body.name || 'Dockerfile',
        content: dockerfile,
        inputs: req.body,
        fileName: 'Dockerfile',
        description: `Dockerfile for ${req.body.appType || 'application'}`,
        tags: ['docker', 'container', 'dockerfile']
      });

      res.json({
        success: true,
        data: {
          id: generatedFile._id,
          content: dockerfile,
          fileName: 'Dockerfile',
          type: 'dockerfile'
        }
      });
    } catch (error) {
      console.error('Dockerfile generation error:', error);
      res.status(500).json({ error: 'Failed to generate Dockerfile' });
    }
  }

  static async generateBash(req, res) {
    try {
      const bashScript = BashGenerator.generate(req.body);
      
      const generatedFile = await GeneratedFile.create({
        userId: req.user.id,
        type: 'bash',
        name: req.body.scriptName || 'script',
        content: bashScript,
        inputs: req.body,
        fileName: `${req.body.scriptName || 'script'}.sh`,
        description: req.body.description || 'Bash script',
        tags: ['bash', 'shell', 'script']
      });

      res.json({
        success: true,
        data: {
          id: generatedFile._id,
          content: bashScript,
          fileName: `${req.body.scriptName || 'script'}.sh`,
          type: 'bash'
        }
      });
    } catch (error) {
      console.error('Bash script generation error:', error);
      res.status(500).json({ error: 'Failed to generate Bash script' });
    }
  }

  static async generateShell(req, res) {
    try {
      const shellScript = ShellGenerator.generate(req.body);
      
      const generatedFile = await GeneratedFile.create({
        userId: req.user.id,
        type: 'shell',
        name: req.body.scriptName || 'script',
        content: shellScript,
        inputs: req.body,
        fileName: `${req.body.scriptName || 'script'}.sh`,
        description: req.body.description || 'Shell script',
        tags: ['shell', 'posix', 'script']
      });

      res.json({
        success: true,
        data: {
          id: generatedFile._id,
          content: shellScript,
          fileName: `${req.body.scriptName || 'script'}.sh`,
          type: 'shell'
        }
      });
    } catch (error) {
      console.error('Shell script generation error:', error);
      res.status(500).json({ error: 'Failed to generate Shell script' });
    }
  }

  static async generatePython(req, res) {
    try {
      const pythonScript = PythonGenerator.generate(req.body);
      
      const generatedFile = await GeneratedFile.create({
        userId: req.user.id,
        type: 'python',
        name: req.body.scriptName || 'script',
        content: pythonScript,
        inputs: req.body,
        fileName: `${req.body.scriptName || 'script'}.py`,
        description: req.body.description || 'Python script',
        tags: ['python', 'script', 'automation']
      });

      res.json({
        success: true,
        data: {
          id: generatedFile._id,
          content: pythonScript,
          fileName: `${req.body.scriptName || 'script'}.py`,
          type: 'python'
        }
      });
    } catch (error) {
      console.error('Python script generation error:', error);
      res.status(500).json({ error: 'Failed to generate Python script' });
    }
  }

  static async getTemplates(req, res) {
    try {
      const templates = {
        jenkins: {
          name: 'Jenkins Pipeline',
          description: 'Generate Jenkinsfile for CI/CD pipelines',
          fields: [
            { name: 'projectName', label: 'Project Name', type: 'text', required: true },
            { name: 'repositoryUrl', label: 'Repository URL', type: 'url', required: true },
            { name: 'branch', label: 'Branch', type: 'text', default: 'main' },
            { name: 'dockerImage', label: 'Docker Image', type: 'text' },
            { name: 'testCommand', label: 'Test Command', type: 'text' },
            { name: 'deployCommand', label: 'Deploy Command', type: 'text' }
          ]
        },
        'github-actions': {
          name: 'GitHub Actions',
          description: 'Generate GitHub Actions workflow',
          fields: [
            { name: 'projectName', label: 'Project Name', type: 'text', required: true },
            { name: 'repositoryUrl', label: 'Repository URL', type: 'url', required: true },
            { name: 'branch', label: 'Branch', type: 'text', default: 'main' },
            { name: 'nodeVersion', label: 'Node Version', type: 'text', default: '18' },
            { name: 'dockerImage', label: 'Docker Image', type: 'text' },
            { name: 'testCommand', label: 'Test Command', type: 'text', default: 'npm test' },
            { name: 'buildCommand', label: 'Build Command', type: 'text', default: 'npm run build' }
          ]
        },
        ansible: {
          name: 'Ansible Playbook',
          description: 'Generate Ansible playbooks',
          fields: [
            { name: 'playbookName', label: 'Playbook Name', type: 'text', required: true },
            { name: 'targetHosts', label: 'Target Hosts', type: 'array', required: true },
            { name: 'become', label: 'Become Privileged', type: 'checkbox', default: true },
            { name: 'tasks', label: 'Tasks', type: 'task-array', required: true }
          ]
        },
        kubernetes: {
          name: 'Kubernetes',
          description: 'Generate Kubernetes YAML files',
          fields: [
            { name: 'appName', label: 'Application Name', type: 'text', required: true },
            { name: 'dockerImage', label: 'Docker Image', type: 'text', required: true },
            { name: 'replicas', label: 'Replicas', type: 'number', default: 3 },
            { name: 'containerPort', label: 'Container Port', type: 'number', required: true },
            { name: 'serviceType', label: 'Service Type', type: 'select', options: ['ClusterIP', 'NodePort', 'LoadBalancer'], default: 'ClusterIP' },
            { name: 'servicePort', label: 'Service Port', type: 'number', default: 80 }
          ]
        },
        terraform: {
          name: 'Terraform',
          description: 'Generate Terraform configuration',
          fields: [
            { name: 'projectName', label: 'Project Name', type: 'text', required: true },
            { name: 'provider', label: 'Cloud Provider', type: 'select', options: ['aws', 'gcp', 'azure'], required: true },
            { name: 'region', label: 'Region', type: 'text', required: true },
            { name: 'resources', label: 'Resources', type: 'resource-array', required: true }
          ]
        },
        'gitlab-ci': GitLabCIGenerator.getTemplate(),
        'azure-devops': AzureDevOpsGenerator.getTemplate(),
        monitoring: MonitoringGenerator.getTemplate(),
        ssl: SSLGenerator.getTemplate(),
        dockerfile: DockerfileGenerator.getTemplate(),
        bash: BashGenerator.getTemplate(),
        shell: ShellGenerator.getTemplate(),
        python: PythonGenerator.getTemplate()
      };

      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ error: 'Failed to get templates' });
    }
  }
}

module.exports = GenerateController;
