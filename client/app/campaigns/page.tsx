'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchCampaigns()
  }, [router])

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/campaigns')
      setCampaigns(response.data.campaigns)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/campaigns', formData)
      toast.success('Campanha criada com sucesso!')
      setShowModal(false)
      setFormData({
        name: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
      })
      fetchCampaigns()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar campanha')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha?')) return

    try {
      await api.delete(`/campaigns/${id}`)
      toast.success('Campanha excluída com sucesso!')
      fetchCampaigns()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao excluir campanha')
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
          <h1 className="text-3xl font-bold text-gray-900">Campanhas</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Plus size={20} />
            <span>Nova Campanha</span>
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-gray-500 mb-4">Você ainda não tem campanhas criadas</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Criar Primeira Campanha
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{campaign.name}</h3>
                    {campaign.description && (
                      <p className="text-gray-600 mt-1">{campaign.description}</p>
                    )}
                    <div className="mt-2 text-sm text-gray-500">
                      <span>{campaign.totalClicks || 0} cliques</span>
                      {' • '}
                      <span>{campaign.linkCount || 0} links</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(campaign.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Nova Campanha</h2>
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
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Início *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Fim
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
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

