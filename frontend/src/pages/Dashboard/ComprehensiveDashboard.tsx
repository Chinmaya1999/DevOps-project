import React, { useState } from 'react';
import { 
  Layout, 
  Menu, 
  Card, 
  Statistic, 
  Row, 
  Col, 
  Table, 
  Tag, 
  Button, 
  Progress, 
  Timeline,
  Avatar,
  List,
  Badge,
  Dropdown,
  Space,
  Divider
} from 'antd';
import {
  DashboardOutlined,
  CloudOutlined,
  CodeOutlined,
  CloudServerOutlined,
  ContainerOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  BarChartOutlined,
  DollarOutlined,
  UserOutlined,
  SettingOutlined,
  GithubOutlined,
  GitlabOutlined,
  AmazonOutlined,
  PlusOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

interface DashboardProps {}

const ComprehensiveDashboard: React.FC<DashboardProps> = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('overview');

  const menuItems = [
    {
      key: 'overview',
      icon: <DashboardOutlined />,
      label: 'Overview',
    },
    {
      key: 'projects',
      icon: <CloudOutlined />,
      label: 'Projects',
    },
    {
      key: 'deployments',
      icon: <CodeOutlined />,
      label: 'Deployments',
    },
    {
      key: 'pipelines',
      icon: <GitlabOutlined />,
      label: 'Pipelines',
    },
    {
      key: 'infrastructure',
      icon: <CloudServerOutlined />,
      label: 'Infrastructure',
    },
    {
      key: 'containers',
      icon: <ContainerOutlined />,
      label: 'Containers',
    },
    {
      key: 'kubernetes',
      icon: <AppstoreOutlined />,
      label: 'Kubernetes',
    },
    {
      key: 'logs',
      icon: <FileTextOutlined />,
      label: 'Logs',
    },
    {
      key: 'monitoring',
      icon: <BarChartOutlined />,
      label: 'Monitoring',
    },
    {
      key: 'billing',
      icon: <DollarOutlined />,
      label: 'Billing',
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: 'Users',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  const projects = [
    {
      key: '1',
      name: 'E-Commerce Platform',
      status: 'active',
      framework: 'React + Node.js',
      lastDeploy: '2 hours ago',
      pipeline: 'GitHub Actions',
      health: 'healthy',
      cpu: 45,
      memory: 60,
    },
    {
      key: '2',
      name: 'API Gateway',
      status: 'active',
      framework: 'Express.js',
      lastDeploy: '1 day ago',
      pipeline: 'Jenkins',
      health: 'healthy',
      cpu: 30,
      memory: 45,
    },
    {
      key: '3',
      name: 'Analytics Service',
      status: 'warning',
      framework: 'Python + FastAPI',
      lastDeploy: '3 days ago',
      pipeline: 'GitLab CI',
      health: 'degraded',
      cpu: 85,
      memory: 90,
    },
  ];

  const deployments = [
    {
      key: '1',
      project: 'E-Commerce Platform',
      environment: 'Production',
      status: 'success',
      duration: '5m 32s',
      timestamp: '2024-01-15 14:30',
      commit: 'abc123',
    },
    {
      key: '2',
      project: 'API Gateway',
      environment: 'Staging',
      status: 'running',
      duration: '3m 15s',
      timestamp: '2024-01-15 13:45',
      commit: 'def456',
    },
    {
      key: '3',
      project: 'Analytics Service',
      environment: 'Development',
      status: 'failed',
      duration: '2m 45s',
      timestamp: '2024-01-15 12:00',
      commit: 'ghi789',
    },
  ];

  const infrastructure = [
    {
      key: '1',
      name: 'Production VPC',
      type: 'VPC',
      provider: 'AWS',
      status: 'active',
      resources: 12,
      cost: '$450/month',
    },
    {
      key: '2',
      name: 'EKS Cluster',
      type: 'Kubernetes',
      provider: 'AWS',
      status: 'active',
      resources: 8,
      cost: '$320/month',
    },
    {
      key: '3',
      name: 'RDS Database',
      type: 'Database',
      provider: 'AWS',
      status: 'active',
      resources: 3,
      cost: '$180/month',
    },
  ];

  const renderContent = () => {
    switch (selectedMenu) {
      case 'overview':
        return renderOverview();
      case 'projects':
        return renderProjects();
      case 'deployments':
        return renderDeployments();
      case 'pipelines':
        return renderPipelines();
      case 'infrastructure':
        return renderInfrastructure();
      case 'containers':
        return renderContainers();
      case 'kubernetes':
        return renderKubernetes();
      case 'logs':
        return renderLogs();
      case 'monitoring':
        return renderMonitoring();
      case 'billing':
        return renderBilling();
      case 'users':
        return renderUsers();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Projects"
              value={12}
              prefix={<CloudOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Deployments"
              value={8}
              prefix={<CodeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Running Containers"
              value={45}
              prefix={<ContainerOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Monthly Cost"
              value={1250}
              prefix="$"
              suffix="/month"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Recent Deployments" extra={<Button type="link">View All</Button>}>
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <div>
                      <p>E-Commerce Platform deployed to Production</p>
                      <p style={{ color: '#999', fontSize: '12px' }}>2 hours ago</p>
                    </div>
                  ),
                },
                {
                  color: 'blue',
                  children: (
                    <div>
                      <p>API Gateway deployed to Staging</p>
                      <p style={{ color: '#999', fontSize: '12px' }}>5 hours ago</p>
                    </div>
                  ),
                },
                {
                  color: 'red',
                  children: (
                    <div>
                      <p>Analytics Service deployment failed</p>
                      <p style={{ color: '#999', fontSize: '12px' }}>1 day ago</p>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="System Health" extra={<Button type="link">Details</Button>}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>CPU Usage</span>
                  <span>45%</span>
                </div>
                <Progress percent={45} status="active" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Memory Usage</span>
                  <span>60%</span>
                </div>
                <Progress percent={60} status="active" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Disk Usage</span>
                  <span>35%</span>
                </div>
                <Progress percent={35} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Network</span>
                  <span>25%</span>
                </div>
                <Progress percent={25} />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Project Overview" extra={<Button type="primary" icon={<PlusOutlined />}>Add Project</Button>}>
            <Table
              dataSource={projects}
              columns={[
                {
                  title: 'Project Name',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => (
                    <Tag color={status === 'active' ? 'green' : status === 'warning' ? 'orange' : 'red'}>
                      {status}
                    </Tag>
                  ),
                },
                {
                  title: 'Framework',
                  dataIndex: 'framework',
                  key: 'framework',
                },
                {
                  title: 'Pipeline',
                  dataIndex: 'pipeline',
                  key: 'pipeline',
                  render: (pipeline: string) => {
                    const icon = pipeline === 'GitHub Actions' ? <GithubOutlined /> : 
                                 pipeline === 'Jenkins' ? <CodeOutlined /> : <GitlabOutlined />;
                    return <Space>{icon} {pipeline}</Space>;
                  },
                },
                {
                  title: 'Health',
                  dataIndex: 'health',
                  key: 'health',
                  render: (health: string) => (
                    <Tag icon={health === 'healthy' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />} 
                        color={health === 'healthy' ? 'success' : 'warning'}>
                      {health}
                    </Tag>
                  ),
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: () => (
                    <Dropdown menu={{ items: [{ key: '1', label: 'View Details' }, { key: '2', label: 'Deploy' }, { key: '3', label: 'Settings' }] }}>
                      <Button icon={<MoreOutlined />} />
                    </Dropdown>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderProjects = () => (
    <Card title="Projects" extra={<Button type="primary" icon={<PlusOutlined />}>Add Project</Button>}>
      <Table
        dataSource={projects}
        columns={[
          { title: 'Project Name', dataIndex: 'name', key: 'name' },
          { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'active' ? 'green' : 'orange'}>{status}</Tag> },
          { title: 'Framework', dataIndex: 'framework', key: 'framework' },
          { title: 'Last Deploy', dataIndex: 'lastDeploy', key: 'lastDeploy' },
          { title: 'Pipeline', dataIndex: 'pipeline', key: 'pipeline' },
          { title: 'Actions', key: 'actions', render: () => <Button icon={<MoreOutlined />} /> },
        ]}
      />
    </Card>
  );

  const renderDeployments = () => (
    <Card title="Deployments" extra={<Button type="primary" icon={<PlusOutlined />}>New Deployment</Button>}>
      <Table
        dataSource={deployments}
        columns={[
          { title: 'Project', dataIndex: 'project', key: 'project' },
          { title: 'Environment', dataIndex: 'environment', key: 'environment', render: (env: string) => <Tag color={env === 'Production' ? 'red' : env === 'Staging' ? 'blue' : 'green'}>{env}</Tag> },
          { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag icon={status === 'success' ? <CheckCircleOutlined /> : status === 'running' ? <ClockCircleOutlined /> : <ExclamationCircleOutlined />} color={status === 'success' ? 'success' : status === 'running' ? 'processing' : 'error'}>{status}</Tag> },
          { title: 'Duration', dataIndex: 'duration', key: 'duration' },
          { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp' },
          { title: 'Commit', dataIndex: 'commit', key: 'commit' },
          { title: 'Actions', key: 'actions', render: () => <Button icon={<MoreOutlined />} /> },
        ]}
      />
    </Card>
  );

  const renderPipelines = () => (
    <Card title="CI/CD Pipelines" extra={<Button type="primary" icon={<PlusOutlined />}>Create Pipeline</Button>}>
      <Row gutter={[16, 16]}>
        {[
          { name: 'GitHub Actions', icon: <GithubOutlined />, count: 8, color: '#24292e' },
          { name: 'GitLab CI', icon: <GitlabOutlined />, count: 4, color: '#FC6D26' },
          { name: 'Jenkins', icon: <CodeOutlined />, count: 3, color: '#D33833' },
          { name: 'Azure DevOps', icon: <AzureOutlined />, count: 2, color: '#0078D7' },
        ].map((pipeline) => (
          <Col xs={24} sm={12} md={6} key={pipeline.name}>
            <Card
              hoverable
              style={{ textAlign: 'center', borderColor: pipeline.color }}
            >
              <Avatar size={64} icon={pipeline.icon} style={{ backgroundColor: pipeline.color, marginBottom: 16 }} />
              <h3>{pipeline.name}</h3>
              <p>{pipeline.count} active pipelines</p>
              <Button type="primary" style={{ backgroundColor: pipeline.color, borderColor: pipeline.color }}>
                Configure
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );

  const renderInfrastructure = () => (
    <Card title="Infrastructure" extra={<Button type="primary" icon={<PlusOutlined />}>Provision Resource</Button>}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card title="AWS" extra={<AmazonOutlined style={{ fontSize: 24, color: '#FF9900' }} />}>
            <Statistic title="Resources" value={23} />
            <Statistic title="Monthly Cost" value="$850" prefix="$" style={{ marginTop: 16 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Azure" extra={<AzureOutlined style={{ fontSize: 24, color: '#0078D7' }} />}>
            <Statistic title="Resources" value={12} />
            <Statistic title="Monthly Cost" value="$320" prefix="$" style={{ marginTop: 16 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="GCP" extra={<span style={{ fontSize: 24, color: '#4285F4' }}><GoogleOutlined /></span>}>
            <Statistic title="Resources" value={8} />
            <Statistic title="Monthly Cost" value="$80" prefix="$" style={{ marginTop: 16 }} />
          </Card>
        </Col>
      </Row>
      <Divider />
      <Table
        dataSource={infrastructure}
        columns={[
          { title: 'Name', dataIndex: 'name', key: 'name' },
          { title: 'Type', dataIndex: 'type', key: 'type' },
          { title: 'Provider', dataIndex: 'provider', key: 'provider' },
          { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color="green">{status}</Tag> },
          { title: 'Resources', dataIndex: 'resources', key: 'resources' },
          { title: 'Cost', dataIndex: 'cost', key: 'cost' },
          { title: 'Actions', key: 'actions', render: () => <Button icon={<MoreOutlined />} /> },
        ]}
      />
    </Card>
  );

  const renderContainers = () => (
    <Card title="Containers" extra={<Button type="primary" icon={<PlusOutlined />}>Deploy Container</Button>}>
      <Row gutter={[16, 16]}>
        {[
          { name: 'nginx-web', image: 'nginx:latest', status: 'running', cpu: 15, memory: 30 },
          { name: 'redis-cache', image: 'redis:7-alpine', status: 'running', cpu: 5, memory: 20 },
          { name: 'postgres-db', image: 'postgres:15', status: 'running', cpu: 25, memory: 45 },
          { name: 'app-backend', image: 'node:18-alpine', status: 'stopped', cpu: 0, memory: 0 },
        ].map((container) => (
          <Col xs={24} sm={12} md={6} key={container.name}>
            <Card
              title={container.name}
              extra={<Badge status={container.status === 'running' ? 'processing' : 'default'} text={container.status} />}
            >
              <p><strong>Image:</strong> {container.image}</p>
              <p><strong>CPU:</strong> {container.cpu}%</p>
              <p><strong>Memory:</strong> {container.memory}%</p>
              <Button type="primary" size="small" style={{ marginTop: 8 }}>
                Manage
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );

  const renderKubernetes = () => (
    <Card title="Kubernetes Clusters" extra={<Button type="primary" icon={<PlusOutlined />}>Add Cluster</Button>}>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Production Cluster" extra={<Tag color="green">Healthy</Tag>}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="Nodes" value={6} />
              </Col>
              <Col span={12}>
                <Statistic title="Pods" value={45} />
              </Col>
              <Col span={12}>
                <Statistic title="Namespaces" value={8} />
              </Col>
              <Col span={12}>
                <Statistic title="Services" value={12} />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Staging Cluster" extra={<Tag color="orange">Warning</Tag>}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="Nodes" value={3} />
              </Col>
              <Col span={12}>
                <Statistic title="Pods" value={18} />
              </Col>
              <Col span={12}>
                <Statistic title="Namespaces" value={4} />
              </Col>
              <Col span={12}>
                <Statistic title="Services" value={6} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Card>
  );

  const renderLogs = () => (
    <Card title="Log Viewer" extra={<Button type="primary">Export Logs</Button>}>
      <div style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 4, fontFamily: 'monospace', height: 400, overflowY: 'auto' }}>
        <div>[2024-01-15 14:30:25] INFO: Starting application server...</div>
        <div>[2024-01-15 14:30:26] INFO: Database connection established</div>
        <div>[2024-01-15 14:30:27] INFO: Redis cache connected</div>
        <div>[2024-01-15 14:30:28] INFO: Loading configuration...</div>
        <div>[2024-01-15 14:30:29] WARNING: High memory usage detected (85%)</div>
        <div>[2024-01-15 14:30:30] INFO: Server started on port 3000</div>
        <div>[2024-01-15 14:30:31] INFO: Health check passed</div>
        <div>[2024-01-15 14:30:32] ERROR: Failed to connect to external API</div>
        <div>[2024-01-15 14:30:33] INFO: Retrying connection...</div>
        <div>[2024-01-15 14:30:34] INFO: Connection successful</div>
      </div>
      <Space style={{ marginTop: 16 }}>
        <Button>Filter</Button>
        <Button>Search</Button>
        <Button>Live Tail</Button>
      </Space>
    </Card>
  );

  const renderMonitoring = () => (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Prometheus Metrics">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Statistic title="Request Rate" value={1250} suffix="/sec" />
              <Statistic title="Error Rate" value={0.02} suffix="%" valueStyle={{ color: '#cf1322' }} />
              <Statistic title="Latency (P95)" value={45} suffix="ms" />
              <Statistic title="Uptime" value={99.9} suffix="%" valueStyle={{ color: '#3f8600' }} />
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Alert Status">
            <List
              itemLayout="horizontal"
              dataSource={[
                { title: 'High CPU Usage', status: 'critical', time: '5 min ago' },
                { title: 'Memory Warning', status: 'warning', time: '15 min ago' },
                { title: 'Disk Space Low', status: 'info', time: '1 hour ago' },
              ]}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Badge status={item.status === 'critical' ? 'error' : item.status === 'warning' ? 'warning' : 'processing'} />}
                    title={item.title}
                    description={item.time}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Grafana Dashboards" extra={<Button type="primary">Open Grafana</Button>}>
            <Row gutter={[16, 16]}>
              {['Application Performance', 'Infrastructure Health', 'Business Metrics', 'Security Overview'].map((dashboard) => (
                <Col xs={24} sm={12} md={6} key={dashboard}>
                  <Card hoverable size="small">
                    <h4>{dashboard}</h4>
                    <Button type="link">View Dashboard</Button>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderBilling = () => (
    <Card title="Billing & Cost Management">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Current Month" value={1250} prefix="$" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Last Month" value={1180} prefix="$" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Forecast" value={1350} prefix="$" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Budget" value={2000} prefix="$" valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
      </Row>
      <Divider />
      <Table
        dataSource={[
          { key: '1', service: 'AWS EC2', cost: 450, trend: '+5%' },
          { key: '2', service: 'AWS RDS', cost: 180, trend: '+2%' },
          { key: '3', service: 'AWS S3', cost: 120, trend: '-3%' },
          { key: '4', service: 'Azure App Service', cost: 320, trend: '+8%' },
          { key: '5', service: 'GCP Compute', cost: 80, trend: '+1%' },
        ]}
        columns={[
          { title: 'Service', dataIndex: 'service', key: 'service' },
          { title: 'Cost', dataIndex: 'cost', key: 'cost', render: (cost: number) => `$${cost}` },
          { title: 'Trend', dataIndex: 'trend', key: 'trend', render: (trend: string) => <span style={{ color: trend.startsWith('+') ? '#cf1322' : '#3f8600' }}>{trend}</span> },
        ]}
      />
    </Card>
  );

  const renderUsers = () => (
    <Card title="User Management" extra={<Button type="primary" icon={<PlusOutlined />}>Add User</Button>}>
      <Table
        dataSource={[
          { key: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
          { key: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Developer', status: 'active' },
          { key: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'Viewer', status: 'inactive' },
        ]}
        columns={[
          { title: 'Name', dataIndex: 'name', key: 'name' },
          { title: 'Email', dataIndex: 'email', key: 'email' },
          { title: 'Role', dataIndex: 'role', key: 'role' },
          { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag> },
          { title: 'Actions', key: 'actions', render: () => <Button icon={<MoreOutlined />} /> },
        ]}
      />
    </Card>
  );

  const renderSettings = () => (
    <Card title="Settings">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card title="General Settings" size="small">
          <Space direction="vertical">
            <div>
              <label>Organization Name</label>
              <input type="text" defaultValue="My Organization" style={{ marginLeft: 16 }} />
            </div>
            <div>
              <label>Timezone</label>
              <select style={{ marginLeft: 16 }}>
                <option>UTC</option>
                <option>America/New_York</option>
                <option>Europe/London</option>
              </select>
            </div>
          </Space>
        </Card>
        <Card title="Notification Settings" size="small">
          <Space direction="vertical">
            <div>
              <label>Email Notifications</label>
              <input type="checkbox" defaultChecked />
            </div>
            <div>
              <label>Slack Integration</label>
              <input type="checkbox" defaultChecked />
            </div>
            <div>
              <label>Alert Threshold</label>
              <select style={{ marginLeft: 16 }}>
                <option>Critical Only</option>
                <option>Warning and Critical</option>
                <option>All Alerts</option>
              </select>
            </div>
          </Space>
        </Card>
        <Card title="Security Settings" size="small">
          <Space direction="vertical">
            <div>
              <label>Two-Factor Authentication</label>
              <input type="checkbox" />
            </div>
            <div>
              <label>API Key Rotation</label>
              <select style={{ marginLeft: 16 }}>
                <option>30 days</option>
                <option>60 days</option>
                <option>90 days</option>
              </select>
            </div>
          </Space>
        </Card>
        <Button type="primary">Save Settings</Button>
      </Space>
    </Card>
  );

  const AzureOutlined = ({ style }: { style?: React.CSSProperties }) => <span style={{ color: '#0078D7', fontSize: 24, ...style }}>A</span>;
  const GoogleOutlined = () => <span style={{ color: '#4285F4', fontSize: 24 }}>G</span>;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
          {collapsed ? 'DP' : 'DevOps Platform'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[selectedMenu]}
          mode="inline"
          items={menuItems}
          onClick={({ key }: any) => setSelectedMenu(key as string)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>{menuItems.find(item => item.key === selectedMenu)?.label}</h2>
          <Space>
            <Button icon={<GithubOutlined />}>GitHub</Button>
            <Avatar icon={<UserOutlined />} />
          </Space>
        </Header>
        <Content style={{ margin: '16px', overflow: 'auto' }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default ComprehensiveDashboard;
