'use client'

import { ArrowRightLeft } from 'lucide-react'

interface HandoffBannerProps {
  timestamp: string
}

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function HandoffBanner({ timestamp }: HandoffBannerProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 my-2">
      <ArrowRightLeft className="h-4 w-4 shrink-0 text-amber-600" />
      <span>
        Atendimento transferido para humano —{' '}
        <span className="font-medium">{formatDateTime(timestamp)}</span>
      </span>
    </div>
  )
}
