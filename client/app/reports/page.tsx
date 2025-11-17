'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { FileText, Download, Calendar, Filter, FileDown, FileSpreadsheet, MousePointerClick, Link2, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

// Schema de validação com Zod
const reportFormSchema = z.object({
  startDate: z
    .string()
    .min(1, 'Data de início é obrigatória'),
  endDate: z
    .string()
    .min(1, 'Data de fim é obrigatória'),
  clientId: z.string().optional(),
  campaignId: z.string().optional(),
}).refine(
  (data) => {
    const endDate = new Date(data.endDate)
    const startDate = new Date(data.startDate)
    return endDate >= startDate
  },
  {
    message: 'Data de fim deve ser posterior à data de início',
    path: ['endDate'],
  }
)

type ReportFormValues = z.infer<typeof reportFormSchema>

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])

  // Formulário com react-hook-form
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      clientId: '',
      campaignId: '',
    },
  })

  const fetchClients = useCallback(async () => {
    try {
      const response = await api.get('/clients?limit=100')
      setClients(response.data.clients || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }, [])

  const fetchCampaigns = useCallback(async () => {
    try {
      const response = await api.get('/campaigns?limit=100')
      setCampaigns(response.data.campaigns || [])
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }, [])

  const loadPreview = useCallback(async () => {
    const values = form.getValues()
    try {
      const params = new URLSearchParams()
      if (values.startDate) params.append('startDate', values.startDate)
      if (values.endDate) params.append('endDate', values.endDate)
      if (values.clientId && values.clientId !== 'none') params.append('clientId', values.clientId)
      if (values.campaignId && values.campaignId !== 'none') params.append('campaignId', values.campaignId)

      const response = await api.get(`/analytics/dashboard?${params.toString()}`)
      setPreviewData(response.data)
    } catch (error) {
      console.error('Error loading preview:', error)
    }
  }, [form])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchClients()
    fetchCampaigns()
    loadPreview()
  }, [router, fetchClients, fetchCampaigns, loadPreview])

  const generatePDF = async () => {
    const values = form.getValues()
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (values.startDate) params.append('startDate', values.startDate)
      if (values.endDate) params.append('endDate', values.endDate)
      if (values.clientId && values.clientId !== 'none') params.append('clientId', values.clientId)
      if (values.campaignId && values.campaignId !== 'none') params.append('campaignId', values.campaignId)

      const response = await api.get(`/reports/pdf?${params.toString()}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `relatorio-impacto-${Date.now()}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Relatório PDF gerado com sucesso!')
    } catch (error: any) {
      console.error('Error generating PDF:', error)
      toast.error(error.response?.data?.error || 'Erro ao gerar relatório PDF')
    } finally {
      setLoading(false)
    }
  }

  const generateCSV = async () => {
    const values = form.getValues()
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (values.startDate) params.append('startDate', values.startDate)
      if (values.endDate) params.append('endDate', values.endDate)
      if (values.clientId && values.clientId !== 'none') params.append('clientId', values.clientId)
      if (values.campaignId && values.campaignId !== 'none') params.append('campaignId', values.campaignId)

      const response = await api.get(`/reports/csv?${params.toString()}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `relatorio-impacto-${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Relatório CSV gerado com sucesso!')
    } catch (error: any) {
      console.error('Error generating CSV:', error)
      toast.error(error.response?.data?.error || 'Erro ao gerar relatório CSV')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = () => {
    loadPreview()
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-1">
            Gere relatórios profissionais em PDF ou CSV com seus dados de impacto
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filtros */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Filter className="text-primary" size={20} />
                <CardTitle>Filtros</CardTitle>
              </div>
              <CardDescription>
                Configure o período e filtros para o relatório
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              handleFilterChange()
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Fim *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              handleFilterChange()
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            handleFilterChange()
                          }}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Todos os clientes" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Todos os clientes</SelectItem>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Filtrar por cliente específico (opcional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="campaignId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campanha</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            handleFilterChange()
                          }}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Todas as campanhas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Todas as campanhas</SelectItem>
                            {campaigns.map((campaign) => (
                              <SelectItem key={campaign.id} value={campaign.id}>
                                {campaign.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Filtrar por campanha específica (opcional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col gap-2 pt-4">
                    <Button
                      type="button"
                      onClick={generatePDF}
                      disabled={loading || !form.formState.isValid}
                      className="w-full"
                    >
                      <FileText size={18} className="mr-2" />
                      Gerar PDF
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateCSV}
                      disabled={loading || !form.formState.isValid}
                      className="w-full"
                    >
                      <FileSpreadsheet size={18} className="mr-2" />
                      Gerar CSV
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="text-primary" size={20} />
                <CardTitle>Pré-visualização</CardTitle>
              </div>
              <CardDescription>
                Resumo dos dados que serão incluídos no relatório
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewData ? (
                <div className="space-y-6">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg border border-border bg-card">
                      <div className="flex items-center space-x-2 mb-2">
                        <MousePointerClick className="text-primary" size={20} />
                        <p className="text-sm text-muted-foreground">Total de Cliques</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {previewData.overview?.totalClicks || 0}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-border bg-card">
                      <div className="flex items-center space-x-2 mb-2">
                        <Link2 className="text-primary" size={20} />
                        <p className="text-sm text-muted-foreground">Total de Links</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {previewData.overview?.totalLinks || 0}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-border bg-card">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="text-primary" size={20} />
                        <p className="text-sm text-muted-foreground">Crescimento</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {previewData.overview?.clickGrowth || '0'}%
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-border bg-card">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="text-primary" size={20} />
                        <p className="text-sm text-muted-foreground">Período</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {form.watch('startDate') && form.watch('endDate')
                          ? `${new Date(form.watch('startDate')).toLocaleDateString('pt-BR')} - ${new Date(form.watch('endDate')).toLocaleDateString('pt-BR')}`
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Top Links Preview */}
                  {previewData.topLinks && previewData.topLinks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Top 10 Links</h3>
                      <div className="space-y-2">
                        {previewData.topLinks.slice(0, 10).map((link: any, index: number) => (
                          <div
                            key={link.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50"
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-semibold text-sm">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">
                                  {link.title || link.shortCode}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {link.shortCode}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="text-sm font-semibold text-foreground">{link.clicks}</p>
                                <p className="text-xs text-muted-foreground">cliques</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!previewData.topLinks || previewData.topLinks.length === 0) && (
                    <div className="text-center py-12">
                      <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
                      <p className="text-muted-foreground">
                        Nenhum dado disponível para o período selecionado
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Carregando pré-visualização...</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Informações sobre os relatórios */}
        <Card>
          <CardHeader>
            <CardTitle>Informações sobre os Relatórios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="text-primary" size={20} />
                  <h3 className="font-semibold text-foreground">Relatório PDF</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                  <li>• Resumo executivo com métricas principais</li>
                  <li>• Top 10 links mais acessados</li>
                  <li>• Período e filtros aplicados</li>
                  <li>• Formato profissional para apresentação</li>
                </ul>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <FileSpreadsheet className="text-primary" size={20} />
                  <h3 className="font-semibold text-foreground">Relatório CSV</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                  <li>• Dados completos de todos os links</li>
                  <li>• Informações de cliques e estatísticas</li>
                  <li>• Formato compatível com Excel/Google Sheets</li>
                  <li>• Ideal para análises detalhadas</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
