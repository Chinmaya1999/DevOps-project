import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  Select,
  Spin,
  Alert,
  Statistic,
  Table,
  Tag,
  Progress,
  Divider,
  message,
  Tabs,
} from 'antd';
import {
  CloudOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  LineChartOutlined,
  PieChartOutlined,
  AmazonOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';

const { Option } = Select;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

interface CostData {
  monthlyCosts: any[];
  serviceCosts: any[];
  regionCosts: any[];
  forecast: any;
  recommendations: any[];
  summary: {
    totalMonthlyCost: number;
    topService: any;
    topRegion: any;
    projectedSavings: number;
  };
}

const CloudCostAnalysis: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [costData, setCostData] = useState<CostData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCostAnalysis = async (values: any) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/cost-analysis/analysis',
        {
          accessKeyId: values.accessKeyId,
          secretAccessKey: values.secretAccessKey,
          region: values.region || 'us-east-1',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setCostData(response.data.data);
        if (response.data.data.isDemo) {
          message.warning('Showing demo data - AWS Cost Explorer not enabled');
        } else {
          message.success('Cost analysis completed successfully!');
        }
      } else {
        setError(response.data.message || 'Failed to fetch cost data');
        message.error(response.data.message || 'Failed to fetch cost data');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to connect to the server';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'red';
      case 'MEDIUM':
        return 'orange';
      case 'LOW':
        return 'green';
      default:
        return 'default';
    }
  };

  const renderCredentialForm = () => (
    <Card title="AWS Credentials" className="mb-4">
      <Form
        form={form}
        layout="vertical"
        onFinish={fetchCostAnalysis}
        initialValues={{
          region: 'us-east-1',
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Access Key ID"
              name="accessKeyId"
              rules={[{ required: true, message: 'Please enter your AWS Access Key ID' }]}
            >
              <Input
                prefix={<AmazonOutlined />}
                placeholder="AKIAIOSFODNN7EXAMPLE"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Secret Access Key"
              name="secretAccessKey"
              rules={[{ required: true, message: 'Please enter your AWS Secret Access Key' }]}
            >
              <Input.Password
                prefix={<CloudOutlined />}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Region" name="region">
              <Select size="large">
                <Option value="us-east-1">US East (N. Virginia)</Option>
                <Option value="us-east-2">US East (Ohio)</Option>
                <Option value="us-west-1">US West (N. California)</Option>
                <Option value="us-west-2">US West (Oregon)</Option>
                <Option value="af-south-1">Africa (Cape Town)</Option>
                <Option value="ap-east-1">Asia Pacific (Hong Kong)</Option>
                <Option value="ap-south-1">Asia Pacific (Mumbai)</Option>
                <Option value="ap-northeast-1">Asia Pacific (Tokyo)</Option>
                <Option value="ap-northeast-2">Asia Pacific (Seoul)</Option>
                <Option value="ap-northeast-3">Asia Pacific (Osaka)</Option>
                <Option value="ap-southeast-1">Asia Pacific (Singapore)</Option>
                <Option value="ap-southeast-2">Asia Pacific (Sydney)</Option>
                <Option value="ap-southeast-3">Asia Pacific (Jakarta)</Option>
                <Option value="ca-central-1">Canada (Central)</Option>
                <Option value="eu-central-1">Europe (Frankfurt)</Option>
                <Option value="eu-west-1">Europe (Ireland)</Option>
                <Option value="eu-west-2">Europe (London)</Option>
                <Option value="eu-west-3">Europe (Paris)</Option>
                <Option value="eu-south-1">Europe (Milan)</Option>
                <Option value="eu-north-1">Europe (Stockholm)</Option>
                <Option value="me-south-1">Middle East (Bahrain)</Option>
                <Option value="me-central-1">Middle East (UAE)</Option>
                <Option value="sa-east-1">South America (São Paulo)</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            icon={<BarChartOutlined />}
            block
          >
            Analyze Cloud Costs
          </Button>
        </Form.Item>
      </Form>
      <Alert
        message="Security Notice"
        description="Your AWS credentials are used securely to fetch cost data and are never stored on our servers."
        type="info"
        showIcon
        closable
      />
    </Card>
  );

  const renderOverview = () => {
    if (!costData) return null;

    const { summary } = costData;

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Monthly Cost"
              value={summary.totalMonthlyCost}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              suffix="/month"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Top Service"
              value={summary.topService?.serviceName || 'N/A'}
              prefix={<CloudOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            {summary.topService && (
              <div style={{ marginTop: 8, color: '#666' }}>
                ${summary.topService.amount.toFixed(2)}/month
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Top Region"
              value={summary.topRegion?.regionName || 'N/A'}
              prefix={<AmazonOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            {summary.topRegion && (
              <div style={{ marginTop: 8, color: '#666' }}>
                ${summary.topRegion.amount.toFixed(2)}/month
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Projected Savings"
              value={summary.projectedSavings}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
              suffix="/month"
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderMonthlyCostChart = () => {
    if (!costData?.monthlyCosts) return null;

    const chartData = costData.monthlyCosts.map((item: any) => ({
      month: new Date(item.timePeriod.Start).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      }),
      cost: item.total,
    }));

    return (
      <Card title="Monthly Cost Trend" extra={<LineChartOutlined />}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: any) => `$${typeof value === 'number' ? value.toFixed(2) : value}`} />
            <Legend />
            <Area
              type="monotone"
              dataKey="cost"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    );
  };

  const renderServiceCostChart = () => {
    if (!costData?.serviceCosts) return null;

    const chartData = costData.serviceCosts.slice(0, 8).map((item: any) => ({
      name: item.serviceName.replace('Amazon ', '').replace('AWS ', ''),
      value: item.amount,
    }));

    return (
      <Card title="Cost by Service" extra={<PieChartOutlined />}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) => `${entry.name}: $${typeof entry.value === 'number' ? entry.value.toFixed(0) : entry.value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => `$${typeof value === 'number' ? value.toFixed(2) : value}`} />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    );
  };

  const renderServiceCostTable = () => {
    if (!costData?.serviceCosts) return null;

    const columns = [
      {
        title: 'Service',
        dataIndex: 'serviceName',
        key: 'serviceName',
        render: (text: string) => <Tag color="blue">{text}</Tag>,
      },
      {
        title: 'Monthly Cost',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount: number) => `$${amount.toFixed(2)}`,
        sorter: (a: any, b: any) => a.amount - b.amount,
      },
      {
        title: 'Percentage',
        key: 'percentage',
        render: (_: any, record: any) => {
          const percentage = (record.amount / costData.summary.totalMonthlyCost) * 100;
          return (
            <div>
              <Progress
                percent={percentage}
                size="small"
                status={percentage > 20 ? 'exception' : 'normal'}
              />
            </div>
          );
        },
      },
    ];

    return (
      <Card title="Service Cost Breakdown" extra={<CloudOutlined />}>
        <Table
          columns={columns}
          dataSource={costData.serviceCosts}
          pagination={{ pageSize: 10 }}
          rowKey="serviceName"
        />
      </Card>
    );
  };

  const renderRegionCostChart = () => {
    if (!costData?.regionCosts) return null;

    const chartData = costData.regionCosts.map((item: any) => ({
      region: item.regionName,
      cost: item.amount,
    }));

    return (
      <Card title="Cost by Region" extra={<BarChartOutlined />}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="region" />
            <YAxis />
            <Tooltip formatter={(value: any) => `$${typeof value === 'number' ? value.toFixed(2) : value}`} />
            <Legend />
            <Bar dataKey="cost" fill="#00C49F" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    );
  };

  const renderForecastChart = () => {
    if (!costData?.forecast) return null;

    const { historical, forecast } = costData.forecast;
    const chartData = [
      ...historical.map((item: any) => ({
        month: new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        }),
        historical: item.amount,
        forecast: null,
      })),
      ...forecast.map((item: any) => ({
        month: new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        }),
        historical: null,
        forecast: item.amount,
      })),
    ];

    return (
      <Card
        title="Cost Forecast"
        extra={<RiseOutlined />}
        className="mb-4"
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: any) => (value ? `$${typeof value === 'number' ? value.toFixed(2) : value}` : 'N/A')} />
            <Legend />
            <Line
              type="monotone"
              dataKey="historical"
              stroke="#8884d8"
              name="Historical"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#82ca9d"
              name="Forecast"
              strokeDasharray="5 5"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <Divider />
        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title="Total Forecast (3 months)"
              value={costData.forecast.totalForecast}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Average Monthly Forecast"
              value={costData.forecast.totalForecast / 3}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
        </Row>
      </Card>
    );
  };

  const renderRecommendations = () => {
    if (!costData?.recommendations) return null;

    const columns = [
      {
        title: 'Priority',
        dataIndex: 'priority',
        key: 'priority',
        render: (priority: string) => (
          <Tag color={getPriorityColor(priority)}>{priority}</Tag>
        ),
        filters: [
          { text: 'High', value: 'HIGH' },
          { text: 'Medium', value: 'MEDIUM' },
          { text: 'Low', value: 'LOW' },
        ],
        onFilter: (value: any, record: any) => record.priority === value,
      },
      {
        title: 'Recommendation',
        dataIndex: 'title',
        key: 'title',
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: 'Potential Savings',
        dataIndex: 'potentialSavings',
        key: 'potentialSavings',
        render: (savings: string) => (
          <Tag color="green">{savings}</Tag>
        ),
      },
      {
        title: 'Action',
        dataIndex: 'action',
        key: 'action',
      },
    ];

    return (
      <Card title="Cost Optimization Recommendations" extra={<ThunderboltOutlined />}>
        <Alert
          message="Optimization Tips"
          description="Implement these recommendations to reduce your AWS costs. Prioritize HIGH priority items for maximum impact."
          type="success"
          showIcon
          closable
          className="mb-4"
        />
        <Table
          columns={columns}
          dataSource={costData.recommendations}
          pagination={{ pageSize: 10 }}
          rowKey="title"
        />
      </Card>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          <CloudOutlined /> Cloud Infrastructure Cost Analysis
        </h1>
        <p style={{ color: '#666' }}>
          Analyze your AWS spending and get recommendations to optimize costs
        </p>
      </div>

      {renderCredentialForm()}

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          className="mb-4"
        />
      )}

      {loading && (
        <Card className="mb-4">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '16px', color: '#666' }}>
              Analyzing your AWS costs... This may take a moment.
            </p>
          </div>
        </Card>
      )}

      {costData && !loading && (
        <div>
          {renderOverview()}

          <Tabs
            defaultActiveKey="1"
            style={{ marginTop: '24px' }}
            items={[
              {
                key: '1',
                label: 'Overview',
                children: (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      {renderMonthlyCostChart()}
                    </Col>
                    <Col xs={24} lg={12}>
                      {renderServiceCostChart()}
                    </Col>
                  </Row>
                ),
              },
              {
                key: '2',
                label: 'Service Breakdown',
                children: renderServiceCostTable(),
              },
              {
                key: '3',
                label: 'Regional Analysis',
                children: renderRegionCostChart(),
              },
              {
                key: '4',
                label: 'Forecast',
                children: renderForecastChart(),
              },
              {
                key: '5',
                label: 'Recommendations',
                children: renderRecommendations(),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default CloudCostAnalysis;
