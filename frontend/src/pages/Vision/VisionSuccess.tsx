import React from 'react';
import { Card, Button, Result, Space, Typography, Tag, Divider, Row, Col, Statistic } from 'antd';
import { CheckCircleOutlined, RocketOutlined, CloudOutlined, LockOutlined, BarChartOutlined, GithubOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const VisionSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { applicationUrl, deploymentId } = location.state || {};

  const handleVisitApp = () => {
    if (applicationUrl) {
      window.open(applicationUrl, '_blank');
    }
  };

  const handleViewLogs = () => {
    navigate('/history');
  };

  const handleDownloadFiles = () => {
    // Implement file download logic
    console.log('Downloading generated files...');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Result
        icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 72 }} />}
        title="Deployment Successful!"
        subTitle="Your application has been deployed successfully with CI/CD, SSL, and monitoring configured."
        extra={[
          <Button type="primary" key="visit" icon={<RocketOutlined />} onClick={handleVisitApp} size="large">
            Visit Application
          </Button>,
          <Button key="logs" icon={<EyeOutlined />} onClick={handleViewLogs}>
            View Logs
          </Button>,
          <Button key="download" icon={<DownloadOutlined />} onClick={handleDownloadFiles}>
            Download Files
          </Button>,
        ]}
      />

      <Card title="Deployment Details" style={{ marginTop: 32 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Application URL"
              value={applicationUrl || 'N/A'}
              prefix={<CloudOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Deployment ID"
              value={deploymentId?.substring(0, 8) || 'N/A'}
              prefix={<RocketOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Status"
              value="Live"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Uptime"
              value="100%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
        </Row>
      </Card>

      <Card title="Configured Features" style={{ marginTop: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Title level={5}>Infrastructure</Title>
            <Space wrap>
              <Tag icon={<CloudOutlined />} color="blue">AWS ECS</Tag>
              <Tag icon={<CloudOutlined />} color="green">Auto Scaling</Tag>
              <Tag icon={<CloudOutlined />} color="purple">Load Balancer</Tag>
            </Space>
          </div>

          <Divider />

          <div>
            <Title level={5}>Security</Title>
            <Space wrap>
              <Tag icon={<LockOutlined />} color="green">SSL/HTTPS</Tag>
              <Tag icon={<LockOutlined />} color="blue">Security Groups</Tag>
              <Tag icon={<LockOutlined />} color="orange">VPC</Tag>
            </Space>
          </div>

          <Divider />

          <div>
            <Title level={5}>Monitoring & Logging</Title>
            <Space wrap>
              <Tag icon={<BarChartOutlined />} color="blue">Prometheus</Tag>
              <Tag icon={<BarChartOutlined />} color="green">Grafana</Tag>
              <Tag icon={<EyeOutlined />} color="orange">Log Aggregation</Tag>
            </Space>
          </div>

          <Divider />

          <div>
            <Title level={5}>CI/CD Pipeline</Title>
            <Space wrap>
              <Tag icon={<GithubOutlined />} color="blue">GitHub Actions</Tag>
              <Tag icon={<RocketOutlined />} color="green">Auto Deploy</Tag>
              <Tag icon={<CheckCircleOutlined />} color="purple">Health Checks</Tag>
            </Space>
          </div>
        </Space>
      </Card>

      <Card title="Generated DevOps Files" style={{ marginTop: 24 }}>
        <Space wrap>
          <Tag color="blue">Dockerfile</Tag>
          <Tag color="blue">docker-compose.yml</Tag>
          <Tag color="green">deployment.yaml</Tag>
          <Tag color="green">service.yaml</Tag>
          <Tag color="green">ingress.yaml</Tag>
          <Tag color="purple">main.tf</Tag>
          <Tag color="purple">variables.tf</Tag>
          <Tag color="orange">ci-cd.yml</Tag>
          <Tag color="orange">prometheus.yml</Tag>
          <Tag color="orange">nginx.conf</Tag>
        </Space>
        <div style={{ marginTop: 16 }}>
          <Button type="link" onClick={handleDownloadFiles}>
            Download all files <DownloadOutlined />
          </Button>
        </div>
      </Card>

      <Card title="Next Steps" style={{ marginTop: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>1. </Text>
            <Text>Visit your application at the URL above to verify it's working correctly.</Text>
          </div>
          <div>
            <Text strong>2. </Text>
            <Text>Configure your custom domain in the DNS settings.</Text>
          </div>
          <div>
            <Text strong>3. </Text>
            <Text>Set up monitoring alerts in Grafana dashboard.</Text>
          </div>
          <div>
            <Text strong>4. </Text>
            <Text>Review the generated DevOps files and customize as needed.</Text>
          </div>
          <div>
            <Text strong>5. </Text>
            <Text>Push changes to your repository to trigger automatic deployments.</Text>
          </div>
        </Space>
      </Card>

      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <Button onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default VisionSuccess;
