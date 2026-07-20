import { useState, useEffect } from 'react'
import api from '../services/api'

interface DashboardStats {
  totalFiles: number
  filesByType: Record<string, number>
  recentFiles: Array<{
    name: string
    type: string
    createdAt: string
  }>
  totalDownloads: number
}

interface UseDashboardStatsReturn {
  stats: DashboardStats | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export const useDashboardStats = (): UseDashboardStatsReturn => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/history/stats/overview')
      
      if (response.data.success) {
        setStats(response.data.data)
      } else {
        setError('Failed to fetch statistics')
      }
    } catch (err) {
      setError('Failed to fetch statistics')
      console.error('Dashboard stats error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}
