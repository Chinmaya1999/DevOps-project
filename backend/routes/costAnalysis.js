const express = require('express');
const router = express.Router();
const AWSCostAnalysisService = require('../services/awsCostAnalysisService');
const { auth } = require('../middleware/auth');

// Get complete cost analysis
router.post('/analysis', auth, async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, region } = req.body;

    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({
        success: false,
        message: 'AWS credentials are required',
      });
    }

    const costService = new AWSCostAnalysisService(
      accessKeyId,
      secretAccessKey,
      region || 'us-east-1'
    );

    const analysis = await costService.getCompleteCostAnalysis();

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Cost analysis error:', error);
    
    // Handle specific AWS errors
    if (error.name === 'AccessDeniedException' || error.message?.includes('not enabled for cost explorer')) {
      return res.status(403).json({
        success: false,
        message: 'AWS Cost Explorer is not enabled for this account or user. Please enable Cost Explorer in AWS Billing Console and ensure your IAM user has the necessary permissions (ce:GetCostAndUsage, ce:GetDimensionValues, ce:GetCostForecast).',
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to perform cost analysis',
    });
  }
});

// Get monthly costs
router.post('/monthly', auth, async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, region, months } = req.body;

    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({
        success: false,
        message: 'AWS credentials are required',
      });
    }

    const costService = new AWSCostAnalysisService(
      accessKeyId,
      secretAccessKey,
      region || 'us-east-1'
    );

    const monthlyCosts = await costService.getMonthlyCosts(months || 6);

    res.json({
      success: true,
      data: monthlyCosts,
    });
  } catch (error) {
    console.error('Monthly costs error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch monthly costs',
    });
  }
});

// Get cost by service
router.post('/services', auth, async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, region } = req.body;

    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({
        success: false,
        message: 'AWS credentials are required',
      });
    }

    const costService = new AWSCostAnalysisService(
      accessKeyId,
      secretAccessKey,
      region || 'us-east-1'
    );

    const serviceCosts = await costService.getCostByService();

    res.json({
      success: true,
      data: serviceCosts,
    });
  } catch (error) {
    console.error('Service costs error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch service costs',
    });
  }
});

// Get cost by region
router.post('/regions', auth, async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, region } = req.body;

    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({
        success: false,
        message: 'AWS credentials are required',
      });
    }

    const costService = new AWSCostAnalysisService(
      accessKeyId,
      secretAccessKey,
      region || 'us-east-1'
    );

    const regionCosts = await costService.getCostByRegion();

    res.json({
      success: true,
      data: regionCosts,
    });
  } catch (error) {
    console.error('Region costs error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch region costs',
    });
  }
});

// Get cost forecast
router.post('/forecast', auth, async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, region, months } = req.body;

    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({
        success: false,
        message: 'AWS credentials are required',
      });
    }

    const costService = new AWSCostAnalysisService(
      accessKeyId,
      secretAccessKey,
      region || 'us-east-1'
    );

    const forecast = await costService.getCostForecast(months || 3);

    res.json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch cost forecast',
    });
  }
});

// Get recommendations
router.post('/recommendations', auth, async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, region } = req.body;

    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({
        success: false,
        message: 'AWS credentials are required',
      });
    }

    const costService = new AWSCostAnalysisService(
      accessKeyId,
      secretAccessKey,
      region || 'us-east-1'
    );

    const serviceCosts = await costService.getCostByService();
    const recommendations = costService.generateRecommendations({ serviceCosts });

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate recommendations',
    });
  }
});

module.exports = router;
