const test = require('node:test');
const assert = require('node:assert/strict');
const Deployment = require('../models/Deployment');

test('deployment can be created before an application URL is known', () => {
  const deployment = new Deployment({
    userId: '507f1f77bcf86cd799439011',
    projectName: 'tmp-deployment',
    deploymentType: 'aws-ec2',
    deploymentScope: 'both',
    cloudProvider: 'aws',
    region: 'us-east-1',
    host: '1.2.3.4',
    domain: null,
    backendImage: 'example/backend:latest',
    frontendImage: 'example/frontend:latest',
    status: 'deploying',
    isLive: false
  });

  const validationError = deployment.validateSync();
  assert.equal(validationError, undefined);
  assert.equal(deployment.applicationUrl, null);
});
