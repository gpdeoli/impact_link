'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Copy, ExternalLink, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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

// Schema de validação com Zod
const linkFormSchema = z.object({
  originalUrl: z
    .string()
    .min(1, 'URL original é obrigatória')
    .url('URL inválida. Use o formato: https://example.com')
    .refine(
      (url) => {
        try {
          const parsedUrl = new URL(url)
          return ['http:', 'https:'].includes(parsedUrl.protocol)
        } catch {
          return false
        }
      },
      {
        message: 'URL deve começar com http:// ou https://',
      }
    ),
  title: z.string().optional(),
  description: z.string().optional(),
  linkType: z.enum(['BIO', 'STORY', 'DIRECT', 'CAMPANHA', 'PRODUTO', 'OTHER']),
  tags: z.array(z.string()).optional(),
  expiresAt: z
    .string()
    .optional()
    .refine(
      (date) => {
        if (!date) return true
        const expiryDate = new Date(date)
        const now = new Date()
        return expiryDate > now
      },
      {
        message: 'Data de expiração deve ser no futuro',
      }
    ),
})

type LinkFormValues = z.infer<typeof linkFormSchema>

export default function LinksPage() {
  const router = useRouter()
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null)
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
  const form = useForm<LinkFormValues>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      originalUrl: '',
      title: '',
      description: '',
      linkType: 'OTHER',
      tags: [],
      expiresAt: '',
    },
  })

  const fetchLinks = useCallback(async (page: number = pagination.page) => {
    try {
      setLoading(true)
      const response = await api.get(`/links?page=${page}&limit=${pagination.limit}`)
      setLinks(response.data.links)
      if (response.data.pagination) {
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching links:', error)
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

    fetchLinks()
  }, [router, fetchLinks])

  const onSubmit = async (data: LinkFormValues) => {
    try {
      // Preparar dados para envio - remover campos vazios
      const dataToSend: any = {
        originalUrl: data.originalUrl,
        linkType: data.linkType
      }
      
      // Adicionar campos opcionais apenas se não estiverem vazios
      if (data.title && data.title.trim()) dataToSend.title = data.title.trim()
      if (data.description && data.description.trim()) dataToSend.description = data.description.trim()
      if (data.tags && data.tags.length > 0) {
        dataToSend.tags = data.tags
      } else {
        dataToSend.tags = []
      }
      if (data.expiresAt) dataToSend.expiresAt = data.expiresAt
      
      // Log do que está sendo enviado para debug
      console.log('Enviando dados:', dataToSend)
      
      const response = await api.post('/links', dataToSend)
      toast.success('Link criado com sucesso!')
      setShowModal(false)
      form.reset()
      // Voltar para primeira página ao criar novo link
      fetchLinks(1)
    } catch (error: any) {
      // Log detalhado do erro
      console.error('Erro completo:', error)
      console.error('Resposta do servidor:', error.response?.data)
      console.error('Status:', error.response?.status)
      
      // Processar erros de validação do servidor
      if (error.response?.status === 400 && error.response?.data?.errors) {
        const serverErrors: Record<string, { message: string }> = {}
        
        if (Array.isArray(error.response.data.errors)) {
          error.response.data.errors.forEach((err: any) => {
            const field = err.param || err.path || 'root'
            serverErrors[field] = { message: err.msg || err.message || 'Erro de validação' }
          })
        }
        
        // Aplicar erros do servidor ao formulário
        Object.keys(serverErrors).forEach((field) => {
          form.setError(field as any, {
            type: 'server',
            message: serverErrors[field].message,
          })
        })
        
        // Mostrar toast com resumo
        const errorMessages = Object.values(serverErrors).map(e => e.message).join(', ')
        toast.error(`Erro de validação: ${errorMessages}`)
      } else {
        // Erro geral
        const errorMessage = error.response?.data?.error || error.message || 'Erro ao criar link'
        toast.error(errorMessage)
        form.setError('root', {
          type: 'server',
          message: errorMessage,
        })
      }
    }
  }

  const handleDeleteClick = (id: string) => {
    setLinkToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!linkToDelete) return

    try {
      await api.delete(`/links/${linkToDelete}`)
      toast.success('Link excluído com sucesso!')
      setDeleteDialogOpen(false)
      setLinkToDelete(null)
      // Se a página atual ficar vazia após deletar, voltar para página anterior
      if (links.length === 1 && pagination.page > 1) {
        fetchLinks(pagination.page - 1)
      } else {
        fetchLinks(pagination.page)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao excluir link')
      setDeleteDialogOpen(false)
      setLinkToDelete(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Link copiado!')
  }

  // Função para obter classes de cor baseadas no tipo de link (mesma do Dashboard)
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

  // const linkDomain = process.env.NEXT_PUBLIC_LINK_DOMAIN || 'localhost:3001'
  const linkDomain = process.env.NEXT_PUBLIC_API_URL|| 'htpp://localhost:3001'

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
          <h1 className="text-3xl font-bold text-foreground">Links</h1>
          <Button variant={"default"} className='text-white' onClick={() => setShowModal(true)}>
            <Plus size={20} className="mr-2" />
            Criar Link
          </Button>
        </div>

        {links.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Você ainda não tem links criados</p>
              <Button onClick={() => setShowModal(true)}>
                Criar Primeiro Link
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Link</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Título</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tags</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Cliques</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {links.map((link) => {
                      const shortUrl = `${linkDomain}/${link.shortCode}`
                      return (
                        <tr key={link.id} className="hover:bg-accent/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-sm text-primary">{shortUrl}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(shortUrl)}
                                title="Copiar"
                                className="h-6 w-6"
                              >
                                <Copy size={16} />
                              </Button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-foreground">{link.title || 'Sem título'}</td>
                          <td className="px-6 py-4">
                            {(() => {
                              const styles = getLinkTypeStyles(link.linkType)
                              return (
                                <span className={`px-2 py-1 ${styles.bg} ${styles.text} rounded text-xs font-medium`}>
                                  {link.linkType}
                                </span>
                              )
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            {link.tags && link.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {link.tags.map((tag: string, index: number) => (
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
                          <td className="px-6 py-4 text-foreground">{link._count?.clicks || 0}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="h-8 w-8"
                              >
                                <a
                                  href={link.originalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Abrir URL original"
                                >
                                  <ExternalLink size={18} />
                                </a>
                              </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteClick(link.id)}
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
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} links
                  </div>
                  {pagination.totalPages > 1 ? (
                    <ButtonGroup>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchLinks(pagination.page - 1)}
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
                            onClick={() => fetchLinks(pageNum)}
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
                        onClick={() => fetchLinks(pagination.page + 1)}
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

        {/* Create Link Modal */}
        <Dialog 
          open={showModal} 
          onOpenChange={(open) => {
            setShowModal(open)
            if (!open) {
              // Resetar formulário ao fechar
              form.reset()
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Link</DialogTitle>
              <DialogDescription>
                Crie um novo link rastreável para medir o impacto do seu conteúdo.
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
                  name="originalUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Original *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        URL completa que será redirecionada
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Meu link importante"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Título opcional para identificar o link
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="linkType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Link</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BIO">Bio</SelectItem>
                          <SelectItem value="STORY">Story</SelectItem>
                          <SelectItem value="DIRECT">Direct</SelectItem>
                          <SelectItem value="CAMPANHA">Campanha</SelectItem>
                          <SelectItem value="PRODUTO">Produto</SelectItem>
                          <SelectItem value="OTHER">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Categoria do link para organização
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
                              placeholder="Digite uma tag e pressione Enter"
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
                        Adicione tags para organizar e filtrar seus links. Pressione Enter ou clique em Adicionar.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? 'Criando...' : 'Criar'}
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
                Tem certeza que deseja excluir este link? Esta ação não pode ser desfeita.
                Todos os cliques e estatísticas associados a este link serão perdidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setLinkToDelete(null)}>
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

