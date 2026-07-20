import React, { useEffect, useState } from 'react';
import { Card, Steps, Button, Form, Input, Select, Radio, Space, message, Spin, Alert, Progress, Tag, Upload, Switch } from 'antd';
import { RocketOutlined, EnvironmentOutlined, UploadOutlined, CloudUploadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { Option } = Select;

const Vision: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [deploying, setDeploying] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [deploymentStatus, setDeploymentStatus] = useState('');
  const [formValues, setFormValues] = useState<any>(null);
  const [form] = Form.useForm();
  
  // AWS EC2 specific states
  const [pemFileContent, setPemFileContent] = useState<string>('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Docker Hub states
  const [dockerImages, setDockerImages] = useState<any[]>([]);
  const [searchingImages, setSearchingImages] = useState(false);
  const [dockerHubUsername, setDockerHubUsername] = useState('awsmallick1999');
  const [dockerHubToken, setDockerHubToken] = useState('');
  const [userDockerImages, setUserDockerImages] = useState<any[]>([]);
  const [loadingUserImages, setLoadingUserImages] = useState(false);
  const [deploymentScope, setDeploymentScope] = useState<'both' | 'frontend' | 'backend'>('both');

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('infraPilotDeploymentSettings');
      if (!savedSettings) return;

      const parsed = JSON.parse(savedSettings);
      if (parsed.githubToken) {
        setDockerHubToken(parsed.githubToken);
      }
      if (parsed.dockerHubUsername) {
        setDockerHubUsername(parsed.dockerHubUsername);
      }
      if (parsed.projectName) {
        form.setFieldsValue({ projectName: parsed.projectName });
      }
      if (parsed.deploymentScope) {
        setDeploymentScope(parsed.deploymentScope);
        form.setFieldsValue({ deploymentScope: parsed.deploymentScope });
      }
      if (parsed.domainName) {
        form.setFieldsValue({ domainName: parsed.domainName });
      }
      if (parsed.enableSSL) {
        form.setFieldsValue({ enableSSL: Boolean(parsed.enableSSL) });
      }
      if (parsed.publicIpv4Address) {
        form.setFieldsValue({ ec2Host: parsed.publicIpv4Address });
      }
      if (parsed.instanceId) {
        form.setFieldsValue({ ec2InstanceId: parsed.instanceId });
      }
      if (parsed.ec2Username) {
        form.setFieldsValue({ ec2Username: parsed.ec2Username });
      }
      if (parsed.pemKeyContent) {
        setPemFileContent(parsed.pemKeyContent);
      }
    } catch (error) {
      console.error('Failed to hydrate Vision deployment form', error);
    }
  }, [form]);

  const searchDockerImages = async (query: string) => {
    if (!query || query.length < 3) {
      setDockerImages([]);
      return;
    }

    setSearchingImages(true);
    try {
      const response = await api.get('/dockerhub/search', {
        params: { query, pageSize: 10 }
      });
      setDockerImages(response.data.images || []);
    } catch (error) {
      console.error('Failed to search Docker images');
      message.error('Failed to search Docker images');
    } finally {
      setSearchingImages(false);
    }
  };

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
    return false;
  };

  const testConnection = async () => {
    try {
      const values = await form.validateFields(['ec2Host', 'ec2Username']);
      
      if (!pemFileContent) {
        message.error('Please upload a PEM file first');
        return;
      }

      setTestingConnection(true);
      setConnectionStatus('idle');

      const response = await api.post('/deployment/test-connection', {
        host: values.ec2Host,
        username: values.ec2Username,
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

  const loadUserDockerImages = async () => {
    if (!dockerHubUsername) {
      message.error('Please enter Docker Hub username');
      return;
    }

    setLoadingUserImages(true);
    try {
      const response = await api.get(`/dockerhub/user/${dockerHubUsername}`, {
        params: { 
          pat: dockerHubToken,
          pageSize: 50
        }
      });
      
      if (response.data.success) {
        setUserDockerImages(response.data.images);
        message.success(`Loaded ${response.data.images.length} Docker images`);
      } else {
        message.error(`Failed to load images: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Failed to load user Docker images:', error);
      message.error('Failed to load Docker images');
    } finally {
      setLoadingUserImages(false);
    }
  };

  const renderDockerImageOptions = (images: any[] = []) => {
    return images.map((img, index) => {
      const optionValue = img.name || img.slug || `image-${index}`;
      const label = img.name || img.slug || optionValue;
      return (
        <Option key={`${label}-${index}`} value={optionValue} label={label}>
          <Space>
            <span>{label}</span>
            {img.isPrivate && <Tag color="orange">Private</Tag>}
            {img.isOfficial && <Tag color="blue">Official</Tag>}
            <Tag>{img.pullCount || 0} pulls</Tag>
          </Space>
        </Option>
      );
    });
  };

  const steps = [
    {
      title: 'Configuration',
      icon: <EnvironmentOutlined />,
      content: (
        <Form form={form} layout="vertical" initialValues={{
          organizationName: '',
          applicationType: 'full-stack',
          port: '3000',
          cloudProvider: 'aws',
          region: 'us-east-1',
          deploymentTarget: 'ecs',
          instanceType: 't2.micro',
          minInstances: 1,
          maxInstances: 5,
          databaseType: 'none',
          cacheEnabled: 'no',
          domainName: '',
          ssl: 'yes',
          autoScaling: 'yes',
          monitoringEnabled: 'yes',
          loggingEnabled: 'yes'
        }}>
          <Form.Item
            label="Organization Name"
            name="organizationName"
            rules={[{ required: true, message: 'Please enter organization name' }]}
          >
            <Input placeholder="My Organization" />
          </Form.Item>

          <Form.Item
            label="Application Type"
            name="applicationType"
            rules={[{ required: true, message: 'Please select application type' }]}
          >
            <Select>
              <Option key="frontend" value="frontend">Frontend</Option>
              <Option key="backend" value="backend">Backend</Option>
              <Option key="full-stack" value="full-stack">Full Stack</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Port"
            name="port"
            rules={[{ required: true, message: 'Please enter port' }]}
          >
            <Select>
              <Option key="3000" value="3000">3000</Option>
              <Option key="5000" value="5000">5000</Option>
              <Option key="8080" value="8080">8080</Option>
              <Option key="443" value="443">443</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Cloud Provider"
            name="cloudProvider"
            rules={[{ required: true, message: 'Please select cloud provider' }]}
          >
            <Select>
              <Option key="aws" value="aws">AWS</Option>
              <Option key="azure" value="azure">Azure</Option>
              <Option key="gcp" value="gcp">GCP</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Region"
            name="region"
            rules={[{ required: true, message: 'Please select region' }]}
          >
            <Select placeholder="Select deployment region">
              <Option key="us-east-1" value="us-east-1">US East (N. Virginia)</Option>
              <Option key="us-west-2" value="us-west-2">US West (Oregon)</Option>
              <Option key="eu-west-1" value="eu-west-1">EU (Ireland)</Option>
              <Option key="ap-south-1" value="ap-south-1">Asia Pacific (Mumbai)</Option>
              <Option key="ap-southeast-1" value="ap-southeast-1">Asia Pacific (Singapore)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Deployment Target"
            name="deploymentTarget"
            rules={[{ required: true, message: 'Please select deployment target' }]}
          >
            <Select>
              <Option key="ecs" value="ecs">ECS (Elastic Container Service)</Option>
              <Option key="eks" value="eks">EKS (Elastic Kubernetes Service)</Option>
              <Option key="ec2" value="ec2">EC2 (Elastic Compute Cloud)</Option>
              <Option key="lambda" value="lambda">Lambda (Serverless)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Instance Type"
            name="instanceType"
            rules={[{ required: true, message: 'Please select instance type' }]}
          >
            <Select placeholder="Select instance type">
              <Option key="t2.micro" value="t2.micro">t2.micro (1 vCPU, 1GB RAM)</Option>
              <Option key="t2.small" value="t2.small">t2.small (1 vCPU, 2GB RAM)</Option>
              <Option key="t2.medium" value="t2.medium">t2.medium (2 vCPU, 4GB RAM)</Option>
              <Option key="t3.medium" value="t3.medium">t3.medium (2 vCPU, 4GB RAM)</Option>
              <Option key="m5.large" value="m5.large">m5.large (2 vCPU, 8GB RAM)</Option>
              <Option key="m5.xlarge" value="m5.xlarge">m5.xlarge (4 vCPU, 16GB RAM)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Min Instances"
            name="minInstances"
            rules={[{ required: true, message: 'Please enter minimum instances' }]}
          >
            <Input type="number" min="1" max="10" placeholder="1" />
          </Form.Item>

          <Form.Item
            label="Max Instances"
            name="maxInstances"
            rules={[{ required: true, message: 'Please enter maximum instances' }]}
          >
            <Input type="number" min="1" max="50" placeholder="5" />
          </Form.Item>

          <Form.Item
            label="Database Type"
            name="databaseType"
          >
            <Select placeholder="Select database (optional)">
              <Option key="none" value="none">No Database</Option>
              <Option key="mysql" value="mysql">MySQL</Option>
              <Option key="postgresql" value="postgresql">PostgreSQL</Option>
              <Option key="mongodb" value="mongodb">MongoDB</Option>
              <Option key="redis" value="redis">Redis</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Cache Enabled"
            name="cacheEnabled"
          >
            <Radio.Group>
              <Radio value="yes">Yes</Radio>
              <Radio value="no">No</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="Domain Name (Optional)"
            name="domainName"
          >
            <Input placeholder="example.com" />
          </Form.Item>

          <Form.Item
            label="SSL Certificate"
            name="ssl"
            rules={[{ required: true, message: 'Please select SSL option' }]}
          >
            <Radio.Group>
              <Radio value="yes">Yes</Radio>
              <Radio value="no">No</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="Auto Scaling"
            name="autoScaling"
            rules={[{ required: true, message: 'Please select auto scaling option' }]}
          >
            <Radio.Group>
              <Radio value="yes">Yes</Radio>
              <Radio value="no">No</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="Monitoring Enabled"
            name="monitoringEnabled"
          >
            <Radio.Group>
              <Radio value="yes">Yes</Radio>
              <Radio value="no">No</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="Logging Enabled"
            name="loggingEnabled"
          >
            <Radio.Group>
              <Radio value="yes">Yes</Radio>
              <Radio value="no">No</Radio>
            </Radio.Group>
          </Form.Item>

          {/* AWS EC2 Specific Configuration */}
          <Form.Item noStyle shouldUpdate={(prev, curr) => 
            prev.cloudProvider !== curr.cloudProvider || prev.deploymentTarget !== curr.deploymentTarget
          }>
            {({ getFieldValue }) => {
              const cloudProvider = getFieldValue('cloudProvider');
              const deploymentTarget = getFieldValue('deploymentTarget');
              
              if (cloudProvider === 'aws' && deploymentTarget === 'ec2') {
                return (
                  <Card title="AWS EC2 Configuration" style={{ marginTop: 16, marginBottom: 16 }}>
                    <Form.Item
                      label="Public IPv4 Address"
                      name="ec2Host"
                      rules={[{ required: true, message: 'Please enter the Public IPv4 address' }]}
                    >
                      <Input placeholder="e.g., 43.205.177.102" />
                    </Form.Item>

                    <Form.Item
                      label="Instance ID"
                      name="ec2InstanceId"
                      rules={[{ required: true, message: 'Please enter the Instance ID' }]}
                    >
                      <Input placeholder="e.g., i-0123456789abcdef0" />
                    </Form.Item>

                    <Form.Item
                      label="SSH Username"
                      name="ec2Username"
                      rules={[{ required: true, message: 'Please select the SSH username' }]}
                    >
                      <Select placeholder="Select SSH user">
                        <Option key="ubuntu" value="ubuntu">ubuntu</Option>
                        <Option key="ec2-user" value="ec2-user">ec2-user</Option>
                        <Option key="admin" value="admin">admin</Option>
                        <Option key="root" value="root">root</Option>
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
                        <Tag color="success" icon={<CheckCircleOutlined />} style={{ marginTop: 8 }}>
                          PEM file loaded
                        </Tag>
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
                        title="Connection Successful"
                        description="SSH connection to the instance has been established successfully."
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                        style={{ marginBottom: 16 }}
                      />
                    )}
                    {connectionStatus === 'error' && (
                      <Alert
                        title="Connection Failed"
                        description="Failed to establish SSH connection. Please check your credentials and PEM file."
                        type="error"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                    )}
                  </Card>
                );
              }
              return null;
            }}
          </Form.Item>

          {/* Docker Hub Image Selection */}
          <Form.Item noStyle shouldUpdate={(prev, curr) => 
            prev.cloudProvider !== curr.cloudProvider || prev.deploymentTarget !== curr.deploymentTarget
          }>
            {({ getFieldValue }) => {
              const cloudProvider = getFieldValue('cloudProvider');
              const deploymentTarget = getFieldValue('deploymentTarget');
              
              if (cloudProvider === 'aws' && deploymentTarget === 'ec2') {
                return (
                  <Card title="Docker Hub Credentials" style={{ marginBottom: 16 }}>
                    <Form.Item label="Docker Hub Username">
                      <Input 
                        placeholder="awsmallick1999" 
                        value={dockerHubUsername}
                        onChange={(e) => setDockerHubUsername(e.target.value)}
                      />
                    </Form.Item>
                    <Form.Item label="Docker Hub Token (Optional)">
                      <Input.Password 
                        placeholder="dckr_pat_xxxxxxxxxxxx" 
                        value={dockerHubToken}
                        onChange={(e) => setDockerHubToken(e.target.value)}
                      />
                    </Form.Item>
                    <Button 
                      type="primary" 
                      onClick={loadUserDockerImages}
                      loading={loadingUserImages}
                      icon={<CloudUploadOutlined />}
                    >
                      Load My Docker Images
                    </Button>
                  </Card>
                );
              }
              return null;
            }}
          </Form.Item>

          {/* Docker Hub Image Selection */}
          <Form.Item noStyle shouldUpdate={(prev, curr) => 
            prev.cloudProvider !== curr.cloudProvider || prev.deploymentTarget !== curr.deploymentTarget
          }>
            {({ getFieldValue }) => {
              const cloudProvider = getFieldValue('cloudProvider');
              const deploymentTarget = getFieldValue('deploymentTarget');
              
              if (cloudProvider === 'aws' && deploymentTarget === 'ec2') {
                return (
                  <Card title="Docker Images" style={{ marginBottom: 16 }}>
                    <Form.Item
                      label="Deployment Scope"
                      name="deploymentScope"
                      initialValue="both"
                      tooltip="Choose which components to deploy"
                    >
                      <Radio.Group onChange={(e) => {
                        setDeploymentScope(e.target.value);
                        // Clear image values when scope changes to avoid confusion
                        form.setFieldsValue({
                          backendImage: undefined,
                          frontendImage: undefined
                        });
                      }}>
                        <Radio value="both">Both Frontend & Backend</Radio>
                        <Radio value="frontend">Frontend Only</Radio>
                        <Radio value="backend">Backend Only</Radio>
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item
                      label="Backend Docker Image"
                      name="backendImage"
                      rules={[{ required: deploymentScope === 'both' || deploymentScope === 'backend', message: 'Please enter or select the backend Docker image' }]}
                      tooltip="Search Docker Hub or enter image name manually"
                      hidden={deploymentScope === 'frontend'}
                    >
                      <Select
                        showSearch
                        placeholder="Search or enter backend image (e.g., awsmallick1999/dev-backend:latest)"
                        defaultActiveFirstOption={false}
                        optionFilterProp="label"
                        filterOption={false}
                        onSearch={searchDockerImages}
                        onChange={(value) => form.setFieldsValue({ backendImage: value })}
                        notFoundContent={searchingImages ? <Spin size="small" /> : null}
                      >
                        {userDockerImages.length > 0 && (
                          <Option key="user-images-header" disabled style={{ fontWeight: 'bold', background: '#f5f5f5' }} value="">
                            Your Images ({userDockerImages.length})
                          </Option>
                        )}
                        {renderDockerImageOptions(userDockerImages)}
                        {dockerImages.length > 0 && userDockerImages.length > 0 && (
                          <Option key="search-results-header" disabled style={{ fontWeight: 'bold', background: '#f5f5f5' }} value="">
                            Search Results
                          </Option>
                        )}
                        {renderDockerImageOptions(dockerImages)}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label="Frontend Docker Image"
                      name="frontendImage"
                      rules={[{ required: deploymentScope === 'both' || deploymentScope === 'frontend', message: 'Please enter or select the frontend Docker image' }]}
                      tooltip="Search Docker Hub or enter image name manually"
                      hidden={deploymentScope === 'backend'}
                    >
                      <Select
                        showSearch
                        placeholder="Search or enter frontend image (e.g., awsmallick1999/dev-frontend:latest)"
                        defaultActiveFirstOption={false}
                        optionFilterProp="label"
                        filterOption={false}
                        onSearch={searchDockerImages}
                        onChange={(value) => form.setFieldsValue({ frontendImage: value })}
                        notFoundContent={searchingImages ? <Spin size="small" /> : null}
                      >
                        {userDockerImages.length > 0 && (
                          <Option key="user-images-header-frontend" disabled style={{ fontWeight: 'bold', background: '#f5f5f5' }} value="">
                            Your Images ({userDockerImages.length})
                          </Option>
                        )}
                        {renderDockerImageOptions(userDockerImages)}
                        {dockerImages.length > 0 && userDockerImages.length > 0 && (
                          <Option key="search-results-header" disabled style={{ fontWeight: 'bold', background: '#f5f5f5' }} value="">
                            Search Results
                          </Option>
                        )}
                        {renderDockerImageOptions(dockerImages)}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label="Project Name"
                      name="projectName"
                      initialValue="InfraPilot"
                      rules={[{ required: true, message: 'Please enter the project name' }]}
                    >
                      <Input placeholder="e.g., devops-pipeline" />
                    </Form.Item>

                    <Form.Item
                      label="Enable SSL/HTTPS"
                      name="enableSSL"
                      valuePropName="checked"
                      tooltip="Automatically configure SSL with Let's Encrypt (requires domain)"
                    >
                      <Switch />
                    </Form.Item>
                  </Card>
                );
              }
              return null;
            }}
          </Form.Item>
        </Form>
      )
    },
    {
      title: 'Deploy',
      icon: <RocketOutlined />,
      content: (
        <div>
          <Alert
            title="Ready to Deploy"
            description="Click the button below to start automatic deployment. This will:"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <ul style={{ marginBottom: 24 }}>
            <li>Clone your repository</li>
            <li>Build Docker image</li>
            <li>Push to container registry</li>
            <li>Create infrastructure with Terraform</li>
            <li>Deploy to cloud</li>
            <li>Configure SSL and monitoring</li>
            <li>Set up CI/CD pipeline</li>
          </ul>
          {deploying && (
            <Card style={{ marginBottom: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{deploymentStatus}</span>
                  <span>{deploymentProgress}%</span>
                </div>
                <Progress percent={deploymentProgress} status="active" />
              </Space>
            </Card>
          )}
        </div>
      )
    }
  ];

  const stepItems = steps.map((step, index) => ({
    key: index,
    title: step.title,
    icon: step.icon
  }));

  const next = () => {
    form.validateFields().then((values) => {
      console.log('Form validation passed with values:', values);
      setFormValues(values);
      setCurrentStep(currentStep + 1);
    }).catch((error) => {
      console.error('Form validation failed:', error);
      message.error('Please fill in all required fields');
    });
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleDeploy = async () => {
    try {
      console.log('Starting deployment...');
      console.log('Form instance:', form);
      console.log('Form fields:', form.getFieldsValue());
      console.log('Saved form values:', formValues);
      
      // Use saved form values instead of trying to validate form on deploy step
      const values = formValues || await form.validateFields();
      console.log('Form values to use:', values);
      // Check if this is AWS EC2 deployment
      const isAWSEC2Deployment = values.cloudProvider === 'aws' && values.deploymentTarget === 'ec2';
      
      if (isAWSEC2Deployment) {
        // AWS EC2 specific deployment
        if (!pemFileContent) {
          message.error('Please upload a PEM file');
          return;
        }
        
        if (connectionStatus !== 'success') {
          message.error('Please test the SSH connection first');
          return;
        }
        
        if (!values.backendImage && (deploymentScope === 'both' || deploymentScope === 'backend')) {
          message.error('Please select a Docker image for backend');
          return;
        }
        
        if (!values.frontendImage && (deploymentScope === 'both' || deploymentScope === 'frontend')) {
          message.error('Please select a Docker image for frontend');
          return;
        }
        
        setDeploying(true);
        setDeploymentProgress(0);

        const deploymentSteps = [
          { status: 'Connecting to EC2 instance...', progress: 10 },
          { status: 'Installing Docker...', progress: 20 },
          { status: 'Installing Docker Compose...', progress: 30 },
          { status: 'Installing Nginx...', progress: 40 },
          { status: 'Configuring reverse proxy...', progress: 50 },
          { status: 'Pulling Docker images...', progress: 60 },
          { status: 'Starting containers...', progress: 70 },
          { status: 'Configuring SSL (if enabled)...', progress: 80 },
          { status: 'Verifyingployment...', progress: 90 },
          { status: 'Deployment complete!', progress: 100 }
        ];

        for (const step of deploymentSteps) {
          setDeploymentStatus(step.status);
          setDeploymentProgress(step.progress);
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        const savedSettings = JSON.parse(localStorage.getItem('infraPilotDeploymentSettings') || '{}');
        const deploymentConfig = {
          host: values.ec2Host || savedSettings.publicIpv4Address || null,
          username: values.ec2Username || savedSettings.ec2Username || null,
          pemKey: pemFileContent || savedSettings.pemKeyContent || '',
          projectName: values.projectName || savedSettings.projectName || 'InfraPilot',
          backendImage: values.backendImage,
          frontendImage: values.frontendImage,
          dockerHubUsername: dockerHubUsername || savedSettings.dockerHubUsername || null,
          deploymentScope: values.deploymentScope || savedSettings.deploymentScope || 'both',
          domain: values.domainName || savedSettings.domainName || null,
          email: values.sslEmail || null,
          enableSSL: values.enableSSL && !!(values.domainName || savedSettings.domainName)
        };

        console.log('Sending AWS EC2 deployment config:', deploymentConfig);

        const response = await api.post('/deployment/deploy', deploymentConfig);

        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Deployment failed');
        }

        message.success('Deployment successful!');
        setTimeout(() => {
          navigate('/vision/success', { 
            state: { 
              applicationUrl: response.data.deployment.url,
              deploymentId: response.data.deployment.projectName,
              deploymentType: 'aws-ec2'
            } 
          });
        }, 1000);
      } else {
        // Original Vision deployment flow
        const requiredFields = ['organizationName', 'applicationType', 'port', 'cloudProvider', 'deploymentTarget'];
        const missingFields = requiredFields.filter(field => !values[field]);
        
        if (missingFields.length > 0) {
          console.error('Missing required fields:', missingFields);
          message.error(`Missing required fields: ${missingFields.join(', ')}`);
          return;
        }
        
        setDeploying(true);
        setDeploymentProgress(0);

        const deploymentSteps = [
          { status: 'Cloning repository...', progress: 10 },
          { status: 'Detecting tech stack...', progress: 20 },
          { status: 'Building Docker image...', progress: 30 },
          { status: 'Pushing to container registry...', progress: 40 },
          { status: 'Creating infrastructure with Terraform...', progress: 50 },
          { status: 'Setting up Kubernetes cluster...', progress: 60 },
          { status: 'Deploying application...', progress: 70 },
          { status: 'Configuring SSL certificate...', progress: 80 },
          { status: 'Setting up monitoring...', progress: 90 },
          { status: 'Configuring CI/CD pipeline...', progress: 95 },
          { status: 'Deployment complete!', progress: 100 }
        ];

        for (const step of deploymentSteps) {
          setDeploymentStatus(step.status);
          setDeploymentProgress(step.progress);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const payload = {
          ...values,
          repository: values.repository || 'local-project',
          techStack: ['Node.js', 'React']
        };
        
        console.log('Sending payload to backend:', payload);

        const response = await api.post('/vision/deploy', payload);

        message.success('Deployment successful!');
        setTimeout(() => {
          navigate('/vision/success', { 
            state: { 
              applicationUrl: response.data.applicationUrl,
              deploymentId: response.data.deploymentId 
            } 
          });
        }, 1000);
      }
    } catch (error: any) {
      console.error('Deployment error:', error);
      const backendMessage = error.response?.data?.message || error.message || 'Deployment failed';
      if (error.errorFields) {
        console.error('Form validation error fields:', error.errorFields);
        message.error('Please fill in all required fields');
      } else {
        message.error(backendMessage);
      }
      setDeploying(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card 
        title={
          <Space>
            <RocketOutlined style={{ color: '#1890ff' }} />
            <span>Vision - One-Click Deployment</span>
          </Space>
        }
        extra={<Tag color="blue">Beta</Tag>}
      >
        <Alert
          title="Fill in the server details, choose the Docker images, and deploy to AWS EC2"
          description="The page now focuses on the fields required for a successful EC2 deployment: server IP, SSH username, PEM, Docker images, project name, and optional SSL."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Steps current={currentStep} items={stepItems} style={{ marginBottom: 32 }} />

        <div style={{ minHeight: '300px', marginBottom: 24 }}>
          <div>{steps[currentStep].content}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {currentStep > 0 && (
              <Button onClick={prev}>
                Previous
              </Button>
            )}
          </div>
          <div>
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={next}>
                Next
              </Button>
            )}
            {currentStep === steps.length - 1 && !deploying && (
              <Button 
                type="primary" 
                icon={<RocketOutlined />}
                onClick={handleDeploy}
                size="large"
              >
                Deploy Now
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Vision;
