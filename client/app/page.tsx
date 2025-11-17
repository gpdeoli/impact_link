'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (token) {
      router.push('/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            ImpactLink
          </h1>
          <p className="text-xl text-gray-700 mb-4">
            Transformando dados de tráfego por link em provas de impacto
          </p>
          <p className="text-lg text-gray-600 mb-12">
            Meça e visualize o impacto real do seu conteúdo através de tracking de links e dashboards analíticos
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Link
              href="/login"
              className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold border-2 border-primary-600 hover:bg-primary-50 transition"
            >
              Criar Conta
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Links Inteligentes</h3>
              <p className="text-gray-600">
                Encurtador de links rastreáveis com classificação e tags para organizar seu conteúdo
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Dashboard de Impacto</h3>
              <p className="text-gray-600">
                Visualização histórica, comparações e insights automáticos sobre seu tráfego
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Relatórios Profissionais</h3>
              <p className="text-gray-600">
                Gere relatórios em PDF ou CSV com branding personalizado para seus clientes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

