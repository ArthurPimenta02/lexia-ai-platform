import { notFound } from 'next/navigation'
import { getCaso, getUsers, getLeadsSummary } from '@/actions/casos'
import { DossieClient } from '@/components/casos/DossieClient'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const caso = await getCaso(id)
  return {
    title: caso ? `${caso.titulo} — Lexia AI` : 'Caso não encontrado',
  }
}

export default async function CasoDetalhePage({ params }: PageProps) {
  const { id } = await params
  const [caso, users, leads] = await Promise.all([getCaso(id), getUsers(), getLeadsSummary()])

  if (!caso) notFound()

  return <DossieClient caso={caso} users={users} leads={leads} />
}
