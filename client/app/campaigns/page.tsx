'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit, Megaphone, Link2, MousePointerClick, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'

// Schema de validação com Zod
const campaignFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  startDate: z
    .string()
    .min(1, 'Data de início é obrigatória')
    .refine(
      (date) => {
        const startDate = new Date(date)
        return !isNaN(startDate.getTime())
      },
      {
        message: 'Data de início inválida',
      }
    ),
  endDate: z
    .string()
    .optional(),
  clientId: z.string().optional(),
}).refine(
  (data) => {
    if (!data.endDate || data.endDate.trim() === '') return true
    const endDate = new Date(data.endDate)
    const startDate = new Date(data.startDate)
    return endDate >= startDate
  },
  {
    message: 'Data de fim deve ser posterior à data de início',
    path: ['endDate'],
  }
)

type CampaignFormValues = z.infer<typeof campaignFormSchema>

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // Formulário com react-hook-form
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      clientId: '',
    },
  })

  const fetchCampaigns = useCallback(async (page: number = pagination.page) => {
    try {
      setLoading(true)
      const response = await api.get(`/campaigns?page=${page}&limit=${pagination.limit}`)
      setCampaigns(response.data.campaigns)
      if (response.data.pagination) {
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.limit])

  const fetchClients = useCallback(async () => {
    try {
      const response = await api.get('/clients?limit=100')
      setClients(response.data.clients || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchCampaigns()
    fetchClients()
  }, [router, fetchCampaigns, fetchClients])

  const onSubmit = async (data: CampaignFormValues) => {
    try {
      const dataToSend: any = {
        name: data.name,
        startDate: data.startDate,
        description: data.description || undefined,
        endDate: data.endDate || undefined,
        clientId: data.clientId && data.clientId !== 'none' ? data.clientId : undefined,
      }

      if (editingCampaign) {
        await api.put(`/campaigns/${editingCampaign.id}`, dataToSend)
        toast.success('Campanha atualizada com sucesso!')
      } else {
        await api.post('/campaigns', dataToSend)
        toast.success('Campanha criada com sucesso!')
      }
      setShowModal(false)
      setEditingCampaign(null)
      form.reset()
      fetchCampaigns(1)
    } catch (error: any) {
      console.error('Error saving campaign:', error)
      
      if (error.response?.status === 400 && error.response?.data?.errors) {
        const serverErrors: Record<string, { message: string }> = {}
        
        if (Array.isArray(error.response.data.errors)) {
          error.response.data.errors.forEach((err: any) => {
            const field = err.param || err.path || 'root'
            serverErrors[field] = { message: err.msg || err.message || 'Erro de validação' }
          })
        }

        Object.keys(serverErrors).forEach((field) => {
          form.setError(field as any, {
            type: 'server',
            message: serverErrors[field].message,
          })
        })

        const errorMessages = Object.values(serverErrors).map(e => e.message).join(', ')
        toast.error(`Erro de validação: ${errorMessages}`)
      } else {
        const errorMessage = error.response?.data?.error || error.message || 'Erro ao salvar campanha'
        toast.error(errorMessage)
        form.setError('root', {
          type: 'server',
          message: errorMessage,
        })
      }
    }
  }

  const handleEdit = (campaign: any) => {
    setEditingCampaign(campaign)
    form.reset({
      name: campaign.name,
      description: campaign.description || '',
      startDate: new Date(campaign.startDate).toISOString().split('T')[0],
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
      clientId: campaign.clientId || 'none',
    })
    setShowModal(true)
  }

  const handleDeleteClick = (id: string) => {
    setCampaignToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!campaignToDelete) return

    try {
      await api.delete(`/campaigns/${campaignToDelete}`)
      toast.success('Campanha excluída com sucesso!')
      setDeleteDialogOpen(false)
      setCampaignToDelete(null)
      if (campaigns.length === 1 && pagination.page > 1) {
        fetchCampaigns(pagination.page - 1)
      } else {
        fetchCampaigns(pagination.page)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao excluir campanha')
      setDeleteDialogOpen(false)
      setCampaignToDelete(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const isActive = (startDate: string, endDate?: string | null) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : null
    
    if (now < start) return 'upcoming'
    if (end && now > end) return 'ended'
    return 'active'
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Campanhas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas campanhas e acompanhe o desempenho
            </p>
          </div>
          <Button onClick={() => {
            setEditingCampaign(null)
            form.reset({
              name: '',
              description: '',
              startDate: new Date().toISOString().split('T')[0],
              endDate: '',
              clientId: '',
            })
            setShowModal(true)
          }}>
            <Plus size={20} className="mr-2" />
            Nova Campanha
          </Button>
        </div>

        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Megaphone className="mx-auto mb-4 text-muted-foreground" size={48} />
              <p className="text-muted-foreground mb-4">Você ainda não tem campanhas criadas</p>
              <Button onClick={() => {
                setEditingCampaign(null)
                form.reset({
                  name: '',
                  description: '',
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: '',
                  clientId: '',
                })
                setShowModal(true)
              }}>
                Criar Primeira Campanha
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Campanhas</p>
                      <p className="text-2xl font-bold text-foreground">{pagination.total || campaigns.length}</p>
                    </div>
                    <Megaphone className="text-primary" size={32} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Links</p>
                      <p className="text-2xl font-bold text-foreground">
                        {campaigns.reduce((sum, campaign) => sum + (campaign.linkCount || 0), 0)}
                      </p>
                    </div>
                    <Link2 className="text-primary" size={32} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Cliques</p>
                      <p className="text-2xl font-bold text-foreground">
                        {campaigns.reduce((sum, campaign) => sum + (campaign.totalClicks || 0), 0)}
                      </p>
                    </div>
                    <MousePointerClick className="text-primary" size={32} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nome</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Período</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Links</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Cliques</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {campaigns.map((campaign) => {
                        const status = isActive(campaign.startDate, campaign.endDate)
                        const statusConfig = {
                          active: { label: 'Ativa', className: 'bg-green-500/20 text-green-400' },
                          upcoming: { label: 'Futura', className: 'bg-blue-500/20 text-blue-400' },
                          ended: { label: 'Encerrada', className: 'bg-gray-500/20 text-gray-400' },
                        }[status]

                        return (
                          <tr key={campaign.id} className="hover:bg-accent/50">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-foreground">{campaign.name}</p>
                                {campaign.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                    {campaign.description}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-foreground">
                              {campaign.client?.name || '-'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-1 text-sm text-foreground">
                                <Calendar size={14} className="text-muted-foreground" />
                                <span>{formatDate(campaign.startDate)}</span>
                                {campaign.endDate && (
                                  <>
                                    <span className="text-muted-foreground">-</span>
                                    <span>{formatDate(campaign.endDate)}</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 ${statusConfig.className} rounded text-xs font-medium`}>
                                {statusConfig.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-1 text-foreground">
                                <Link2 size={16} className="text-muted-foreground" />
                                <span>{campaign.linkCount || 0}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-1 text-foreground">
                                <MousePointerClick size={16} className="text-muted-foreground" />
                                <span>{campaign.totalClicks || 0}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(campaign)}
                                  title="Editar"
                                  className="h-8 w-8"
                                >
                                  <Edit size={18} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(campaign.id)}
                                  title="Excluir"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 size={18} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Paginação */}
                {pagination.total > 0 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} campanhas
                    </div>
                    {pagination.totalPages > 1 ? (
                      <ButtonGroup>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchCampaigns(pagination.page - 1)}
                          disabled={!pagination.hasPrev || loading}
                        >
                          <ChevronLeft size={16} className="mr-1" />
                          Anterior
                        </Button>
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum: number
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1
                          } else if (pagination.page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i
                          } else {
                            pageNum = pagination.page - 2 + i
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={pagination.page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => fetchCampaigns(pageNum)}
                              disabled={loading}
                              className="min-w-[40px]"
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchCampaigns(pagination.page + 1)}
                          disabled={!pagination.hasNext || loading}
                        >
                          Próxima
                          <ChevronRight size={16} className="ml-1" />
                        </Button>
                      </ButtonGroup>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Página 1 de 1
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Create/Edit Campaign Modal */}
        <Dialog
          open={showModal}
          onOpenChange={(open) => {
            setShowModal(open)
            if (!open) {
              setEditingCampaign(null)
              form.reset()
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}</DialogTitle>
              <DialogDescription>
                {editingCampaign
                  ? 'Atualize as informações da campanha'
                  : 'Crie uma nova campanha para organizar seus links e medir o desempenho'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {form.formState.errors.root && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                    <FormMessage>{form.formState.errors.root.message}</FormMessage>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome da campanha"
                            {...field}
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
                          onValueChange={field.onChange}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhum cliente</SelectItem>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Cliente associado à campanha (opcional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrição da campanha..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Descrição opcional da campanha
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <FormLabel>Data de Fim</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Data de término da campanha (opcional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false)
                      setEditingCampaign(null)
                      form.reset()
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting
                      ? editingCampaign
                        ? 'Atualizando...'
                        : 'Criando...'
                      : editingCampaign
                        ? 'Atualizar'
                        : 'Criar'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.
                Todos os links associados a esta campanha serão mantidos, mas não estarão mais vinculados à campanha.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCampaignToDelete(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  )
}
