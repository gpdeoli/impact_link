'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { FileText, Download } from 'lucide-react'

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
  }, [router])

  const generatePDF = async () => {
    setLoading(true)
    try {
      const response = await api.get('/reports/pdf', {
        params: dateRange,
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `relatorio-impacto-${Date.now()}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateCSV = async () => {
    setLoading(true)
    try {
      const response = await api.get('/reports/csv', {
        params: dateRange,
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `relatorio-impacto-${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error generating CSV:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-600">Gere relatórios profissionais em PDF ou CSV</p>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Período do Relatório</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={generatePDF}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              <FileText size={20} />
              <span>Gerar PDF</span>
            </button>
            <button
              onClick={generateCSV}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
            >
              <Download size={20} />
              <span>Gerar CSV</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

