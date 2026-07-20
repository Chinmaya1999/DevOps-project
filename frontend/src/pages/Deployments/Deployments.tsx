import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Tag, 
  Space, 
  Modal, 
  message, 
  Spin, 
  Descriptions, 
  Tabs, 
  List, 
  Typography, 
  Popconfirm,
  Row,
  Col,
  Statistic,
  Input
} from 'antd';
import { 
  DeleteOutlined, 
  ReloadOutlined, 
  StopOutlined, 
  EyeOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  LoadingOutlined,
  CloudServerOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

interface Deployment {
  _id: string;
  projectName: string;
  deploymentType: string;
  deploymentScope: string;
  cloudProvider: string;
  region: string;
  host: string;
  domain: string | null;
  applicationUrl: string;
  port: number | null;
  backendImage: string | null;
  frontendImage: string | null;
  status: string;
  isLive: boolean;
  lastHealthCheck: string | null;
  healthCheckStatus: string;
  createdAt: string;
  updatedAt: string;
}

const Deployments: React.FC = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>( null);
  const [composeFileContent, setComposeFileContent] = useState('');
  const [composeLoading, setComposeLoading] = useState(false);
  const [composeSaving, setComposeSaving] = useState(false);

  useEffect(() => {
    fetchDeployments();
  }, []);

  const fetchDeployments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/deployments');
      setDeployments(response.data.deployments);
    } catch (error: any) {
      message.error('Failed to fetch deployments');
      console.error('Error fetching deployments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (deploymentId: string) => {
    try {
      setLoadingLogs(true);
      const response = await api.get(`/deployments/${deploymentId}/logs`);
      setLogs(response.data.logs);
    } catch (error: any) {
      message.error('Failed to fetch logs');
      console.error('Error fetching logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchErrorLogs = async (deploymentId: string) => {
    try {
      setLoadingLogs(true);
      const response = await api.get(`/deployments/${deploymentId}/error-logs`);
      setErrorLogs(response.data.errorLogs);
    } catch (error: any) {
      message.error('Failed to fetch error logs');
      console.error('Error fetching error logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const checkHealth = async (deploymentId: string) => {
    try {
      const response = await api.post(`/deployments/${deploymentId}/health`);
      setHealthStatus(response.data.health);
      message.success('Health check completed');
    } catch (error: any) {
      message.error('Failed to check health');
      console.error('Error checking health:', error);
    }
  };

  const handleDelete = async (deploymentId: string) => {
    try {
      setActionLoading(deploymentId);
      await api.delete(`/deployments/${deploymentId}`);
      message.success('Deployment deleted successfully');
      fetchDeployments();
      setDetailModalVisible(false);
    } catch (error: any) {
      message.error('Failed to delete deployment');
      console.error('Error deleting deployment:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async (deploymentId: string) => {
    try {
      setActionLoading(deploymentId);
      await api.post(`/deployments/${deploymentId}/stop`);
      message.success('Deployment stopped successfully');
      fetchDeployments();
    } catch (error: any) {
      message.error('Failed to stop deployment');
      console.error('Error stopping deployment:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestart = async (deploymentId: string) => {
    try {
      setActionLoading(deploymentId);
      await api.post(`/deployments/${deploymentId}/restart`);
      message.success('Deployment restarted successfully');
      fetchDeployments();
    } catch (error: any) {
      message.error('Failed to restart deployment');
      console.error('Error restarting deployment:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const fetchComposeFile = async (deploymentId: string) => {
    try {
      setComposeLoading(true);
      const response = await api.get(`/deployments/${deploymentId}/compose-file`);
      setComposeFileContent(response.data.composeFile || '');
    } catch (error: any) {
      message.error('Failed to fetch compose file');
      console.error('Error fetching compose file:', error);
    } finally {
      setComposeLoading(false);
    }
  };

  const handleComposeFileUpdate = async (deploymentId: string) => {
    try {
      setComposeSaving(true);
      const response = await api.post(`/deployments/${deploymentId}/compose-file`, { composeFile: composeFileContent });
      message.success(response.data.message || 'Compose file updated successfully');
      await fetchComposeFile(deploymentId);
    } catch (error: any) {
      message.error('Failed to update compose file');
      console.error('Error updating compose file:', error);
    } finally {
      setComposeSaving(false);
    }
  };

  const showDetailModal = (deployment: Deployment) => {
    setSelectedDeployment(deployment);
    setDetailModalVisible(true);
    setLogs([]);
    setErrorLogs([]);
    setHealthStatus(null);
    setComposeFileContent('');
    fetchLogs(deployment._id);
    fetchErrorLogs(deployment._id);
    checkHealth(deployment._id);
    fetchComposeFile(deployment._id);
  };

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      deploying: { color: 'processing', icon: <LoadingOutlined /> },
      running: { color: 'success', icon: <CheckCircleOutlined /> },
      stopped: { color: 'default', icon: <StopOutlined /> },
      failed: { color: 'error', icon: <CloseCircleOutlined /> },
      deleting: { color: 'processing', icon: <LoadingOutlined /> }
    };

    const config = statusConfig[status] || { color: 'default', icon: null };
    return (
      <Tag color={config.color} icon={config.icon}>
        {status.toUpperCase()}
      </Tag>
    );
  };

  const getHealthStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string }> = {
      healthy: { color: 'success' },
      unhealthy: { color: 'error' },
      unknown: { color: 'default' }
    };

    const config = statusConfig[status] || { color: 'default' };
    return <Tag color={config.color}>{status.toUpperCase()}</Tag>;
  };

  const formatApplicationUrl = (url?: string | null) => {
    if (!url) return 'N/A';
    try {
      const normalized = url.trim();
      if (!normalized) return 'N/A';
      if (/^https?:\/\/[^/]+(:\d+)?(\/|$)/.test(normalized)) {
        return normalized;
      }
      return `http://${normalized}`;
    } catch {
      return url;
    }
  };

  const getDeploymentUrl = (deployment: Deployment) => {
    if (deployment.applicationUrl) {
      return formatApplicationUrl(deployment.applicationUrl);
    }
    if (deployment.host && deployment.port) {
      return formatApplicationUrl(`http://${deployment.host}:${deployment.port}`);
    }
    if (deployment.host) {
      return formatApplicationUrl(deployment.host);
    }
    return 'N/A';
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Type',
      dataIndex: 'deploymentType',
      key: 'deploymentType',
      render: (text: string) => <Tag>{text.toUpperCase()}</Tag>
    },
    {
      title: 'Scope',
      dataIndex: 'deploymentScope',
      key: 'deploymentScope',
      render: (text: string) => <Tag>{text.toUpperCase()}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Live',
      dataIndex: 'isLive',
      key: 'isLive',
      render: (isLive: boolean) => (
        <Tag color={isLive ? 'success' : 'error'} icon={isLive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {isLive ? 'YES' : 'NO'}
        </Tag>
      )
    },
    {
      title: 'Health',
      dataIndex: 'healthCheckStatus',
      key: 'healthCheckStatus',
      render: (status: string) => getHealthStatusTag(status)
    },
    {
      title: 'Port',
      dataIndex: 'port',
      key: 'port',
      render: (port: number | null) => port ? <Tag color="blue">{port}</Tag> : <Text type="secondary">N/A</Text>
    },
    {
      title: 'URL',
      key: 'applicationUrl',
      render: (_: any, record: Deployment) => {
        const formattedUrl = getDeploymentUrl(record);
        if (formattedUrl === 'N/A') {
          return <Text type="secondary">N/A</Text>;
        }
        return (
          <a href={formattedUrl} target="_blank" rel="noopener noreferrer">
            {formattedUrl}
          </a>
        );
      }
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Deployment) => (
        <Space orientation="horizontal" size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => showDetailModal(record)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<ReloadOutlined />}
            onClick={() => handleRestart(record._id)}
            loading={actionLoading === record._id}
            disabled={record.status !== 'running' && record.status !== 'stopped'}
          >
            Restart
          </Button>
          <Button
            type="link"
            icon={<StopOutlined />}
            onClick={() => handleStop(record._id)}
            loading={actionLoading === record._id}
            disabled={record.status !== 'running'}
          >
            Stop
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this deployment?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              loading={actionLoading === record._id}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <CloudServerOutlined /> Deployments
            </Title>
            <Text type="secondary">Manage and monitor your deployments</Text>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchDeployments}
              loading={loading}
            >
              Refresh
            </Button>
          </Col>
        </Row>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={deployments}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} deployments`
            }}
          />
        </Spin>
      </Card>

      <Modal
        title={`Deployment Details: ${selectedDeployment?.projectName}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={1000}
      >
        {selectedDeployment && (
          <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Statistic
                  title="Status"
                  value={selectedDeployment.status.toUpperCase()}
                  valueStyle={{ color: selectedDeployment.status === 'running' ? '#3f8600' : '#cf1322' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Live"
                  value={selectedDeployment.isLive ? 'YES' : 'NO'}
                  valueStyle={{ color: selectedDeployment.isLive ? '#3f8600' : '#cf1322' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Health"
                  value={selectedDeployment.healthCheckStatus.toUpperCase()}
                  valueStyle={{ 
                    color: selectedDeployment.healthCheckStatus === 'healthy' ? '#3f8600' : 
                           selectedDeployment.healthCheckStatus === 'unhealthy' ? '#cf1322' : '#8c8c8c'
                  }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Scope"
                  value={selectedDeployment.deploymentScope.toUpperCase()}
                />
              </Col>
            </Row>

            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Project Name">{selectedDeployment.projectName}</Descriptions.Item>
              <Descriptions.Item label="Deployment Type">{selectedDeployment.deploymentType}</Descriptions.Item>
              <Descriptions.Item label="Cloud Provider">{selectedDeployment.cloudProvider}</Descriptions.Item>
              <Descriptions.Item label="Region">{selectedDeployment.region}</Descriptions.Item>
              <Descriptions.Item label="Host">{selectedDeployment.host}</Descriptions.Item>
              <Descriptions.Item label="Domain">{selectedDeployment.domain || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Application URL" span={2}>
                {(() => {
                  const url = getDeploymentUrl(selectedDeployment);
                  return url === 'N/A' ? <Text type="secondary">N/A</Text> : (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {url}
                    </a>
                  );
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="Port">{selectedDeployment.port || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Backend Image">{selectedDeployment.backendImage || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Frontend Image">{selectedDeployment.frontendImage || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Created At">{new Date(selectedDeployment.createdAt).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Last Updated">{new Date(selectedDeployment.updatedAt).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Last Health Check">
                {selectedDeployment.lastHealthCheck ? new Date(selectedDeployment.lastHealthCheck).toLocaleString() : 'N/A'}
              </Descriptions.Item>
            </Descriptions>

            <Tabs defaultActiveKey="logs">
              <TabPane tab="Deployment Logs" key="logs">
                <Spin spinning={loadingLogs}>
                  <List
                    dataSource={logs}
                    renderItem={(log: any) => (
                      <List.Item>
                        <List.Item.Meta
                          title={
                            <Space>
                              <Tag color={log.level === 'error' ? 'error' : log.level === 'warning' ? 'warning' : 'blue'}>
                                {log.level.toUpperCase()}
                              </Tag>
                              <Text type="secondary">{new Date(log.timestamp).toLocaleString()}</Text>
                            </Space>
                          }
                          description={log.message}
                        />
                      </List.Item>
                    )}
                    style={{ maxHeight: 400, overflow: 'auto' }}
                  />
                </Spin>
              </TabPane>
              <TabPane tab="Error Logs" key="errorLogs">
                <Spin spinning={loadingLogs}>
                  <List
                    dataSource={errorLogs}
                    renderItem={(log: any) => (
                      <List.Item>
                        <List.Item.Meta
                          title={
                            <Space>
                              <Tag color="error">{log.level.toUpperCase()}</Tag>
                              <Text type="secondary">{new Date(log.timestamp).toLocaleString()}</Text>
                            </Space>
                          }
                          description={log.message}
                        />
                      </List.Item>
                    )}
                    style={{ maxHeight: 400, overflow: 'auto' }}
                  />
                </Spin>
              </TabPane>
              <TabPane tab="Health Status" key="health">
                {healthStatus ? (
                  <Descriptions bordered>
                    <Descriptions.Item label="Status">
                      {healthStatus.isHealthy ? (
                        <Tag color="success" icon={<CheckCircleOutlined />}>HEALTHY</Tag>
                      ) : (
                        <Tag color="error" icon={<CloseCircleOutlined />}>UNHEALTHY</Tag>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Last Check">
                      {new Date(healthStatus.lastCheck).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Message" span={2}>
                      {healthStatus.message}
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Spin spinning={true} />
                )}
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={() => checkHealth(selectedDeployment._id)}
                  style={{ marginTop: 16 }}
                >
                  Check Health Again
                </Button>
              </TabPane>
              <TabPane tab="Compose File" key="compose">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text type="secondary">View and update the remote docker-compose.yml file. Saving it will apply the new image definitions to the running deployment.</Text>
                  <Spin spinning={composeLoading}>
                    <TextArea
                      rows={18}
                      value={composeFileContent}
                      onChange={(e) => setComposeFileContent(e.target.value)}
                      style={{ fontFamily: 'monospace' }}
                    />
                  </Spin>
                  <Space>
                    <Button
                      type="primary"
                      loading={composeSaving}
                      onClick={() => handleComposeFileUpdate(selectedDeployment._id)}
                    >
                      Update Compose File
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={() => fetchComposeFile(selectedDeployment._id)}>
                      Reload
                    </Button>
                  </Space>
                </Space>
              </TabPane>
            </Tabs>

            <Space style={{ marginTop: 24, justifyContent: 'flex-end', width: '100%' }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => handleRestart(selectedDeployment._id)}
                loading={actionLoading === selectedDeployment._id}
                disabled={selectedDeployment.status !== 'running' && selectedDeployment.status !== 'stopped'}
              >
                Restart
              </Button>
              <Button
                icon={<StopOutlined />}
                onClick={() => handleStop(selectedDeployment._id)}
                loading={actionLoading === selectedDeployment._id}
                disabled={selectedDeployment.status !== 'running'}
              >
                Stop
              </Button>
              <Popconfirm
                title="Are you sure you want to delete this deployment?"
                description="This action cannot be undone."
                onConfirm={() => handleDelete(selectedDeployment._id)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  loading={actionLoading === selectedDeployment._id}
                >
                  Delete
                </Button>
              </Popconfirm>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Deployments;
