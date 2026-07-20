const awsDeploymentService = require('../services/awsDeploymentService');
const Joi = require('joi');
const Deployment = require('../models/Deployment');

// Validation schema for deployment configuration
const deploymentSchema = Joi.object({
  host: Joi.string().ip().required(),
  username: Joi.string().required(),
  pemKey: Joi.string().required(),
  projectName: Joi.string().required(),
  deploymentScope: Joi.string().valid('both', 'frontend', 'backend').default('both'),
  backendImage: Joi.string().when('deploymentScope', {
    is: Joi.string().valid('both', 'backend'),
    then: Joi.string().required(),
    otherwise: Joi.string().optional()
  }),
  frontendImage: Joi.string().when('deploymentScope', {
    is: Joi.string().valid('both', 'frontend'),
    then: Joi.string().required(),
    otherwise: Joi.string().optional()
  }),
  dockerHubUsername: Joi.string().allow('', null).optional(),
  dockerHubToken: Joi.string().allow('', null).optional(),
  domain: Joi.string().allow('', null).optional(),
  email: Joi.string().email().allow('', null).optional(),
  enableSSL: Joi.boolean().default(false)
});

// Test SSH connection
exports.testConnection = async (req, res) => {
  try {
    const { host, username, pemKey } = req.body;

    if (!host || !username || !pemKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: host, username, pemKey'
      });
    }

    const result = await awsDeploymentService.testConnection({ host, username, pemKey });

    res.json(result);
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      message: `Connection test failed: ${error.message}`
    });
  }
};

// Deploy project to AWS EC2
exports.deployProject = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = deploymentSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: `Validation error: ${error.details[0].message}`
      });
    }

    const deploymentConfig = {
      ...value,
      domain: value.domain || null,
      email: value.email || null
    };

    console.log('Starting deployment with config:', {
      host: deploymentConfig.host,
      username: deploymentConfig.username,
      projectName: deploymentConfig.projectName,
      backendImage: deploymentConfig.backendImage,
      frontendImage: deploymentConfig.frontendImage,
      domain: deploymentConfig.domain,
      enableSSL: deploymentConfig.enableSSL
    });

    // Create deployment record
    const deployment = new Deployment({
      userId: req.user._id,
      projectName: deploymentConfig.projectName,
      deploymentType: 'aws-ec2',
      deploymentScope: deploymentConfig.deploymentScope || 'both',
      cloudProvider: 'aws',
      region: 'unknown',
      host: deploymentConfig.host,
      username: deploymentConfig.username,
      pemKey: deploymentConfig.pemKey,
      domain: deploymentConfig.domain,
      backendImage: deploymentConfig.backendImage,
      frontendImage: deploymentConfig.frontendImage,
      dockerHubUsername: deploymentConfig.dockerHubUsername || null,
      status: 'deploying',
      isLive: false
    });

    await deployment.save();

    // Start deployment
    const result = await awsDeploymentService.deployProject(deploymentConfig);

    if (result.success) {
      deployment.status = 'running';
      deployment.isLive = true;
      deployment.applicationUrl = result.url;
      deployment.port = result.port || null;
      deployment.deploymentLogs.push({
        message: 'Deployment completed successfully',
        level: 'info'
      });
      await deployment.save();

      res.json({
        success: true,
        message: result.message,
        deployment: {
          url: result.url,
          domain: result.domain,
          host: result.host,
          projectName: deploymentConfig.projectName,
          deploymentId: deployment._id,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      deployment.status = 'failed';
      deployment.errorLogs.push({
        message: result.message,
        level: 'error'
      });
      await deployment.save();

      res.status(500).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Deployment error:', error);
    res.status(500).json({
      success: false,
      message: `Deployment failed: ${error.message}`
    });
  }
};

// Get deployment status (placeholder for future implementation)
exports.getDeploymentStatus = async (req, res) => {
  try {
    const { deploymentId } = req.params;

    // This would typically check the status of a running deployment
    // For now, return a placeholder response
    res.json({
      success: true,
      status: 'completed',
      message: 'Deployment status check not yet implemented'
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: `Status check failed: ${error.message}`
    });
  }
};
