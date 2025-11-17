'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit, Users, Link2, MousePointerClick, Megaphone, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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

// Schema de validação com Zod
const clientFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z
    .string()
    .optional()
    .refine(
      (email) => {
        if (!email || email.trim() === '') return true
        return z.string().email().safeParse(email).success
      },
      {
        message: 'Email inválido',
      }
    ),
  tags: z.array(z.string()).optional(),
})

type ClientFormValues = z.infer<typeof clientFormSchema>

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<string | null>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // Formulário com react-hook-form
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: '',
      email: '',
      tags: [],
    },
  })

  const fetchClients = useCallback(async (page: number = pagination.page) => {
    try {
      setLoading(true)
      const response = await api.get(`/clients?page=${page}&limit=${pagination.limit}`)
      setClients(response.data.clients)
      if (response.data.pagination) {
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.limit])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // Verificar se o usuário é AGENCY
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      if (user.plan !== 'AGENCY') {
        // Redirecionar se não for AGENCY
        router.push('/dashboard')
        return
      }
    }

    fetchClients()
  }, [router, fetchClients])

  const onSubmit = async (data: ClientFormValues) => {
    try {
      if (editingClient) {
        // Atualizar cliente
        await api.put(`/clients/${editingClient.id}`, data)
        toast.success('Cliente atualizado com sucesso!')
      } else {
        // Criar novo cliente
        await api.post('/clients', data)
        toast.success('Cliente criado com sucesso!')
      }
      setShowModal(false)
      setEditingClient(null)
      form.reset()
      fetchClients(1)
    } catch (error: any) {
      console.error('Error saving client:', error)
      
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
        const errorMessage = error.response?.data?.error || error.message || 'Erro ao salvar cliente'
        toast.error(errorMessage)
        form.setError('root', {
          type: 'server',
          message: errorMessage,
        })
      }
    }
  }

  const handleEdit = (client: any) => {
    setEditingClient(client)
    form.reset({
      name: client.name,
      email: client.email || '',
      tags: client.tags || [],
    })
    setShowModal(true)
  }

  const handleDeleteClick = (id: string) => {
    setClientToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return

    try {
      await api.delete(`/clients/${clientToDelete}`)
      toast.success('Cliente excluído com sucesso!')
      setDeleteDialogOpen(false)
      setClientToDelete(null)
      // Se a página atual ficar vazia após deletar, voltar para página anterior
      if (clients.length === 1 && pagination.page > 1) {
        fetchClients(pagination.page - 1)
      } else {
        fetchClients(pagination.page)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao excluir cliente')
      setDeleteDialogOpen(false)
      setClientToDelete(null)
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus clientes e visualize suas estatísticas
            </p>
          </div>
          <Button onClick={() => {
            setEditingClient(null)
            form.reset()
            setShowModal(true)
          }}>
            <Plus size={20} className="mr-2" />
            Adicionar Cliente
          </Button>
        </div>

        {clients.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="mx-auto mb-4 text-muted-foreground" size={48} />
              <p className="text-muted-foreground mb-4">Você ainda não tem clientes cadastrados</p>
              <Button onClick={() => {
                setEditingClient(null)
                form.reset()
                setShowModal(true)
              }}>
                Adicionar Primeiro Cliente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Clientes</p>
                    <p className="text-2xl font-bold text-foreground">{pagination.total || clients.length}</p>
                  </div>
                  <Users className="text-primary" size={32} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Links</p>
                    <p className="text-2xl font-bold text-foreground">
                      {clients.reduce((sum, client) => sum + (client.linkCount || 0), 0)}
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
                      {clients.reduce((sum, client) => sum + (client.totalClicks || 0), 0)}
                    </p>
                  </div>
                  <MousePointerClick className="text-primary" size={32} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {clients.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tags</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Links</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Campanhas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Cliques</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {clients.map((client) => (
                        <tr key={client.id} className="hover:bg-accent/50">
                          <td className="px-6 py-4 font-medium text-foreground">{client.name}</td>
                          <td className="px-6 py-4 text-muted-foreground">{client.email || '-'}</td>
                          <td className="px-6 py-4">
                            {client.tags && client.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {client.tags.map((tag: string, index: number) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-md"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                          <div className="flex items-center space-x-1 text-foreground">
                            <Link2 size={16} className="text-muted-foreground" />
                            <span>{client.linkCount || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-1 text-foreground">
                            <Megaphone size={16} className="text-muted-foreground" />
                            <span>{client.campaignCount || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-1 text-foreground">
                            <MousePointerClick size={16} className="text-muted-foreground" />
                            <span>{client.totalClicks || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(client)}
                              title="Editar"
                              className="h-8 w-8"
                            >
                              <Edit size={18} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(client.id)}
                              title="Excluir"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 size={18} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Paginação */}
              {pagination.total > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} clientes
                  </div>
                  {pagination.totalPages > 1 ? (
                    <ButtonGroup>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchClients(pagination.page - 1)}
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
                            onClick={() => fetchClients(pageNum)}
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
                        onClick={() => fetchClients(pagination.page + 1)}
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
        )}

        {/* Create/Edit Client Modal */}
        <Dialog
          open={showModal}
          onOpenChange={(open) => {
            setShowModal(open)
            if (!open) {
              setEditingClient(null)
              form.reset()
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClient ? 'Editar Cliente' : 'Adicionar Cliente'}</DialogTitle>
              <DialogDescription>
                {editingClient
                  ? 'Atualize as informações do cliente'
                  : 'Adicione um novo cliente para organizar seus links e campanhas'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {form.formState.errors.root && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                    <FormMessage>{form.formState.errors.root.message}</FormMessage>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nome do cliente"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Nome completo ou razão social do cliente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="cliente@exemplo.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Email de contato do cliente (opcional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-input rounded-md bg-background">
                            {field.value && field.value.length > 0 ? (
                              field.value.map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-primary/20 text-primary rounded-md"
                                >
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newTags = field.value?.filter((_, i) => i !== index) || []
                                      field.onChange(newTags)
                                    }}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X size={14} />
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">Nenhuma tag adicionada</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              ref={tagInputRef}
                              placeholder="Ex: Client:GPlays (pressione Enter)"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  const input = e.currentTarget
                                  const value = input.value.trim()
                                  if (value && !field.value?.includes(value)) {
                                    field.onChange([...(field.value || []), value])
                                    input.value = ''
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                if (tagInputRef.current) {
                                  const value = tagInputRef.current.value.trim()
                                  if (value && !field.value?.includes(value)) {
                                    field.onChange([...(field.value || []), value])
                                    tagInputRef.current.value = ''
                                  }
                                }
                              }}
                            >
                              <Plus size={16} className="mr-1" />
                              Adicionar
                            </Button>
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Adicione tags para organizar seus clientes. Exemplo: &quot;Client:GPlays&quot;, &quot;VIP&quot;, &quot;Premium&quot;, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false)
                      setEditingClient(null)
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
                      ? editingClient
                        ? 'Atualizando...'
                        : 'Criando...'
                      : editingClient
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
                Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
                Todos os links e campanhas associados a este cliente também serão afetados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setClientToDelete(null)}>
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
