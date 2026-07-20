import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout/Layout'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import Landing from './pages/Landing/Landing'
import Dashboard from './pages/Dashboard/Dashboard'
import Generator from './pages/Generator/Generator'
import History from './pages/History/History'
import TerraformDemos from './pages/TerraformDemos/TerraformDemos'
import Validator from './pages/Validator/Validator'
import DevOpsDocs from './pages/DevOpsDocs/DevOpsDocs'
import DevOpsDocDetail from './pages/DevOpsDocs/DevOpsDocDetail'
import Roadmap from './pages/Roadmap/Roadmap'
import ResourceDetail from './pages/ResourceDetail/ResourceDetail'
import Admin from './pages/Admin/Admin'
import GitHubIntegration from './pages/GitHub/GitHubIntegration'
import Vision from './pages/Vision/Vision'
import VisionSuccess from './pages/Vision/VisionSuccess'
import Deployments from './pages/Deployments/Deployments'
import LoadingSpinner from './components/UI/LoadingSpinner'

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
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="generator/:type" element={<Generator />} />
        <Route path="devops-docs" element={<DevOpsDocs />} />
        <Route path="devops-docs/:id" element={<DevOpsDocDetail />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="resources/:type/:id" element={<ResourceDetail />} />
        <Route path="admin" element={<Admin />} />
        <Route path="terraform-demos" element={<TerraformDemos />} />
        <Route path="validator" element={<Validator />} />
        <Route path="history" element={<History />} />
        <Route path="github" element={<GitHubIntegration />} />
        <Route path="vision" element={<Vision />} />
        <Route path="vision/success" element={<VisionSuccess />} />
        <Route path="deployments" element={<Deployments />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default App
