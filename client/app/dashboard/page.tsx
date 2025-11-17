'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { Link2, MousePointerClick, TrendingUp, Activity } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchDashboardData()
  }, [router])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/analytics/dashboard')
      setData(response.data)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </Layout>
    )
  }

  if (!data) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum dado disponível ainda. Crie seu primeiro link!</p>
        </div>
      </Layout>
    )
  }

  // Format daily clicks for chart
  const dailyClicksData = Object.entries(data.dailyClicks || {}).map(([date, clicks]) => ({
    date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    cliques: clicks
  }))

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Cliques</p>
                <p className="text-2xl font-bold text-gray-900">{data.overview.totalClicks}</p>
              </div>
              <MousePointerClick className="text-primary-600" size={32} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Links</p>
                <p className="text-2xl font-bold text-gray-900">{data.overview.totalLinks}</p>
              </div>
              <Link2 className="text-primary-600" size={32} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Links Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{data.overview.activeLinks}</p>
              </div>
              <Activity className="text-primary-600" size={32} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Crescimento</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.overview.clickGrowth}%
                </p>
              </div>
              <TrendingUp className="text-primary-600" size={32} />
            </div>
          </div>
        </div>

        {/* Insights */}
        {data.insights && data.insights.length > 0 && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <h2 className="font-semibold text-primary-900 mb-2">Insights</h2>
            <ul className="space-y-1">
              {data.insights.map((insight: any, index: number) => (
                <li key={index} className="text-primary-800">
                  • {insight.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Cliques ao Longo do Tempo</h2>
            {dailyClicksData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyClicksData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cliques" stroke="#0ea5e9" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-12">Nenhum dado disponível</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Cliques por Tipo de Link</h2>
            {Object.keys(data.clicksByType || {}).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(data.clicksByType).map(([type, clicks]) => ({ type, cliques: clicks }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cliques" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-12">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        {/* Top Links */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Top 10 Links</h2>
          {data.topLinks && data.topLinks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Link</th>
                    <th className="text-left py-2 px-4">Título</th>
                    <th className="text-left py-2 px-4">Tipo</th>
                    <th className="text-right py-2 px-4">Cliques</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topLinks.map((link: any, index: number) => (
                    <tr key={link.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 font-mono text-sm">{link.shortCode}</td>
                      <td className="py-2 px-4">{link.title || 'Sem título'}</td>
                      <td className="py-2 px-4">
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-sm">
                          {link.linkType}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right font-semibold">{link.clicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Nenhum link ainda</p>
          )}
        </div>
      </div>
    </Layout>
  )
}

