const mongoose = require('mongoose');
const Blog = require('./models/Blog');
const User = require('./models/User');
require('dotenv').config();

const devOpsBlogs = [
  {
    title: "Kubernetes 1.30 Released: Major Security and Performance Improvements",
    content: `Kubernetes 1.30 has been released with significant improvements in security, performance, and developer experience. This release introduces several new features that DevOps engineers should be aware of.

Key highlights include:
- Enhanced security with improved pod security standards
- New dynamic resource allocation for better resource management
- Improved Windows container support
- Better monitoring and observability features
- Performance optimizations for large-scale deployments

The new pod security admission controller replaces the deprecated pod security policy, providing more granular control over pod security contexts. This change allows teams to define security policies at namespace level with greater flexibility.

For teams running Windows workloads, Kubernetes 1.30 brings improved compatibility and performance, making it easier to run hybrid Linux-Windows clusters.

The release also includes improvements to the kubectl command-line tool, making it more user-friendly for developers and operators alike.`,
    category: "Kubernetes",
    tags: ["Kubernetes", "Security", "Performance", "Release"],
    status: "published",
    isFeatured: true
  },
  {
    title: "Docker Desktop 4.28: New Features for Container Development",
    content: `Docker Desktop 4.28 brings exciting new features that enhance the container development experience for DevOps teams.

What's new in this release:
- Enhanced Docker Compose support for multi-container applications
- Improved integration with cloud providers
- Better performance for large image builds
- New security scanning capabilities
- Enhanced developer experience with improved UI

The new Docker Compose v2.24 integration provides better support for complex multi-container setups, making it easier to develop and test microservices locally.

Security scanning is now built directly into Docker Desktop, allowing developers to identify vulnerabilities in their images before deployment. This feature integrates with popular vulnerability databases and provides actionable remediation advice.

The cloud provider integration has been improved, making it seamless to push and pull images from AWS ECR, Google GCR, and Azure Container Registry.`,
    category: "Docker",
    tags: ["Docker", "Containers", "Development", "Security"],
    status: "published",
    isFeatured: true
  },
  {
    title: "AWS DevOps Guru Now Supports Multi-Account Monitoring",
    content: `AWS DevOps Guru has announced multi-account monitoring support, a game-changer for organizations managing multiple AWS accounts.

This new feature allows DevOps teams to:
- Monitor applications across multiple AWS accounts from a single dashboard
- Get unified insights and anomaly detection
- Reduce operational overhead with centralized monitoring
- Improve incident response times with cross-account visibility

The multi-account setup uses AWS Organizations and AWS RAM (Resource Access Manager) to securely share monitoring data across accounts while maintaining proper access controls.

DevOps Guru uses machine learning to detect operational anomalies and provides actionable insights to help teams resolve issues before they impact customers.

This update is particularly beneficial for enterprises with complex multi-account architectures, as it eliminates the need for multiple monitoring tools and provides a unified view of operational health.`,
    category: "AWS",
    tags: ["AWS", "Monitoring", "Machine Learning", "Multi-Account"],
    status: "published"
  },
  {
    title: "Terraform 1.7: Enhanced State Management and Provider Features",
    content: `HashiCorp has released Terraform 1.7 with significant improvements to state management and provider functionality.

Key features in Terraform 1.7:
- Improved state locking mechanisms for better team collaboration
- Enhanced provider development kit (PDK) for custom providers
- Better error messages and debugging capabilities
- Performance improvements for large-scale deployments
- New testing framework for Terraform modules

The improved state locking reduces conflicts when multiple team members are working on the same infrastructure, making collaborative infrastructure-as-code workflows smoother.

The new testing framework allows teams to write automated tests for their Terraform modules, ensuring infrastructure changes are validated before deployment.

Performance improvements include faster plan generation and better memory usage for configurations with thousands of resources.`,
    category: "Terraform",
    tags: ["Terraform", "IaC", "State Management", "Testing"],
    status: "published"
  },
  {
    title: "GitHub Actions: New Self-Hosted Runner Features for Enterprise",
    content: `GitHub has announced new features for self-hosted GitHub Actions runners, giving enterprises more control over their CI/CD pipelines.

New capabilities include:
- Improved runner scaling with auto-scaling groups
- Better resource management and isolation
- Enhanced security with runner groups and policies
- Integration with Kubernetes for dynamic runner provisioning
- Improved monitoring and logging

The auto-scaling feature allows organizations to automatically scale runners based on workload, reducing costs while maintaining performance during peak times.

Kubernetes integration enables teams to run CI/CD jobs directly in their Kubernetes clusters, providing better resource utilization and consistency with production environments.

The new security features include runner groups that allow fine-grained access control, ensuring that sensitive workflows only run on approved runners with proper security configurations.`,
    category: "CI/CD",
    tags: ["GitHub Actions", "CI/CD", "Kubernetes", "Security"],
    status: "published",
    isFeatured: true
  },
  {
    title: "GitLab 16.7: AI-Powered DevOps and Enhanced Security",
    content: `GitLab 16.7 introduces AI-powered features that transform how DevOps teams work, along with significant security enhancements.

Highlights of GitLab 16.7:
- GitLab Duo AI assistant for code suggestions and security scanning
- Enhanced dependency scanning with vulnerability database updates
- Improved pipeline efficiency with parallel execution
- Better integration with popular cloud providers
- New compliance and governance features

The GitLab Duo AI assistant helps developers write better code faster by providing intelligent code suggestions, automatically detecting security vulnerabilities, and suggesting remediation steps.

Enhanced dependency scanning now includes more comprehensive vulnerability databases, providing better coverage for open-source dependencies across various programming languages.

The pipeline improvements include better support for parallel job execution, reducing overall CI/CD time for complex projects.`,
    category: "CI/CD",
    tags: ["GitLab", "AI", "Security", "CI/CD"],
    status: "published"
  },
  {
    title: "Ansible 2.16: Major Automation Framework Updates",
    content: `Red Hat has released Ansible 2.16 with significant updates to the automation framework, making it more powerful and easier to use for DevOps teams.

Key updates in Ansible 2.16:
- Improved performance for large-scale automation
- New modules for cloud and container orchestration
- Better error handling and debugging
- Enhanced collection management
- Improved Windows support

The performance improvements make Ansible faster when managing thousands of nodes, which is crucial for large enterprise environments.

New modules for Kubernetes, Docker, and major cloud providers make it easier to automate infrastructure provisioning and management across hybrid environments.

The improved error handling provides more actionable error messages, helping operators quickly identify and fix issues in their playbooks.`,
    category: "DevOps",
    tags: ["Ansible", "Automation", "Configuration Management"],
    status: "published"
  },
  {
    title: "Prometheus 2.48: Advanced Monitoring and Alerting Features",
    content: `The Prometheus monitoring system has been updated to version 2.48 with advanced features for modern observability needs.

New features in Prometheus 2.48:
- Improved query performance for complex metrics
- New recording rules for better data aggregation
- Enhanced alert management with silencing features
- Better integration with Grafana and other visualization tools
- Improved remote write performance

The query performance improvements make it faster to run complex queries across large metric sets, which is essential for organizations with extensive monitoring requirements.

New recording rules allow teams to pre-compute expensive queries, improving dashboard performance and reducing load on the Prometheus server.

The enhanced alert management includes features for silencing alerts during maintenance windows and better alert grouping to reduce alert fatigue.`,
    category: "DevOps",
    tags: ["Prometheus", "Monitoring", "Observability", "Alerting"],
    status: "published"
  },
  {
    title: "ArgoCD 2.8: GitOps at Scale with New Features",
    content: `ArgoCD 2.8 has been released with features that make GitOps easier to implement at scale in enterprise environments.

What's new in ArgoCD 2.8:
- Improved application management with better UI
- Enhanced multi-cluster support
- New policy engine for deployment governance
- Better integration with service meshes
- Improved performance for large application sets

The new UI provides better visibility into application status and makes it easier to manage complex application dependencies across multiple clusters.

The policy engine allows organizations to define deployment policies that ensure compliance and governance requirements are met before changes are applied to production.

Multi-cluster support has been enhanced with better credential management and improved synchronization across clusters, making it easier to manage GitOps across hybrid environments.`,
    category: "Kubernetes",
    tags: ["ArgoCD", "GitOps", "Kubernetes", "Multi-Cluster"],
    status: "published",
    isFeatured: true
  },
  {
    title: "Jenkins 2.440: Modern CI/CD with Cloud Native Support",
    content: `Jenkins 2.440 brings modern features to the classic CI/CD tool, including better cloud-native support and improved plugin ecosystem.

Key improvements in Jenkins 2.440:
- Better Kubernetes integration for cloud-native pipelines
- Improved plugin management with automatic updates
- Enhanced security with credential handling improvements
- Better performance for large-scale installations
- New UI improvements for better user experience

The Kubernetes integration now includes better support for Kubernetes agents, making it easier to run Jenkins in cloud-native environments and scale CI/CD capacity dynamically.

Plugin management has been improved with automatic dependency resolution and security scanning, ensuring that plugins are kept up-to-date and secure.

The security improvements include better credential encryption and more granular access control for sensitive operations.`,
    category: "CI/CD",
    tags: ["Jenkins", "CI/CD", "Kubernetes", "Security"],
    status: "published"
  }
];

async function seedBlogs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mernapp', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find or create a default user for blog author
    let user = await User.findOne({ email: 'admin@devops.com' });
    if (!user) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      user = new User({
        username: 'DevOps Admin',
        email: 'admin@devops.com',
        password: hashedPassword,
        role: 'admin'
      });
      await user.save();
      console.log('Created default admin user');
    }

    // Clear existing blogs (optional - remove if you want to keep existing blogs)
    // await Blog.deleteMany({});
    // console.log('Cleared existing blogs');

    // Create blogs
    for (const blogData of devOpsBlogs) {
      const blog = new Blog({
        ...blogData,
        author: user._id,
        authorName: user.username,
        authorAvatar: user.avatar
      });
      await blog.save();
      console.log(`Created blog: ${blog.title}`);
    }

    console.log('Successfully seeded 10 DevOps blogs');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding blogs:', error);
    process.exit(1);
  }
}

seedBlogs();
