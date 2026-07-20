const express = require('express');
const router = express.Router();
const deploymentController = require('../controllers/deploymentController');
const { auth } = require('../middleware/auth');

// Test SSH connection before deployment
router.post('/test-connection', auth, deploymentController.testConnection);

// Deploy project to AWS EC2
router.post('/deploy', auth, deploymentController.deployProject);

// Get deployment status
router.get('/status/:deploymentId', auth, deploymentController.getDeploymentStatus);

module.exports = router;
