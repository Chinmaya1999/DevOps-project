import React, { useState } from 'react';
import { Card, Form, Input, Button, Select, Switch, Upload, message, Alert, Space, Typography, Divider } from 'antd';
import { UploadOutlined, CloudUploadOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

interface DeploymentConfig {
  host: string;
  instanceId: string;
  username: string;
  pemKey: string;
  projectName: string;
  backendImage: string;
  frontendImage: string;
  domain: string;
  email: string;
  enableSSL: boolean;
}

const AWSDeployment: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const [pemFileContent, setPemFileContent] = useState<string>('');

  const handlePemFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setPemFileContent(content);
      message.success('PEM file loaded successfully');
    };
    reader.onerror = () => {
      message.error('Failed to read PEM file');
    };
    reader.readAsText(file);
    return false; // Prevent automatic upload
  };

  const testConnection = async () => {
    try {
      const values = await form.validateFields(['host', 'username']);
      
      if (!pemFileContent) {
        message.error('Please upload a PEM file first');
        return;
      }

      setTestingConnection(true);
      setConnectionStatus('idle');

      const response = await api.post('/deployment/test-connection', {
        host: values.host,
        username: values.username,
        pemKey: pemFileContent
      });

      if (response.data.success) {
        setConnectionStatus('success');
        message.success('SSH connection successful!');
      } else {
        setConnectionStatus('error');
        message.error(`Connection failed: ${response.data.message}`);
      }
    } catch (error: any) {
      setConnectionStatus('error');
      message.error(`Connection test failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleDeploy = async (values: DeploymentConfig) => {
    if (!pemFileContent) {
      message.error('Please upload a PEM file first');
      return;
    }

    if (connectionStatus !== 'success') {
      message.error('Please test the connection first');
      return;
    }

    setLoading(true);
    setDeploymentResult(null);

    try {
      const deploymentConfig = {
        ...values,
        pemKey: pemFileContent,
        enableSSL: values.enableSSL && !!values.domain
      };

      const response = await api.post('/deployment/deploy', deploymentConfig);

      if (response.data.success) {
        setDeploymentResult(response.data.deployment);
        message.success('Deployment completed successfully!');
      } else {
        message.error(`Deployment failed: ${response.data.message}`);
      }
    } catch (error: any) {
      message.error(`Deployment failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>AWS EC2 Deployment</Title>
      <Text type="secondary">Deploy your project to AWS EC2 instance with automatic configuration</Text>

      <Divider />

      <Card title="Deployment Configuration" style={{ marginBottom: '24px' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleDeploy}
          initialValues={{
            username: 'ubuntu',
            projectName: 'devops-pipeline',
            backendImage: 'awsmallick1999/dev-backend:latest',
            frontendImage: 'awsmallick1999/dev-frontend:latest',
            enableSSL: false
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* AWS Instance Configuration */}
            <Card type="inner" title="AWS Instance Details">
              <Form.Item
                label="Public IPv4 Address"
                name="host"
                rules={[{ required: true, message: 'Please enter the Public IPv4 address' }]}
              >
                <Input placeholder="e.g., 43.205.177.102" />
              </Form.Item>

              <Form.Item
                label="Instance ID"
                name="instanceId"
                rules={[{ required: true, message: 'Please enter the Instance ID' }]}
              >
                <Input placeholder="e.g., i-0123456789abcdef0" />
              </Form.Item>

              <Form.Item
                label="SSH Username"
                name="username"
                rules={[{ required: true, message: 'Please select the SSH username' }]}
              >
                <Select placeholder="Select SSH user">
                  <Option value="ubuntu">ubuntu</Option>
                  <Option value="ec2-user">ec2-user</Option>
                  <Option value="admin">admin</Option>
                  <Option value="root">root</Option>
                </Select>
              </Form.Item>

              <Form.Item label="PEM Key File" required>
                <Upload
                  accept=".pem,.key"
                  beforeUpload={handlePemFileUpload}
                  showUploadList={false}
                >
                  <Button icon={<UploadOutlined />}>Select PEM File</Button>
                </Upload>
                {pemFileContent && (
                  <Text type="success" style={{ marginTop: '8px', display: 'block' }}>
                    <CheckCircleOutlined /> PEM file loaded
                  </Text>
                )}
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  onClick={testConnection}
                  loading={testingConnection}
                  icon={<CloudUploadOutlined />}
                >
                  Test SSH Connection
                </Button>
              </Form.Item>

              {connectionStatus === 'success' && (
                <Alert
                  message="Connection Successful"
                  description="SSH connection to the instance has been established successfully."
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                />
              )}
              {connectionStatus === 'error' && (
                <Alert
                  message="Connection Failed"
                  description="Failed to establish SSH connection. Please check your credentials and PEM file."
                  type="error"
                  showIcon
                />
              )}
            </Card>

            {/* Project Configuration */}
            <Card type="inner" title="Project Configuration">
              <Form.Item
                label="Project Name"
                name="projectName"
                rules={[{ required: true, message: 'Please enter the project name' }]}
              >
                <Input placeholder="e.g., devops-pipeline" />
              </Form.Item>

              <Form.Item
                label="Backend Docker Image"
                name="backendImage"
                rules={[{ required: true, message: 'Please enter the backend Docker image' }]}
              >
                <Input placeholder="e.g., awsmallick1999/dev-backend:latest" />
              </Form.Item>

              <Form.Item
                label="Frontend Docker Image"
                name="frontendImage"
                rules={[{ required: true, message: 'Please enter the frontend Docker image' }]}
              >
                <Input placeholder="e.g., awsmallick1999/dev-frontend:latest" />
              </Form.Item>
            </Card>

            {/* Domain & SSL Configuration */}
            <Card type="inner" title="Domain & SSL (Optional)">
              <Form.Item
                label="Domain Name"
                name="domain"
                tooltip="Optional: Enter your domain name for HTTPS setup"
              >
                <Input placeholder="e.g., example.com" />
              </Form.Item>

              <Form.Item
                label="Email for SSL Certificate"
                name="email"
                tooltip="Required for SSL certificate registration"
              >
                <Input placeholder="e.g., admin@example.com" />
              </Form.Item>

              <Form.Item
                label="Enable SSL/HTTPS"
                name="enableSSL"
                valuePropName="checked"
                tooltip="Automatically configure SSL with Let's Encrypt"
              >
                <Switch />
              </Form.Item>
            </Card>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              icon={loading ? <LoadingOutlined /> : <CloudUploadOutlined />}
              disabled={connectionStatus !== 'success'}
              block
            >
              {loading ? 'Deploying...' : 'Deploy to AWS EC2'}
            </Button>
          </Space>
        </Form>
      </Card>

      {/* Deployment Result */}
      {deploymentResult && (
        <Card
          title="Deployment Successful!"
          style={{ marginTop: '24px' }}
          extra={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: '24px' }} />}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>Application URL:</Text>
              <br />
              <a href={deploymentResult.url} target="_blank" rel="noopener noreferrer">
                {deploymentResult.url}
              </a>
            </div>

            {deploymentResult.domain && (
              <div>
                <Text strong>Domain:</Text>
                <br />
                <Text>{deploymentResult.domain}</Text>
              </div>
            )}

            <div>
              <Text strong>Host:</Text>
              <br />
              <Text>{deploymentResult.host}</Text>
            </div>

            <div>
              <Text strong>Project Name:</Text>
              <br />
              <Text>{deploymentResult.projectName}</Text>
            </div>

            <div>
              <Text strong>Deployed At:</Text>
              <br />
              <Text>{new Date(deploymentResult.timestamp).toLocaleString()}</Text>
            </div>

            <Alert
              message="Your application is now live!"
              description="The deployment process has completed successfully. Your application is accessible via the URL above."
              type="success"
              showIcon
            />
          </Space>
        </Card>
      )}
    </div>
  );
};

export default AWSDeployment;
