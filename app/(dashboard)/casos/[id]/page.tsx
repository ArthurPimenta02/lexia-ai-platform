import { notFound } from 'next/navigation'
import { CASO_BY_ID } from '@/lib/mock/casos'
import { DossieClient } from '@/components/casos/DossieClient'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const caso = CASO_BY_ID[id]
  return {
    title: caso ? `${caso.titulo} — Lexia AI` : 'Caso não encontrado',
  }
}

export default async function CasoDetalhePage({ params }: PageProps) {
  const { id } = await params
  const caso = CASO_BY_ID[id]

  if (!caso) notFound()

  return <DossieClient caso={caso} />
}
