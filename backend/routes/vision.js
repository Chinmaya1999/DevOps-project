const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const visionService = require('../services/visionService');

// Deploy application using Vision
router.post('/deploy', auth, async (req, res) => {
  try {
    const {
      organizationName,
      repository,
      applicationType,
      port,
      cloudProvider,
      deploymentTarget,
      domainName,
      ssl,
      autoScaling,
      techStack,
      region,
      instanceType,
      minInstances,
      maxInstances,
      databaseType,
      cacheEnabled,
      monitoringEnabled,
      loggingEnabled
    } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!organizationName) missingFields.push('organizationName');
    if (!repository) missingFields.push('repository');
    if (!applicationType) missingFields.push('applicationType');
    if (!port) missingFields.push('port');
    if (!cloudProvider) missingFields.push('cloudProvider');
    if (!deploymentTarget) missingFields.push('deploymentTarget');

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields,
        receivedFields: Object.keys(req.body)
      });
    }

    // Start deployment process
    const deployment = await visionService.deploy({
      organizationName,
      repository,
      applicationType,
      port,
      cloudProvider,
      deploymentTarget,
      domainName,
      ssl,
      autoScaling,
      techStack,
      region,
      instanceType,
      minInstances,
      maxInstances,
      databaseType,
      cacheEnabled,
      monitoringEnabled,
      loggingEnabled,
      userId: req.user._id
    });

    res.json({
      message: 'Deployment initiated successfully',
      deploymentId: deployment.deploymentId,
      applicationUrl: deployment.applicationUrl,
      status: deployment.status
    });
  } catch (error) {
    console.error('Error in Vision deployment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get deployment status
router.get('/status/:deploymentId', auth, async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const status = await visionService.getDeploymentStatus(deploymentId);
    res.json(status);
  } catch (error) {
    console.error('Error fetching deployment status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get deployment history for user
router.get('/history', auth, async (req, res) => {
  try {
    const history = await visionService.getDeploymentHistory(req.user._id);
    res.json(history);
  } catch (error) {
    console.error('Error fetching deployment history:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
