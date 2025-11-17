'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '' })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchClients()
  }, [router])

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients')
      setClients(response.data.clients)
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/clients', formData)
      toast.success('Cliente criado com sucesso!')
      setShowModal(false)
      setFormData({ name: '', email: '' })
      fetchClients()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar cliente')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      await api.delete(`/clients/${id}`)
      toast.success('Cliente excluído com sucesso!')
      fetchClients()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao excluir cliente')
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Plus size={20} />
            <span>Adicionar Cliente</span>
          </button>
        </div>

        {clients.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-gray-500 mb-4">Você ainda não tem clientes cadastrados</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Adicionar Primeiro Cliente
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Links</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliques</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{client.name}</td>
                    <td className="px-6 py-4 text-gray-600">{client.email || '-'}</td>
                    <td className="px-6 py-4">{client.linkCount || 0}</td>
                    <td className="px-6 py-4">{client.totalClicks || 0}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Adicionar Cliente</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
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

