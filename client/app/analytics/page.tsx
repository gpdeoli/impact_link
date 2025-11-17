'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { 
  MousePointerClick, 
  TrendingUp, 
  Globe, 
  Monitor, 
  Smartphone, 
  Tablet,
  MapPin,
  ExternalLink,
  Calendar,
  Filter
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
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
  ResponsiveContainer 
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4']

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    clientId: '',
    campaignId: ''
  })

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.clientId) params.append('clientId', filters.clientId)
      if (filters.campaignId) params.append('campaignId', filters.campaignId)

      const response = await api.get(`/analytics/dashboard?${params.toString()}`)
      setData(response.data)

      // Debug: log dos dados recebidos
      console.log('Analytics data received:', response.data)
      console.log('dailyClicks:', response.data.dailyClicks)
      console.log('clicksByType:', response.data.clicksByType)
      console.log('clicksByDevice:', response.data.clicksByDevice)
      console.log('topReferrers:', response.data.topReferrers)
      console.log('clicksByCountry:', response.data.clicksByCountry)
      console.log('topLinks:', response.data.topLinks)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchAnalytics()
  }, [router, fetchAnalytics])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const getBrowserIcon = (browser: string) => {
    return <Monitor size={16} />
  }

  const getDeviceIcon = (device: string) => {
    const normalized = device.toLowerCase()
    if (normalized === 'mobile') return <Smartphone size={16} />
    if (normalized === 'tablet') return <Tablet size={16} />
    return <Monitor size={16} />
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
          <p className="text-muted-foreground">Nenhum dado disponível ainda.</p>
        </div>
      </Layout>
    )
  }

  // Format daily clicks for chart
  const dailyClicksData = Object.entries(data.dailyClicks || {}).map(([date, clicks]) => ({
    date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    cliques: clicks
  }))

  // Format clicks by type for pie chart
  const clicksByTypeData = Object.entries(data.clicksByType || {}).map(([type, clicks]) => ({
    name: type,
    value: clicks
  }))

  // Format clicks by device
  const clicksByDeviceData = (data.clicksByDevice || []).map((item: any) => ({
    device: item.device,
    count: item.count
  }))

  // Format top referrers
  const topReferrersData = (data.topReferrers || []).slice(0, 10)

  // Verificar se há dados
  const hasClicks = data.overview?.totalClicks > 0
  const hasDailyData = dailyClicksData.length > 0
  const hasTypeData = clicksByTypeData.length > 0
  const hasDeviceData = clicksByDeviceData.length > 0
  const hasReferrerData = topReferrersData.length > 0
  const hasCountryData = data.clicksByCountry && Object.keys(data.clicksByCountry).length > 0
  const hasTopLinks = data.topLinks && data.topLinks.length > 0

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Análises detalhadas do seu tráfego e performance
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Filter className="text-primary" size={20} />
              <CardTitle>Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientId">Cliente</Label>
                <Select
                  value={filters.clientId || "all"}
                  onValueChange={(value) => handleFilterChange('clientId', value === "all" ? '' : value)}
                >
                  <SelectTrigger id="clientId">
                    <SelectValue placeholder="Todos os clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os clientes</SelectItem>
                    {/* Add client options here */}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaignId">Campanha</Label>
                <Select
                  value={filters.campaignId || "all"}
                  onValueChange={(value) => handleFilterChange('campaignId', value === "all" ? '' : value)}
                >
                  <SelectTrigger id="campaignId">
                    <SelectValue placeholder="Todas as campanhas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as campanhas</SelectItem>
                    {/* Add campaign options here */}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

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
                <TrendingUp className="text-primary" size={32} />
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
                <Monitor className="text-primary" size={32} />
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

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cliques ao Longo do Tempo</CardTitle>
              <CardDescription>Evolução diária de cliques no período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              {hasDailyData ? (
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
                    <Line 
                      type="monotone" 
                      dataKey="cliques" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground mb-2">Nenhum dado disponível</p>
                  <p className="text-sm text-muted-foreground">
                    {hasClicks 
                      ? 'Não há cliques no período selecionado. Tente ajustar as datas dos filtros.'
                      : 'Ainda não há cliques registrados. Acesse seus links para começar a coletar dados.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cliques por Tipo de Link</CardTitle>
              <CardDescription>Distribuição de cliques por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              {hasTypeData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={clicksByTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {clicksByTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground mb-2">Nenhum dado disponível</p>
                  <p className="text-sm text-muted-foreground">
                    {hasClicks 
                      ? 'Não há cliques categorizados por tipo no período selecionado.'
                      : 'Crie links e aguarde cliques para ver a distribuição por tipo.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cliques por Dispositivo</CardTitle>
              <CardDescription>Distribuição de acessos por tipo de dispositivo</CardDescription>
            </CardHeader>
            <CardContent>
              {hasDeviceData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={clicksByDeviceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="device" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground mb-2">Nenhum dado disponível</p>
                  <p className="text-sm text-muted-foreground">
                    {hasClicks 
                      ? 'Não há dados de dispositivo no período selecionado.'
                      : 'Os dados de dispositivo serão coletados quando os links forem acessados.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 Fontes de Tráfego</CardTitle>
              <CardDescription>Principais referrers que geram cliques</CardDescription>
            </CardHeader>
            <CardContent>
              {hasReferrerData ? (
                <div className="space-y-3">
                  {topReferrersData.map((referrer: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex items-center space-x-2">
                          <ExternalLink size={16} className="text-muted-foreground" />
                          <span className="text-sm text-foreground truncate max-w-xs">
                            {referrer.referrer === 'Direct' ? 'Acesso Direto' : referrer.referrer}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{referrer.count}</p>
                        <p className="text-xs text-muted-foreground">cliques</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground mb-2">Nenhum dado disponível</p>
                  <p className="text-sm text-muted-foreground">
                    {hasClicks 
                      ? 'Não há dados de referrer no período selecionado. A maioria dos acessos pode ser direta.'
                      : 'Os dados de referrer serão coletados quando os links forem acessados através de outros sites.'}
                  </p>
                </div>
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
            {hasCountryData ? (
              <div className="w-full h-[500px] rounded-lg overflow-hidden border border-border bg-background">
                <GeoHeatmap data={data.clicksByCountry} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-center">
                <Globe className="text-muted-foreground mb-4" size={48} />
                <p className="text-muted-foreground mb-2">
                  Nenhum dado geográfico disponível
                </p>
                <p className="text-sm text-muted-foreground">
                  {hasClicks 
                    ? 'Não há dados de localização no período selecionado. Os dados geográficos são coletados apenas de IPs públicos.'
                    : 'Os dados de localização serão exibidos quando os links forem acessados de IPs públicos (não localhost).'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Links Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Links</CardTitle>
            <CardDescription>Links com maior número de cliques no período</CardDescription>
          </CardHeader>
          <CardContent>
            {hasTopLinks ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-4 text-muted-foreground">#</th>
                      <th className="text-left py-2 px-4 text-muted-foreground">Link</th>
                      <th className="text-left py-2 px-4 text-muted-foreground">Título</th>
                      <th className="text-left py-2 px-4 text-muted-foreground">Tipo</th>
                      <th className="text-right py-2 px-4 text-muted-foreground">Cliques</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topLinks.map((link: any, index: number) => {
                      const styles: Record<string, { bg: string; text: string }> = {
                        BIO: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
                        STORY: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
                        DIRECT: { bg: 'bg-green-500/20', text: 'text-green-400' },
                        CAMPANHA: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
                        PRODUTO: { bg: 'bg-pink-500/20', text: 'text-pink-400' },
                        OTHER: { bg: 'bg-gray-500/20', text: 'text-gray-400' }
                      }
                      const linkStyles = styles[link.linkType] || styles.OTHER
                      
                      return (
                        <tr key={link.id} className="border-b border-border hover:bg-accent/50">
                          <td className="py-2 px-4 text-muted-foreground">{index + 1}</td>
                          <td className="py-2 px-4 font-mono text-sm text-foreground">{link.shortCode}</td>
                          <td className="py-2 px-4 text-foreground">{link.title || 'Sem título'}</td>
                          <td className="py-2 px-4">
                            <span className={`px-2 py-1 ${linkStyles.bg} ${linkStyles.text} rounded text-sm font-medium`}>
                              {link.linkType}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-right font-semibold text-foreground">{link.clicks}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground mb-2">Nenhum link ainda</p>
                <p className="text-sm text-muted-foreground">
                  {data.overview?.totalLinks > 0
                    ? 'Não há links com cliques no período selecionado. Tente ajustar as datas dos filtros.'
                    : 'Crie seus primeiros links para começar a coletar dados de analytics.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
