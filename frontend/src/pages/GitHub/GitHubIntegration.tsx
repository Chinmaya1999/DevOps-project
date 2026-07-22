import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Table, Tag, Space, message, Spin, Alert, Modal, Row, Col, Tree, Drawer, Tabs } from 'antd';
import { GithubOutlined, ReloadOutlined, LinkOutlined, CheckCircleOutlined, CloudOutlined, ContainerOutlined, CloudServerOutlined, FileTextOutlined, BarChartOutlined, LockOutlined, EyeOutlined, RocketOutlined, FolderOpenOutlined, FileOutlined, SaveOutlined, BuildOutlined, UploadOutlined, BranchesOutlined } from '@ant-design/icons';
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
  default_branch: string;
  branches_count?: number;
  commits_count?: number;
}

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  content?: string;
  sha?: string;
  children?: GitHubFile[];
}

interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  };
}

const GitHubIntegration: React.FC = () => {
  const [token, setToken] = useState('');
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  const [analyzedRepo, setAnalyzedRepo] = useState<{ owner: string; repo: string; analysis: any } | null>(null);
  const [fileStructureDrawerVisible, setFileStructureDrawerVisible] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<{ owner: string; repo: string } | null>(null);
  const [fileStructure, setFileStructure] = useState<GitHubFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState<GitHubFile | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [editingFile, setEditingFile] = useState(false);
  const [dockerBuildModalVisible, setDockerBuildModalVisible] = useState(false);
  const [dockerHubUsername, setDockerHubUsername] = useState('');
  const [dockerHubToken, setDockerHubToken] = useState('');
  const [dockerImageName, setDockerImageName] = useState('');
  const [dockerTag, setDockerTag] = useState('latest');
  const [buildingDocker, setBuildingDocker] = useState(false);
  const [buildLogs, setBuildLogs] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const navigate = useNavigate();

  // Load saved GitHub token on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
      setToken(savedToken);
      // Auto-fetch repositories if token exists
      fetchRepositories();
    }
  }, []);

  // Load saved Docker Hub credentials
  useEffect(() => {
    const savedDockerHubUsername = localStorage.getItem('dockerhub_username');
    const savedDockerHubToken = localStorage.getItem('dockerhub_token');
    if (savedDockerHubUsername) setDockerHubUsername(savedDockerHubUsername);
    if (savedDockerHubToken) setDockerHubToken(savedDockerHubToken);
  }, []);

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
        // Save token to localStorage
        localStorage.setItem('github_token', token);
        message.success(`Found ${response.data.repositories.length} repositories`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch repositories');
      message.error('Failed to fetch repositories');
    } finally {
      setLoading(false);
    }
  };

  const fetchFileStructure = async (owner: string, repo: string) => {
    setLoadingFiles(true);
    try {
      const response = await api.get(`/github/files/${owner}/${repo}`, {
        params: { token }
      });
      if (response.data.files) {
        setFileStructure(response.data.files);
        setSelectedRepo({ owner, repo });
        setFileStructureDrawerVisible(true);
        // Also fetch branches and commits
        fetchBranchesAndCommits(owner, repo);
      }
    } catch (err: any) {
      message.error('Failed to fetch file structure');
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchFileContent = async (filePath: string) => {
    if (!selectedRepo) return;
    try {
      const response = await api.get(`/github/file/${selectedRepo.owner}/${selectedRepo.repo}`, {
        params: { token, path: filePath }
      });
      if (response.data.content) {
        setFileContent(response.data.content);
        setSelectedFile({ name: filePath.split('/').pop() || '', path: filePath, type: 'file', content: response.data.content });
      }
    } catch (err: any) {
      message.error('Failed to fetch file content');
    }
  };

  const saveFileContent = async () => {
    if (!selectedFile || !selectedRepo) return;
    try {
      await api.put(`/github/file/${selectedRepo.owner}/${selectedRepo.repo}`, {
        token,
        path: selectedFile.path,
        content: fileContent,
        message: `Update ${selectedFile.name}`
      });
      message.success('File saved successfully');
      setEditingFile(false);
    } catch (err: any) {
      message.error('Failed to save file');
    }
  };

  const buildDockerImage = async () => {
    if (!selectedRepo || !dockerHubUsername || !dockerHubToken) {
      message.error('Please provide Docker Hub credentials');
      return;
    }

    setBuildingDocker(true);
    setBuildLogs('Starting Docker build process...\n');

    try {
      // Save Docker Hub credentials
      localStorage.setItem('dockerhub_username', dockerHubUsername);
      localStorage.setItem('dockerhub_token', dockerHubToken);

      const response = await api.post('/github/build-docker', {
        token,
        owner: selectedRepo.owner,
        repo: selectedRepo.repo,
        dockerHubUsername,
        dockerHubToken,
        imageName: dockerImageName || selectedRepo.repo,
        tag: dockerTag
      });

      if (response.data.logs) {
        setBuildLogs(response.data.logs);
        message.success('Docker image built and pushed successfully');
      }
      setDockerBuildModalVisible(false);
    } catch (err: any) {
      setBuildLogs(prev => prev + '\nError: ' + (err.response?.data?.error || 'Failed to build Docker image'));
      message.error('Failed to build Docker image');
    } finally {
      setBuildingDocker(false);
    }
  };

  const transformFileToTreeData = (files: GitHubFile[]): any[] => {
    return files.map(file => ({
      title: (
        <Space>
          {file.type === 'dir' ? <FolderOpenOutlined /> : <FileOutlined />}
          <span onClick={() => file.type === 'file' && fetchFileContent(file.path)}>
            {file.name}
          </span>
        </Space>
      ),
      key: file.path,
      children: file.children ? transformFileToTreeData(file.children) : undefined
    }));
  };

  const fetchBranchesAndCommits = async (owner: string, repo: string) => {
    setLoadingBranches(true);
    setLoadingCommits(true);
    try {
      const [branchesResponse, commitsResponse] = await Promise.all([
        api.get(`/github/branches/${owner}/${repo}`, { params: { token } }),
        api.get(`/github/commits/${owner}/${repo}`, { params: { token, limit: 5 } })
      ]);

      if (branchesResponse.data.branches) {
        setBranches(branchesResponse.data.branches);
        setSelectedBranch(branchesResponse.data.branches[0]?.name || 'main');
      }

      if (commitsResponse.data.commits) {
        setCommits(commitsResponse.data.commits);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch branches/commits';
      console.error('Error fetching branches/commits:', err);
      message.error(errorMsg);
    } finally {
      setLoadingBranches(false);
      setLoadingCommits(false);
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
            icon={<FolderOpenOutlined />}
            onClick={() => fetchFileStructure(record.full_name.split('/')[0], record.name)}
          >
            Files
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

      {/* File Structure Drawer */}
      <Drawer
        title={
          <Space>
            <FolderOpenOutlined />
            <span>{selectedRepo?.owner}/{selectedRepo?.repo} - File Structure</span>
          </Space>
        }
        placement="right"
        width={800}
        open={fileStructureDrawerVisible}
        onClose={() => setFileStructureDrawerVisible(false)}
        extra={
          <Space>
            <Button
              icon={<BuildOutlined />}
              onClick={() => setDockerBuildModalVisible(true)}
              type="primary"
            >
              Build Docker Image
            </Button>
          </Space>
        }
      >
        <Tabs
          defaultActiveKey="structure"
          items={[
            {
              key: 'structure',
              label: 'File Structure',
              children: (
                <div>
                  {loadingFiles ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spin size="large" />
                      <p style={{ marginTop: 16 }}>Loading file structure...</p>
                    </div>
                  ) : (
                    <Tree
                      showIcon
                      defaultExpandAll
                      treeData={transformFileToTreeData(fileStructure)}
                    />
                  )}
                </div>
              ),
            },
            {
              key: 'branches',
              label: (
                <Space>
                  <span>Branches</span>
                  {branches.length > 0 && <Tag color="blue">{branches.length}</Tag>}
                </Space>
              ),
              children: (
                <div>
                  {loadingBranches ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spin size="large" />
                      <p style={{ marginTop: 16 }}>Loading branches...</p>
                    </div>
                  ) : (
                    <div>
                      {branches.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                          No branches found
                        </div>
                      ) : (
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          {branches.map((branch) => (
                            <Card
                              key={branch.name}
                              size="small"
                              style={{
                                borderLeft: branch.name === selectedBranch ? '4px solid #1890ff' : '1px solid #d9d9d9',
                                backgroundColor: branch.name === selectedBranch ? '#f0f7ff' : '#fff'
                              }}
                            >
                              <Space>
                                <BranchesOutlined />
                                <strong>{branch.name}</strong>
                                {branch.protected && <Tag color="green">Protected</Tag>}
                                {branch.name === selectedBranch && <Tag color="blue">Default</Tag>}
                              </Space>
                              <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                                SHA: {branch.commit.sha.substring(0, 7)}
                              </div>
                            </Card>
                          ))}
                        </Space>
                      )}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'commits',
              label: (
                <Space>
                  <span>Recent Commits</span>
                  {commits.length > 0 && <Tag color="green">{commits.length}</Tag>}
                </Space>
              ),
              children: (
                <div>
                  {loadingCommits ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spin size="large" />
                      <p style={{ marginTop: 16 }}>Loading commits...</p>
                    </div>
                  ) : (
                    <div>
                      {commits.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                          No commits found
                        </div>
                      ) : (
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          {commits.map((commit) => (
                            <Card key={commit.sha} size="small" hoverable>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <img
                                  src={commit.author.avatar_url}
                                  alt={commit.author.login}
                                  style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 500, marginBottom: 4 }}>
                                    {commit.commit.message.split('\n')[0]}
                                  </div>
                                  <Space size="small" style={{ fontSize: '12px', color: '#666' }}>
                                    <span>{commit.author.login}</span>
                                    <span>•</span>
                                    <span>{new Date(commit.commit.author.date).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span style={{ fontFamily: 'monospace' }}>
                                      {commit.sha.substring(0, 7)}
                                    </span>
                                  </Space>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </Space>
                      )}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'editor',
              label: 'File Editor',
              children: (
                <div>
                  {selectedFile ? (
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <Space>
                          <FileOutlined />
                          <strong>{selectedFile.name}</strong>
                          <Tag>{selectedFile.path}</Tag>
                          {!editingFile && (
                            <Button
                              size="small"
                              icon={<SaveOutlined />}
                              onClick={() => setEditingFile(true)}
                            >
                              Edit
                            </Button>
                          )}
                          {editingFile && (
                            <Space>
                              <Button
                                size="small"
                                type="primary"
                                icon={<SaveOutlined />}
                                onClick={saveFileContent}
                              >
                                Save
                              </Button>
                              <Button
                                size="small"
                                onClick={() => setEditingFile(false)}
                              >
                                Cancel
                              </Button>
                            </Space>
                          )}
                        </Space>
                      </div>
                      <div style={{ height: '500px' }}>
                        {editingFile ? (
                          <Input.TextArea
                            value={fileContent}
                            onChange={(e) => setFileContent(e.target.value)}
                            style={{ height: '100%', fontFamily: 'monospace', fontSize: '14px' }}
                          />
                        ) : (
                          <pre style={{
                            height: '100%',
                            overflow: 'auto',
                            backgroundColor: '#f5f5f5',
                            padding: '16px',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '14px'
                          }}>
                            {fileContent}
                          </pre>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                      Select a file to view its content
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Drawer>

      {/* Docker Build Modal */}
      <Modal
        title={
          <Space>
            <BuildOutlined />
            <span>Build Docker Image</span>
          </Space>
        }
        open={dockerBuildModalVisible}
        onCancel={() => setDockerBuildModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDockerBuildModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="build"
            type="primary"
            icon={<UploadOutlined />}
            onClick={buildDockerImage}
            loading={buildingDocker}
          >
            Build & Push
          </Button>,
        ]}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message="Docker Hub Credentials"
            description="Enter your Docker Hub credentials to build and push the image."
            type="info"
            showIcon
          />

          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Docker Hub Username</label>
            <Input
              placeholder="Enter Docker Hub username"
              value={dockerHubUsername}
              onChange={(e) => setDockerHubUsername(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Docker Hub Token/Password</label>
            <Input.Password
              placeholder="Enter Docker Hub token or password"
              value={dockerHubToken}
              onChange={(e) => setDockerHubToken(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Image Name</label>
            <Input
              placeholder={selectedRepo?.repo || 'my-image'}
              value={dockerImageName}
              onChange={(e) => setDockerImageName(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Tag</label>
            <Input
              placeholder="latest"
              value={dockerTag}
              onChange={(e) => setDockerTag(e.target.value)}
            />
          </div>

          {buildingDocker && (
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>Build Logs</label>
              <div style={{
                backgroundColor: '#1e1e1e',
                color: '#d4d4d4',
                padding: '12px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
                height: '200px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {buildLogs}
              </div>
            </div>
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default GitHubIntegration;
