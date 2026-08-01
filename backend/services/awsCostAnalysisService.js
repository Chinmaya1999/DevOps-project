const { CostExplorerClient, GetCostAndUsageCommand, GetDimensionValuesCommand } = require('@aws-sdk/client-cost-explorer');
const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');

class AWSCostAnalysisService {
  constructor(accessKeyId, secretAccessKey, region = 'us-east-1') {
    this.costExplorer = new CostExplorerClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.cloudWatch = new CloudWatchClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async getMonthlyCosts(months = 6) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const params = {
        TimePeriod: {
          Start: startDate.toISOString().split('T')[0],
          End: endDate.toISOString().split('T')[0],
        },
        Granularity: 'MONTHLY',
        Metrics: ['BlendedCost', 'UnblendedCost', 'AmortizedCost'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE',
          },
        ],
      };

      const command = new GetCostAndUsageCommand(params);
      const response = await this.costExplorer.send(command);

      return this.formatCostData(response.ResultsByTime);
    } catch (error) {
      console.error('Error fetching monthly costs:', error);
      throw new Error('Failed to fetch AWS cost data');
    }
  }

  async getDailyCosts(days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const params = {
        TimePeriod: {
          Start: startDate.toISOString().split('T')[0],
          End: endDate.toISOString().split('T')[0],
        },
        Granularity: 'DAILY',
        Metrics: ['BlendedCost', 'UnblendedCost'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE',
          },
        ],
      };

      const command = new GetCostAndUsageCommand(params);
      const response = await this.costExplorer.send(command);

      return this.formatCostData(response.ResultsByTime);
    } catch (error) {
      console.error('Error fetching daily costs:', error);
      throw new Error('Failed to fetch daily cost data');
    }
  }

  async getCostByService() {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const params = {
        TimePeriod: {
          Start: startDate.toISOString().split('T')[0],
          End: endDate.toISOString().split('T')[0],
        },
        Granularity: 'MONTHLY',
        Metrics: ['BlendedCost'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE',
          },
        ],
      };

      const command = new GetCostAndUsageCommand(params);
      const response = await this.costExplorer.send(command);

      return this.formatServiceCostData(response.ResultsByTime);
    } catch (error) {
      console.error('Error fetching cost by service:', error);
      throw new Error('Failed to fetch cost by service');
    }
  }

  async getCostByRegion() {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const params = {
        TimePeriod: {
          Start: startDate.toISOString().split('T')[0],
          End: endDate.toISOString().split('T')[0],
        },
        Granularity: 'MONTHLY',
        Metrics: ['BlendedCost'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'REGION',
          },
        ],
      };

      const command = new GetCostAndUsageCommand(params);
      const response = await this.costExplorer.send(command);

      return this.formatRegionCostData(response.ResultsByTime);
    } catch (error) {
      console.error('Error fetching cost by region:', error);
      throw new Error('Failed to fetch cost by region');
    }
  }

  async getCostForecast(months = 3) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      const forecastEnd = new Date();
      forecastEnd.setMonth(forecastEnd.getMonth() + months);

      const params = {
        TimePeriod: {
          Start: startDate.toISOString().split('T')[0],
          End: forecastEnd.toISOString().split('T')[0],
        },
        Granularity: 'MONTHLY',
        Metrics: ['BlendedCost'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE',
          },
        ],
      };

      const command = new GetCostAndUsageCommand(params);
      const response = await this.costExplorer.send(command);

      return this.formatForecastData(response.ResultsByTime, months);
    } catch (error) {
      console.error('Error fetching cost forecast:', error);
      throw new Error('Failed to fetch cost forecast');
    }
  }

  async getResourceUtilization() {
    try {
      // This would typically require CloudWatch metrics for specific resources
      // For now, we'll return a mock structure
      return {
        cpuUtilization: [],
        memoryUtilization: [],
        storageUtilization: [],
      };
    } catch (error) {
      console.error('Error fetching resource utilization:', error);
      throw new Error('Failed to fetch resource utilization');
    }
  }

  generateRecommendations(costData) {
    const recommendations = [];

    // Analyze service costs
    if (costData.serviceCosts) {
      costData.serviceCosts.forEach(service => {
        // High EC2 costs recommendation
        if (service.serviceName === 'Amazon EC2' && service.amount > 100) {
          recommendations.push({
            type: 'EC2_OPTIMIZATION',
            priority: 'HIGH',
            title: 'Optimize EC2 Instances',
            description: 'Your EC2 costs are high. Consider using Reserved Instances or Savings Plans for predictable workloads.',
            potentialSavings: `$${(service.amount * 0.3).toFixed(2)}`,
            action: 'Review instance types and purchase Reserved Instances',
          });
        }

        // High RDS costs recommendation
        if (service.serviceName === 'Amazon RDS' && service.amount > 50) {
          recommendations.push({
            type: 'RDS_OPTIMIZATION',
            priority: 'MEDIUM',
            title: 'Optimize RDS Instances',
            description: 'Consider using Multi-AZ deployments only for production and right-sizing instance types.',
            potentialSavings: `$${(service.amount * 0.2).toFixed(2)}`,
            action: 'Review RDS instance types and deployment options',
          });
        }

        // High S3 costs recommendation
        if (service.serviceName === 'Amazon S3' && service.amount > 30) {
          recommendations.push({
            type: 'S3_OPTIMIZATION',
            priority: 'MEDIUM',
            title: 'Optimize S3 Storage',
            description: 'Implement lifecycle policies to move old data to cheaper storage tiers.',
            potentialSavings: `$${(service.amount * 0.4).toFixed(2)}`,
            action: 'Set up S3 lifecycle policies',
          });
        }

        // High Data Transfer costs
        if (service.serviceName === 'AWS Data Transfer' && service.amount > 20) {
          recommendations.push({
            type: 'DATA_TRANSFER',
            priority: 'LOW',
            title: 'Reduce Data Transfer Costs',
            description: 'Use CloudFront or VPC endpoints to reduce data transfer costs.',
            potentialSavings: `$${(service.amount * 0.25).toFixed(2)}`,
            action: 'Implement CloudFront or VPC endpoints',
          });
        }
      });
    }

    // General recommendations
    recommendations.push({
      type: 'GENERAL',
      priority: 'MEDIUM',
      title: 'Enable Cost Anomaly Detection',
      description: 'Set up AWS Cost Anomaly Detection to receive alerts about unusual spending patterns.',
      potentialSavings: 'Variable',
      action: 'Enable Cost Anomaly Detection in AWS Billing Console',
    });

    recommendations.push({
      type: 'GENERAL',
      priority: 'HIGH',
      title: 'Review Unused Resources',
      description: 'Identify and terminate unused EC2 instances, EBS volumes, and load balancers.',
      potentialSavings: 'Variable',
      action: 'Use AWS Trusted Advisor to find unused resources',
    });

    recommendations.push({
      type: 'GENERAL',
      priority: 'MEDIUM',
      title: 'Implement Budgets and Alerts',
      description: 'Set up AWS budgets to receive notifications when spending exceeds thresholds.',
      potentialSavings: 'Prevent overspending',
      action: 'Configure AWS Budgets in Billing Console',
    });

    return recommendations;
  }

  formatCostData(results) {
    return results.map(result => ({
      timePeriod: result.TimePeriod,
      total: parseFloat(result.Total.BlendedCost.Amount),
      currency: result.Total.BlendedCost.Unit,
      groups: result.Groups ? result.Groups.map(group => ({
        key: group.Keys[0],
        amount: parseFloat(group.Metrics.BlendedCost.Amount),
        currency: group.Metrics.BlendedCost.Unit,
      })) : [],
    }));
  }

  formatServiceCostData(results) {
    const serviceCosts = [];
    results.forEach(result => {
      if (result.Groups) {
        result.Groups.forEach(group => {
          const existingService = serviceCosts.find(s => s.serviceName === group.Keys[0]);
          if (existingService) {
            existingService.amount += parseFloat(group.Metrics.BlendedCost.Amount);
          } else {
            serviceCosts.push({
              serviceName: group.Keys[0],
              amount: parseFloat(group.Metrics.BlendedCost.Amount),
              currency: group.Metrics.BlendedCost.Unit,
            });
          }
        });
      }
    });
    return serviceCosts.sort((a, b) => b.amount - a.amount);
  }

  formatRegionCostData(results) {
    const regionCosts = [];
    results.forEach(result => {
      if (result.Groups) {
        result.Groups.forEach(group => {
          const existingRegion = regionCosts.find(r => r.regionName === group.Keys[0]);
          if (existingRegion) {
            existingRegion.amount += parseFloat(group.Metrics.BlendedCost.Amount);
          } else {
            regionCosts.push({
              regionName: group.Keys[0],
              amount: parseFloat(group.Metrics.BlendedCost.Amount),
              currency: group.Metrics.BlendedCost.Unit,
            });
          }
        });
      }
    });
    return regionCosts.sort((a, b) => b.amount - a.amount);
  }

  formatForecastData(results, forecastMonths) {
    const historical = [];
    const forecast = [];
    const currentDate = new Date();
    
    results.forEach((result, index) => {
      const resultDate = new Date(result.TimePeriod.Start);
      const data = {
        date: result.TimePeriod.Start,
        amount: parseFloat(result.Total.BlendedCost.Amount),
        currency: result.Total.BlendedCost.Unit,
      };

      if (resultDate <= currentDate) {
        historical.push(data);
      } else {
        forecast.push(data);
      }
    });

    return {
      historical,
      forecast,
      totalForecast: forecast.reduce((sum, item) => sum + item.amount, 0),
    };
  }

  async getCompleteCostAnalysis() {
    try {
      const results = await Promise.allSettled([
        this.getMonthlyCosts(6),
        this.getCostByService(),
        this.getCostByRegion(),
        this.getCostForecast(3),
      ]);

      // Check if all requests failed with AccessDeniedException
      const allAccessDenied = results.every(result => {
        if (result.status !== 'rejected') return false;
        // Check error constructor name and message
        const isAccessDenied = 
          result.reason.constructor?.name === 'AccessDeniedException' ||
          result.reason.name === 'AccessDeniedException' ||
          result.reason.message?.includes('not enabled for cost explorer') ||
          (result.reason.$fault === 'client' && result.reason.__type === 'AccessDeniedException');
        return isAccessDenied;
      });

      if (allAccessDenied) {
        console.log('All AWS Cost Explorer requests failed with AccessDenied - returning demo data');
        return this.getDemoData();
      }

      // Extract successful results or use empty arrays
      const monthlyCosts = results[0].status === 'fulfilled' ? results[0].value : [];
      const serviceCosts = results[1].status === 'fulfilled' ? results[1].value : [];
      const regionCosts = results[2].status === 'fulfilled' ? results[2].value : [];
      const forecast = results[3].status === 'fulfilled' ? results[3].value : { historical: [], forecast: [], totalForecast: 0 };

      const recommendations = this.generateRecommendations({ serviceCosts });

      return {
        monthlyCosts,
        serviceCosts,
        regionCosts,
        forecast,
        recommendations,
        summary: {
          totalMonthlyCost: serviceCosts.reduce((sum, service) => sum + service.amount, 0),
          topService: serviceCosts[0] || null,
          topRegion: regionCosts[0] || null,
          projectedSavings: recommendations
            .filter(r => r.potentialSavings !== 'Variable' && r.potentialSavings !== 'Prevent overspending')
            .reduce((sum, r) => sum + parseFloat(r.potentialSavings.replace('$', '')), 0),
        },
      };
    } catch (error) {
      console.error('Error in complete cost analysis:', error);
      throw error;
    }
  }

  getDemoData() {
    const demoServiceCosts = [
      { serviceName: 'Amazon EC2', amount: 1250.50, currency: 'USD' },
      { serviceName: 'Amazon RDS', amount: 450.25, currency: 'USD' },
      { serviceName: 'Amazon S3', amount: 180.75, currency: 'USD' },
      { serviceName: 'AWS Lambda', amount: 95.30, currency: 'USD' },
      { serviceName: 'Amazon CloudFront', amount: 65.20, currency: 'USD' },
      { serviceName: 'AWS Data Transfer', amount: 45.10, currency: 'USD' },
    ];

    const demoRegionCosts = [
      { regionName: 'us-east-1', amount: 890.40, currency: 'USD' },
      { regionName: 'ap-south-1', amount: 520.30, currency: 'USD' },
      { regionName: 'eu-west-1', amount: 380.25, currency: 'USD' },
      { regionName: 'us-west-2', amount: 290.15, currency: 'USD' },
    ];

    const demoMonthlyCosts = [
      { timePeriod: { Start: '2026-02-01', End: '2026-03-01' }, total: 1850.00, currency: 'USD', groups: [] },
      { timePeriod: { Start: '2026-03-01', End: '2026-04-01' }, total: 1920.50, currency: 'USD', groups: [] },
      { timePeriod: { Start: '2026-04-01', End: '2026-05-01' }, total: 1780.25, currency: 'USD', groups: [] },
      { timePeriod: { Start: '2026-05-01', End: '2026-06-01' }, total: 2100.75, currency: 'USD', groups: [] },
      { timePeriod: { Start: '2026-06-01', End: '2026-07-01' }, total: 2050.30, currency: 'USD', groups: [] },
      { timePeriod: { Start: '2026-07-01', End: '2026-08-01' }, total: 2085.60, currency: 'USD', groups: [] },
    ];

    const demoForecast = {
      historical: [
        { date: '2026-05-01', amount: 2100.75, currency: 'USD' },
        { date: '2026-06-01', amount: 2050.30, currency: 'USD' },
        { date: '2026-07-01', amount: 2085.60, currency: 'USD' },
      ],
      forecast: [
        { date: '2026-08-01', amount: 2150.00, currency: 'USD' },
        { date: '2026-09-01', amount: 2200.00, currency: 'USD' },
        { date: '2026-10-01', amount: 2250.00, currency: 'USD' },
      ],
      totalForecast: 6600.00,
    };

    const recommendations = this.generateRecommendations({ serviceCosts: demoServiceCosts });

    return {
      monthlyCosts: demoMonthlyCosts,
      serviceCosts: demoServiceCosts,
      regionCosts: demoRegionCosts,
      forecast: demoForecast,
      recommendations,
      summary: {
        totalMonthlyCost: demoServiceCosts.reduce((sum, service) => sum + service.amount, 0),
        topService: demoServiceCosts[0],
        topRegion: demoRegionCosts[0],
        projectedSavings: recommendations
          .filter(r => r.potentialSavings !== 'Variable' && r.potentialSavings !== 'Prevent overspending')
          .reduce((sum, r) => sum + parseFloat(r.potentialSavings.replace('$', '')), 0),
      },
      isDemo: true,
    };
  }
}

module.exports = AWSCostAnalysisService;
