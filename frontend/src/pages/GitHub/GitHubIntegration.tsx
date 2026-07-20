import React, { useState } from 'react';
import { Card, Input, Button, Table, Tag, Space, message, Spin, Alert, Modal, Row, Col } from 'antd';
import { GithubOutlined, ReloadOutlined, LinkOutlined, CheckCircleOutlined, CloudOutlined, ContainerOutlined, CloudServerOutlined, FileTextOutlined, BarChartOutlined, LockOutlined, EyeOutlined, RocketOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  html_url: string;
  private: boolean;
}

const GitHubIntegration: React.FC = () => {
  const [token, setToken] = useState('');
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  const [analyzedRepo, setAnalyzedRepo] = useState<{ owner: string; repo: string; analysis: any } | null>(null);
  const navigate = useNavigate();

  const fetchRepositories = async () => {
    if (!token.trim()) {
      message.error('Please enter your GitHub token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.get('/github/repositories', {
        params: { token }
      });

      if (response.data.repositories) {
        setRepositories(response.data.repositories);
        message.success(`Found ${response.data.repositories.length} repositories`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch repositories');
      message.error('Failed to fetch repositories');
    } finally {
      setLoading(false);
    }
  };

  const analyzeRepository = async (owner: string, repo: string) => {
    if (!token.trim()) {
      message.error('Please enter your GitHub token first');
      return;
    }

    try {
      const response = await api.get(`/github/analyze/${owner}/${repo}`, {
        params: { token }
      });

      if (response.data.analysis) {
        message.success('Repository analyzed successfully');
        setAnalyzedRepo({ owner, repo, analysis: response.data.analysis });
        setAnalysisModalVisible(true);
      }
    } catch (err: any) {
      message.error('Failed to analyze repository');
    }
  };

  const handleGenerateFile = (type: string) => {
    setAnalysisModalVisible(false);
    if (type === 'vision') {
      navigate('/vision', { state: { analyzedRepo } });
    } else {
      navigate(`/generator/${type}`, { state: { analyzedRepo } });
    }
  };

  const columns = [
    {
      title: 'Repository Name',
      dataIndex: 'name',
      key: 'name',
      render: (_: string, record: Repository) => (
        <Space>
          <GithubOutlined />
          <a href={record.html_url} target="_blank" rel="noopener noreferrer">
            {record.full_name}
          </a>
          {record.private && <Tag color="red">Private</Tag>}
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Language',
      dataIndex: 'language',
      key: 'language',
      render: (language: string) => language ? <Tag color="blue">{language}</Tag> : '-',
    },
    {
      title: 'Stars',
      dataIndex: 'stargazers_count',
      key: 'stargazers_count',
      sorter: (a: Repository, b: Repository) => a.stargazers_count - b.stargazers_count,
    },
    {
      title: 'Forks',
      dataIndex: 'forks_count',
      key: 'forks_count',
      sorter: (a: Repository, b: Repository) => a.forks_count - b.forks_count,
    },
    {
      title: 'Last Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Repository) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<LinkOutlined />}
            onClick={() => analyzeRepository(record.full_name.split('/')[0], record.name)}
          >
            Analyze
          </Button>
          <Button
            size="small"
            icon={<GithubOutlined />}
            onClick={() => window.open(record.html_url, '_blank')}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="GitHub Integration" extra={<GithubOutlined style={{ fontSize: 24 }} />}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message="GitHub Token Required"
            description="Enter your GitHub personal access token to fetch and analyze your repositories. The token should have 'repo' scope permissions."
            type="info"
            showIcon
          />

          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="Enter your GitHub token (ghp_...)"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onPressEnter={fetchRepositories}
              style={{ flex: 1 }}
              type="password"
            />
            <Button
              type="primary"
              icon={<GithubOutlined />}
              onClick={fetchRepositories}
              loading={loading}
            >
              Fetch Repositories
            </Button>
          </Space.Compact>

          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError('')}
            />
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <p style={{ marginTop: 16 }}>Fetching repositories...</p>
            </div>
          ) : repositories.length > 0 ? (
            <Card
              title={`Found ${repositories.length} repositories`}
              extra={
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchRepositories}
                  loading={loading}
                >
                  Refresh
                </Button>
              }
            >
              <Table
                dataSource={repositories}
                columns={columns}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} repositories`,
                }}
              />
            </Card>
          ) : (
            <Card>
              <p style={{ textAlign: 'center', color: '#999' }}>
                No repositories loaded. Enter your GitHub token and click "Fetch Repositories" to get started.
              </p>
            </Card>
          )}
        </Space>
      </Card>

      {/* Analysis Results Modal */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span>Repository Analysis Complete</span>
          </Space>
        }
        open={analysisModalVisible}
        onCancel={() => setAnalysisModalVisible(false)}
        footer={null}
        width={900}
      >
        {analyzedRepo && (
          <div>
            <Alert
              message={`Analysis completed for ${analyzedRepo.owner}/${analyzedRepo.repo}`}
              description="Based on the repository analysis, here are the recommended DevOps files and configurations for your project:"
              type="success"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  onClick={() => handleGenerateFile('vision')}
                  style={{ cursor: 'pointer', textAlign: 'center', border: '2px solid #1890ff' }}
                >
                  <RocketOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 16 }} />
                  <h3 style={{ color: '#1890ff' }}>Vision - One-Click Deploy</h3>
                  <p style={{ color: '#666', fontSize: 12 }}>Auto-deploy to cloud with CI/CD, SSL & monitoring</p>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  onClick={() => handleGenerateFile('jenkins')}
                  style={{ cursor: 'pointer', textAlign: 'center' }}
                >
                  <CloudServerOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 16 }} />
                  <h3>Jenkins Pipeline</h3>
                  <p style={{ color: '#666', fontSize: 12 }}>CI/CD pipeline configuration</p>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  onClick={() => handleGenerateFile('github-actions')}
                  style={{ cursor: 'pointer', textAlign: 'center' }}
                >
                  <GithubOutlined style={{ fontSize: 32, color: '#24292e', marginBottom: 16 }} />
                  <h3>GitHub Actions</h3>
                  <p style={{ color: '#666', fontSize: 12 }}>GitHub CI/CD workflow</p>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  onClick={() => handleGenerateFile('dockerfile')}
                  style={{ cursor: 'pointer', textAlign: 'center' }}
                >
                  <ContainerOutlined style={{ fontSize: 32, color: '#007bff', marginBottom: 16 }} />
                  <h3>Dockerfile</h3>
                  <p style={{ color: '#666', fontSize: 12 }}>Container configuration</p>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  onClick={() => handleGenerateFile('kubernetes')}
                  style={{ cursor: 'pointer', textAlign: 'center' }}
                >
                  <CloudOutlined style={{ fontSize: 32, color: '#326ce5', marginBottom: 16 }} />
                  <h3>Kubernetes YAML</h3>
                  <p style={{ color: '#666', fontSize: 12 }}>K8s deployment files</p>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  onClick={() => handleGenerateFile('terraform')}
                  style={{ cursor: 'pointer', textAlign: 'center' }}
                >
                  <CloudServerOutlined style={{ fontSize: 32, color: '#7B42BC', marginBottom: 16 }} />
                  <h3>Terraform IaC</h3>
                  <p style={{ color: '#666', fontSize: 12 }}>Infrastructure as Code</p>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  onClick={() => handleGenerateFile('monitoring')}
                  style={{ cursor: 'pointer', textAlign: 'center' }}
                >
                  <BarChartOutlined style={{ fontSize: 32, color: '#E65100', marginBottom: 16 }} />
                  <h3>Monitoring Stack</h3>
                  <p style={{ color: '#666', fontSize: 12 }}>Prometheus & Grafana</p>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  onClick={() => handleGenerateFile('ssl')}
                  style={{ cursor: 'pointer', textAlign: 'center' }}
                >
                  <LockOutlined style={{ fontSize: 32, color: '#4CAF50', marginBottom: 16 }} />
                  <h3>SSL/HTTPS</h3>
                  <p style={{ color: '#666', fontSize: 12 }}>SSL configuration</p>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  onClick={() => handleGenerateFile('ansible')}
                  style={{ cursor: 'pointer', textAlign: 'center' }}
                >
                  <FileTextOutlined style={{ fontSize: 32, color: '#EE0000', marginBottom: 16 }} />
                  <h3>Ansible Playbook</h3>
                  <p style={{ color: '#666', fontSize: 12 }}>Automation scripts</p>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  onClick={() => handleGenerateFile('bash')}
                  style={{ cursor: 'pointer', textAlign: 'center' }}
                >
                  <EyeOutlined style={{ fontSize: 32, color: '#4E4E4E', marginBottom: 16 }} />
                  <h3>Log Viewer</h3>
                  <p style={{ color: '#666', fontSize: 12 }}>Log monitoring setup</p>
                </Card>
              </Col>
            </Row>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Button onClick={() => setAnalysisModalVisible(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GitHubIntegration;
