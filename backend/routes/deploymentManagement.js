const express = require('express');
const router = express.Router();
const deploymentManagementController = require('../controllers/deploymentManagementController');
const { auth } = require('../middleware/auth');

// Get all deployments for current user
router.get('/', auth, deploymentManagementController.getUserDeployments);

// Fetch the remote compose file content
router.get('/:deploymentId/compose-file', auth, deploymentManagementController.getComposeFile);

// Update the remote compose file and refresh containers
router.post('/:deploymentId/compose-file', auth, deploymentManagementController.updateComposeFile);

// Get single deployment details
router.get('/:deploymentId', auth, deploymentManagementController.getDeployment);

// Delete a deployment
router.delete('/:deploymentId', auth, deploymentManagementController.deleteDeployment);

// Stop a deployment
router.post('/:deploymentId/stop', auth, deploymentManagementController.stopDeployment);

// Restart a deployment
router.post('/:deploymentId/restart', auth, deploymentManagementController.restartDeployment);

// Check deployment health
router.post('/:deploymentId/health', auth, deploymentManagementController.checkDeploymentHealth);

// Get deployment logs
router.get('/:deploymentId/logs', auth, deploymentManagementController.getDeploymentLogs);

// Get deployment error logs
router.get('/:deploymentId/error-logs', auth, deploymentManagementController.getErrorLogs);

module.exports = router;
