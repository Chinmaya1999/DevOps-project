const Deployment = require('../models/Deployment');
const awsDeploymentService = require('../services/awsDeploymentService');

// Get all deployments for the current user
exports.getUserDeployments = async (req, res) => {
  try {
    const deployments = await Deployment.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    for (const deployment of deployments) {
      try {
        if (!deployment.host || !deployment.username || !deployment.pemKey) continue;
        const remotePort = await awsDeploymentService.getContainerPort({
          host: deployment.host,
          username: deployment.username,
          pemKey: deployment.pemKey,
          projectName: deployment.projectName
        });

        if (remotePort && (!deployment.port || deployment.port !== remotePort)) {
          deployment.port = remotePort;
          await deployment.save();
        }
      } catch (portError) {
        console.warn('Failed to refresh deployment port:', portError.message);
      }
    }

    res.json({
      success: true,
      deployments
    });
  } catch (error) {
    console.error('Get deployments error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch deployments: ${error.message}`
    });
  }
};

// Get single deployment details
exports.getDeployment = async (req, res) => {
  try {
    const { deploymentId } = req.params;

    const deployment = await Deployment.findOne({
      _id: deploymentId,
      userId: req.user._id
    });

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found'
      });
    }

    res.json({
      success: true,
      deployment
    });
  } catch (error) {
    console.error('Get deployment error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch deployment: ${error.message}`
    });
  }
};

// Delete a deployment
exports.deleteDeployment = async (req, res) => {
  try {
    const { deploymentId } = req.params;

    const deployment = await Deployment.findOne({
      _id: deploymentId,
      userId: req.user._id
    });

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found'
      });
    }

    // Update status to deleting
    deployment.status = 'deleting';
    await deployment.save();

    // Attempt to delete from server
    try {
      const deleteResult = await awsDeploymentService.deleteDeployment({
        host: deployment.host,
        username: deployment.username,
        pemKey: deployment.pemKey,
        projectName: deployment.projectName
      });

      if (deleteResult.success) {
        await Deployment.findByIdAndDelete(deploymentId);
        return res.json({
          success: true,
          message: 'Deployment deleted successfully'
        });
      } else {
        deployment.status = 'failed';
        deployment.errorLogs.push({
          message: `Failed to delete from server: ${deleteResult.message}`,
          level: 'error'
        });
        await deployment.save();

        return res.status(500).json({
          success: false,
          message: `Failed to delete from server: ${deleteResult.message}`
        });
      }
    } catch (deleteError) {
      deployment.status = 'failed';
      deployment.errorLogs.push({
        message: `Delete operation failed: ${deleteError.message}`,
        level: 'error'
      });
      await deployment.save();

      return res.status(500).json({
        success: false,
        message: `Delete operation failed: ${deleteError.message}`
      });
    }
  } catch (error) {
    console.error('Delete deployment error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to delete deployment: ${error.message}`
    });
  }
};

// Stop a deployment
exports.stopDeployment = async (req, res) => {
  try {
    const { deploymentId } = req.params;

    const deployment = await Deployment.findOne({
      _id: deploymentId,
      userId: req.user._id
    });

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found'
      });
    }

    // Attempt to stop containers
    try {
      const stopResult = await awsDeploymentService.stopDeployment({
        host: deployment.host,
        username: deployment.username,
        pemKey: deployment.pemKey,
        projectName: deployment.projectName
      });

      if (stopResult.success) {
        deployment.status = 'stopped';
        deployment.isLive = false;
        deployment.deploymentLogs.push({
          message: 'Deployment stopped successfully',
          level: 'info'
        });
        await deployment.save();

        return res.json({
          success: true,
          message: 'Deployment stopped successfully'
        });
      } else {
        deployment.errorLogs.push({
          message: `Failed to stop deployment: ${stopResult.message}`,
          level: 'error'
        });
        await deployment.save();

        return res.status(500).json({
          success: false,
          message: `Failed to stop deployment: ${stopResult.message}`
        });
      }
    } catch (stopError) {
      deployment.errorLogs.push({
        message: `Stop operation failed: ${stopError.message}`,
        level: 'error'
      });
      await deployment.save();

      return res.status(500).json({
        success: false,
        message: `Stop operation failed: ${stopError.message}`
      });
    }
  } catch (error) {
    console.error('Stop deployment error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to stop deployment: ${error.message}`
    });
  }
};

// Restart a deployment
exports.restartDeployment = async (req, res) => {
  try {
    const { deploymentId } = req.params;

    const deployment = await Deployment.findOne({
      _id: deploymentId,
      userId: req.user._id
    });

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found'
      });
    }

    // Update status to deploying
    deployment.status = 'deploying';
    deployment.deploymentLogs.push({
      message: 'Restarting deployment...',
      level: 'info'
    });
    await deployment.save();

    // Attempt to restart containers
    try {
      const restartResult = await awsDeploymentService.restartDeployment({
        host: deployment.host,
        username: deployment.username,
        pemKey: deployment.pemKey,
        projectName: deployment.projectName
      });

      if (restartResult.success) {
        deployment.status = 'running';
        deployment.isLive = true;
        deployment.deploymentLogs.push({
          message: 'Deployment restarted successfully',
          level: 'info'
        });
        await deployment.save();

        return res.json({
          success: true,
          message: 'Deployment restarted successfully'
        });
      } else {
        deployment.status = 'failed';
        deployment.errorLogs.push({
          message: `Failed to restart deployment: ${restartResult.message}`,
          level: 'error'
        });
        await deployment.save();

        return res.status(500).json({
          success: false,
          message: `Failed to restart deployment: ${restartResult.message}`
        });
      }
    } catch (restartError) {
      deployment.status = 'failed';
      deployment.errorLogs.push({
        message: `Restart operation failed: ${restartError.message}`,
        level: 'error'
      });
      await deployment.save();

      return res.status(500).json({
        success: false,
        message: `Restart operation failed: ${restartError.message}`
      });
    }
  } catch (error) {
    console.error('Restart deployment error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to restart deployment: ${error.message}`
    });
  }
};

// Check deployment health
exports.checkDeploymentHealth = async (req, res) => {
  try {
    const { deploymentId } = req.params;

    const deployment = await Deployment.findOne({
      _id: deploymentId,
      userId: req.user._id
    });

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found'
      });
    }

    // Attempt to check health
    try {
      const healthResult = await awsDeploymentService.checkHealth({
        host: deployment.host,
        username: deployment.username,
        pemKey: deployment.pemKey,
        projectName: deployment.projectName,
        applicationUrl: deployment.applicationUrl
      });

      const observedPort = await awsDeploymentService.getContainerPort({
        host: deployment.host,
        username: deployment.username,
        pemKey: deployment.pemKey,
        projectName: deployment.projectName
      });

      deployment.lastHealthCheck = new Date();
      deployment.healthCheckStatus = healthResult.isHealthy ? 'healthy' : 'unhealthy';
      deployment.isLive = healthResult.isHealthy;
      if (observedPort) {
        deployment.port = observedPort;
      }

      if (!healthResult.isHealthy) {
        deployment.errorLogs.push({
          message: `Health check failed: ${healthResult.message}`,
          level: 'warning'
        });
      }

      await deployment.save();

      return res.json({
        success: true,
        health: {
          isHealthy: healthResult.isHealthy,
          status: deployment.healthCheckStatus,
          lastCheck: deployment.lastHealthCheck,
          message: healthResult.message
        }
      });
    } catch (healthError) {
      deployment.healthCheckStatus = 'unhealthy';
      deployment.isLive = false;
      deployment.errorLogs.push({
        message: `Health check error: ${healthError.message}`,
        level: 'error'
      });
      await deployment.save();

      return res.json({
        success: false,
        health: {
          isHealthy: false,
          status: 'unhealthy',
          lastCheck: deployment.lastHealthCheck,
          message: healthError.message
        }
      });
    }
  } catch (error) {
    console.error('Check health error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to check deployment health: ${error.message}`
    });
  }
};

// Get deployment logs
exports.getDeploymentLogs = async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const { limit = 50, level } = req.query;

    const deployment = await Deployment.findOne({
      _id: deploymentId,
      userId: req.user._id
    });

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found'
      });
    }

    let logs = deployment.deploymentLogs;

    if (level) {
      logs = logs.filter(log => log.level === level);
    }

    logs = logs.slice(-limit).reverse();

    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch logs: ${error.message}`
    });
  }
};

// Get deployment error logs
exports.getErrorLogs = async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const { limit = 50 } = req.query;

    const deployment = await Deployment.findOne({
      _id: deploymentId,
      userId: req.user._id
    });

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found'
      });
    }

    const errorLogs = deployment.errorLogs.slice(-limit).reverse();

    res.json({
      success: true,
      errorLogs
    });
  } catch (error) {
    console.error('Get error logs error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch error logs: ${error.message}`
    });
  }
};

exports.getComposeFile = async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const deployment = await Deployment.findOne({ _id: deploymentId, userId: req.user._id });

    if (!deployment) {
      return res.status(404).json({ success: false, message: 'Deployment not found' });
    }

    const remoteResult = await awsDeploymentService.connectToServer({ host: deployment.host, username: deployment.username, pemKey: deployment.pemKey });
    if (!remoteResult.success) {
      return res.status(400).json({ success: false, message: remoteResult.message });
    }

    try {
      const result = await awsDeploymentService.ssh.execCommand(`cat ~/${deployment.projectName}/docker-compose.yml`);
      const composeContent = result.stdout || result.stderr || '';
      return res.json({ success: true, composeFile: composeContent });
    } finally {
      await awsDeploymentService.disconnect();
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateComposeFile = async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const { composeFile } = req.body;

    const deployment = await Deployment.findOne({ _id: deploymentId, userId: req.user._id });
    if (!deployment) {
      return res.status(404).json({ success: false, message: 'Deployment not found' });
    }

    const updateResult = await awsDeploymentService.updateComposeFile({
      host: deployment.host,
      username: deployment.username,
      pemKey: deployment.pemKey,
      projectName: deployment.projectName
    }, composeFile || '');

    if (!updateResult.success) {
      return res.status(500).json({ success: false, message: updateResult.message });
    }

    deployment.deploymentLogs.push({ message: 'Compose file updated and containers refreshed', level: 'info' });
    deployment.lastHealthCheck = new Date();
    deployment.healthCheckStatus = 'unknown';
    await deployment.save();

    return res.json({ success: true, message: updateResult.message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
