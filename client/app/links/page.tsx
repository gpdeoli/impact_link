'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Copy, ExternalLink, Trash2, Edit } from 'lucide-react'

export default function LinksPage() {
  const router = useRouter()
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    originalUrl: '',
    title: '',
    description: '',
    linkType: 'OTHER',
    tags: [] as string[],
    expiresAt: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchLinks()
  }, [router])

  const fetchLinks = async () => {
    try {
      const response = await api.get('/links')
      setLinks(response.data.links)
    } catch (error) {
      console.error('Error fetching links:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await api.post('/links', formData)
      toast.success('Link criado com sucesso!')
      setShowModal(false)
      setFormData({
        originalUrl: '',
        title: '',
        description: '',
        linkType: 'OTHER',
        tags: [],
        expiresAt: ''
      })
      fetchLinks()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar link')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este link?')) return

    try {
      await api.delete(`/links/${id}`)
      toast.success('Link excluído com sucesso!')
      fetchLinks()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao excluir link')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Link copiado!')
  }

  const linkDomain = process.env.NEXT_PUBLIC_LINK_DOMAIN || 'localhost:3001'

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Links</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Plus size={20} />
            <span>Criar Link</span>
          </button>
        </div>

        {links.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-gray-500 mb-4">Você ainda não tem links criados</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Criar Primeiro Link
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Link</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliques</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {links.map((link) => {
                  const shortUrl = `https://${linkDomain}/${link.shortCode}`
                  return (
                    <tr key={link.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm text-primary-600">{shortUrl}</span>
                          <button
                            onClick={() => copyToClipboard(shortUrl)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Copiar"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">{link.title || 'Sem título'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                          {link.linkType}
                        </span>
                      </td>
                      <td className="px-6 py-4">{link._count?.clicks || 0}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <a
                            href={link.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600"
                            title="Abrir URL original"
                          >
                            <ExternalLink size={18} />
                          </a>
                          <button
                            onClick={() => handleDelete(link.id)}
                            className="text-red-400 hover:text-red-600"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Link Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Criar Novo Link</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL Original *
                  </label>
                  <input
                    type="url"
                    value={formData.originalUrl}
                    onChange={(e) => setFormData({ ...formData, originalUrl: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Meu link importante"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Link
                  </label>
                  <select
                    value={formData.linkType}
                    onChange={(e) => setFormData({ ...formData, linkType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="BIO">Bio</option>
                    <option value="STORY">Story</option>
                    <option value="DIRECT">Direct</option>
                    <option value="CAMPANHA">Campanha</option>
                    <option value="PRODUTO">Produto</option>
                    <option value="OTHER">Outro</option>
                  </select>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Criar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

