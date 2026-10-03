import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout/Layout'
const Login = lazy(() => import('./pages/Auth/Login'))
const Register = lazy(() => import('./pages/Auth/Register'))
const VerifyEmail = lazy(() => import('./pages/Auth/VerifyEmail'))
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'))
const Landing = lazy(() => import('./pages/Landing/Landing'))
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'))
const Generator = lazy(() => import('./pages/Generator/Generator'))
const History = lazy(() => import('./pages/History/History'))
const Bundle = lazy(() => import('./pages/Bundle/Bundle'))
const LearnHub = lazy(() => import('./pages/Learn/LearnHub'))
const GuideView = lazy(() => import('./pages/Learn/GuideView'))
import PublicPage from './components/Learn/PublicPage'
const Security = lazy(() => import('./pages/Security/Security'))
const Billing = lazy(() => import('./pages/Billing/Billing'))
const Invoice = lazy(() => import('./pages/Billing/Invoice'))
const Help = lazy(() => import('./pages/Help/Help'))
const Toolbox = lazy(() => import('./pages/Toolbox/Toolbox'))
const Validator = lazy(() => import('./pages/Validator/Validator'))
const DevOpsDocs = lazy(() => import('./pages/DevOpsDocs/DevOpsDocs'))
const DevOpsDocDetail = lazy(() => import('./pages/DevOpsDocs/DevOpsDocDetail'))
const Roadmap = lazy(() => import('./pages/Roadmap/Roadmap'))
const ResourceDetail = lazy(() => import('./pages/ResourceDetail/ResourceDetail'))
const Admin = lazy(() => import('./pages/Admin/Admin'))
const GitHubIntegration = lazy(() => import('./pages/GitHub/GitHubIntegration'))
const Vision = lazy(() => import('./pages/Vision/Vision'))
const VisionSuccess = lazy(() => import('./pages/Vision/VisionSuccess'))
const Deployments = lazy(() => import('./pages/Deployments/Deployments'))
const Payment = lazy(() => import('./pages/Payment/Payment'))
const PaymentStatus = lazy(() => import('./pages/Payment/PaymentStatus'))
const AdminShell = lazy(() => import('./pages/Admin/AdminShell'))
const AdminOverview = lazy(() => import('./pages/Admin/AdminOverview'))
const AdminUsers = lazy(() => import('./pages/Admin/AdminUsers'))
const AdminMessages = lazy(() => import('./pages/Admin/AdminMessages'))
const AdminAudit = lazy(() => import('./pages/Admin/AdminAudit'))
const AdminPayments = lazy(() => import('./pages/Admin/AdminPayments'))
const Contact = lazy(() => import('./pages/Contact/Contact'))
const CloudCostAnalysis = lazy(() => import('./components/CloudCostAnalysis'))
const Features = lazy(() => import('./pages/Features/Features'))
const Pricing = lazy(() => import('./pages/Pricing/Pricing'))
const About = lazy(() => import('./pages/About/About'))
const Chat = lazy(() => import('./pages/Chat/Chat'))
const BlogList = lazy(() => import('./pages/Blog/BlogList'))
const CreateBlog = lazy(() => import('./pages/Blog/CreateBlog'))
const BlogDetail = lazy(() => import('./pages/Blog/BlogDetail'))
const EditBlog = lazy(() => import('./pages/Blog/EditBlog'))
const MyBlogs = lazy(() => import('./pages/Blog/MyBlogs'))
import LoadingSpinner from './components/UI/LoadingSpinner'

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
)

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/about" element={<About />} />
        <Route path="/learn" element={<PublicPage><LearnHub /></PublicPage>} />
        <Route path="/learn/:slug" element={<PublicPage><GuideView /></PublicPage>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="chat" element={<Chat />} />
        <Route path="generator/:type" element={<Generator />} />
        <Route path="devops-docs" element={<DevOpsDocs />} />
        <Route path="devops-docs/:id" element={<DevOpsDocDetail />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="resources/:type/:id" element={<ResourceDetail />} />
        {/* Admin area: only role "admin" gets in; everyone else is sent to their dashboard */}
        <Route path="admin" element={user.role === 'admin' ? <AdminShell /> : <Navigate to="/dashboard" replace />}>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="content" element={<Admin />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="audit" element={<AdminAudit />} />
        </Route>
        <Route path="learn" element={<LearnHub />} />
        <Route path="learn/:slug" element={<GuideView />} />
        <Route path="help" element={<Help />} />
        <Route path="security" element={<Security />} />
        <Route path="billing" element={<Billing />} />
        <Route path="billing/invoice/:id" element={<Invoice />} />
        <Route path="bundle" element={<Bundle />} />
        <Route path="toolbox" element={<Toolbox />} />
        <Route path="validator" element={<Validator />} />
        <Route path="history" element={<History />} />
        <Route path="github" element={<GitHubIntegration />} />
        <Route path="vision" element={<Vision />} />
        <Route path="vision/success" element={<VisionSuccess />} />
        <Route path="deployments" element={<Deployments />} />
        <Route path="payment" element={<Payment />} />
        <Route path="payment/status" element={<PaymentStatus />} />
        <Route path="blogs" element={<BlogList />} />
        <Route path="blogs/create" element={<CreateBlog />} />
        <Route path="blogs/:id" element={<BlogDetail />} />
        <Route path="blogs/:id/edit" element={<EditBlog />} />
        <Route path="blogs/my-blogs" element={<MyBlogs />} />
        <Route path="cloud-cost-analysis" element={<CloudCostAnalysis />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
    </Suspense>
  )
}

export default App
