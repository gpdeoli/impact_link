'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { Link2, MousePointerClick, TrendingUp, Activity, Globe } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import dynamic from 'next/dynamic'

// Importar GeoHeatmap dinamicamente sem SSR para evitar problemas de renderização
const GeoHeatmap = dynamic(() => import('@/components/GeoHeatmap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-muted-foreground">Carregando mapa...</div>
    </div>
  )
})

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
      console.log(response.data.clicksByCountry)
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
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </Layout>
    )
  }

  if (!data) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum dado disponível ainda. Crie seu primeiro link!</p>
        </div>
      </Layout>
    )
  }

  // Format daily clicks for chart
  const dailyClicksData = Object.entries(data.dailyClicks || {}).map(([date, clicks]) => ({
    date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    cliques: clicks
  }))

  // Função para obter classes de cor baseadas no tipo de link
  const getLinkTypeStyles = (linkType: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      BIO: {
        bg: 'bg-blue-500/20',
        text: 'text-blue-400'
      },
      STORY: {
        bg: 'bg-purple-500/20',
        text: 'text-purple-400'
      },
      DIRECT: {
        bg: 'bg-green-500/20',
        text: 'text-green-400'
      },
      CAMPANHA: {
        bg: 'bg-orange-500/20',
        text: 'text-orange-400'
      },
      PRODUTO: {
        bg: 'bg-pink-500/20',
        text: 'text-pink-400'
      },
      OTHER: {
        bg: 'bg-gray-500/20',
        text: 'text-gray-400'
      }
    }
    return styles[linkType] || styles.OTHER
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Cliques</p>
                  <p className="text-2xl font-bold text-foreground">{data.overview.totalClicks}</p>
                </div>
                <MousePointerClick className="text-primary" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Links</p>
                  <p className="text-2xl font-bold text-foreground">{data.overview.totalLinks}</p>
                </div>
                <Link2 className="text-primary" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Links Ativos</p>
                  <p className="text-2xl font-bold text-foreground">{data.overview.activeLinks}</p>
                </div>
                <Activity className="text-primary" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Crescimento</p>
                  <p className="text-2xl font-bold text-foreground">
                    {data.overview.clickGrowth}%
                  </p>
                </div>
                <TrendingUp className="text-primary" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        {data.insights && data.insights.length > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle>Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {data.insights.map((insight: any, index: number) => (
                  <li key={index} className="text-foreground">
                    • {insight.message}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cliques ao Longo do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyClicksData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyClicksData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="cliques" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-12">Nenhum dado disponível</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cliques por Tipo de Link</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(data.clicksByType || {}).length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(data.clicksByType).map(([type, clicks]) => ({ type, cliques: clicks }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="type" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="cliques" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-12">Nenhum dado disponível</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Geographic Heatmap */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Globe className="text-primary" size={20} />
              <CardTitle>Distribuição Geográfica de Acessos</CardTitle>
            </div>
            <CardDescription>
              Visualização de cliques por país ao redor do mundo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.clicksByCountry && Object.keys(data.clicksByCountry).length > 0 ? (
              <>
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mb-4 p-2 bg-muted rounded text-xs text-muted-foreground">
                    <p>Países com dados: {Object.keys(data.clicksByCountry).length}</p>
                    <p>Dados: {JSON.stringify(data.clicksByCountry)}</p>
                  </div>
                )}
                <div className="w-full h-[500px] rounded-lg overflow-hidden border border-border bg-background">
                  <GeoHeatmap data={data.clicksByCountry} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-center">
                <Globe className="text-muted-foreground mb-4" size={48} />
                <p className="text-muted-foreground">
                  Nenhum dado geográfico disponível ainda
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Os dados de localização serão exibidos conforme os links forem acessados
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Links */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Links</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topLinks && data.topLinks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-4 text-muted-foreground">Link</th>
                      <th className="text-left py-2 px-4 text-muted-foreground">Título</th>
                      <th className="text-left py-2 px-4 text-muted-foreground">Tipo</th>
                      <th className="text-right py-2 px-4 text-muted-foreground">Cliques</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topLinks.map((link: any, index: number) => (
                      <tr key={link.id} className="border-b border-border hover:bg-accent/50">
                        <td className="py-2 px-4 font-mono text-sm text-foreground">{link.shortCode}</td>
                        <td className="py-2 px-4 text-foreground">{link.title || 'Sem título'}</td>
                        <td className="py-2 px-4">
                          {(() => {
                            const styles = getLinkTypeStyles(link.linkType)
                            return (
                              <span className={`px-2 py-1 ${styles.bg} ${styles.text} rounded text-sm font-medium`}>
                                {link.linkType}
                              </span>
                            )
                          })()}
                        </td>
                        <td className="py-2 px-4 text-right font-semibold text-foreground">{link.clicks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhum link ainda</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

