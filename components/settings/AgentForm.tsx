'use client'

import { useState, useTransition } from 'react'
import { Save, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  PRACTICE_AREAS,
  DAY_LABELS,
  AGENT_TONE_LABELS,
  AGENT_TONE_DESCRIPTIONS,
} from '@/types/settings'
import type { AgentSettings, AgentTone, AgentChannel, PracticeArea } from '@/types/settings'
import { cn } from '@/lib/utils'
import { updateAgentSettings } from '@/actions/settings'

interface AgentFormProps {
  initial: AgentSettings
}

export function AgentForm({ initial }: AgentFormProps) {
  const [form, setForm] = useState(initial)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [handoffKeywordsInput, setHandoffKeywordsInput] = useState(
    initial.handoffRules.autoHandoffOnKeywords.join(', ')
  )

  function setField<K extends keyof AgentSettings>(key: K, value: AgentSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function setHandoffField<K extends keyof AgentSettings['handoffRules']>(
    key: K,
    value: AgentSettings['handoffRules'][K]
  ) {
    setForm((prev) => ({
      ...prev,
      handoffRules: { ...prev.handoffRules, [key]: value },
    }))
    setSaved(false)
  }

  function toggleBusinessHour(dayOfWeek: number, field: 'enabled' | 'start' | 'end', value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      businessHours: prev.businessHours.map((h) =>
        h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h
      ),
    }))
    setSaved(false)
  }

  function togglePracticeArea(area: PracticeArea) {
    setForm((prev) => {
      const areas = prev.practiceAreas.includes(area)
        ? prev.practiceAreas.filter((a) => a !== area)
        : [...prev.practiceAreas, area]
      return { ...prev, practiceAreas: areas }
    })
    setSaved(false)
  }

  function toggleChannel(channel: AgentChannel) {
    setForm((prev) => {
      const channels = prev.activeChannels.includes(channel)
        ? prev.activeChannels.filter((c) => c !== channel)
        : [...prev.activeChannels, channel]
      return { ...prev, activeChannels: channels }
    })
    setSaved(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const keywords = handoffKeywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
    const nextForm: AgentSettings = {
      ...form,
      handoffRules: { ...form.handoffRules, autoHandoffOnKeywords: keywords },
    }
    setForm(nextForm)
    setError(null)
    startTransition(async () => {
      const result = await updateAgentSettings(nextForm)
      if ('error' in result) {
        setSaved(false)
        setError(result.error)
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">

      {/* ── Bloco 1: Horário de atendimento ─────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Horário de atendimento</CardTitle>
          <CardDescription>
            Defina em quais dias e horários o agente responde ativamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {form.businessHours.map((h) => (
              <div key={h.dayOfWeek} className="flex items-center gap-3">
                {/* Toggle dia */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={h.enabled}
                  onClick={() => toggleBusinessHour(h.dayOfWeek, 'enabled', !h.enabled)}
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                    h.enabled ? 'bg-brand' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                      h.enabled ? 'translate-x-4' : 'translate-x-0'
                    )}
                  />
                </button>

                {/* Dia da semana */}
                <span className={cn('w-32 text-sm', !h.enabled && 'text-muted-foreground')}>
                  {DAY_LABELS[h.dayOfWeek]}
                </span>

                {/* Horários */}
                <div className={cn('flex items-center gap-2', !h.enabled && 'opacity-40 pointer-events-none')}>
                  <input
                    type="time"
                    value={h.start}
                    onChange={(e) => toggleBusinessHour(h.dayOfWeek, 'start', e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <span className="text-xs text-muted-foreground">até</span>
                  <input
                    type="time"
                    value={h.end}
                    onChange={(e) => toggleBusinessHour(h.dayOfWeek, 'end', e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Bloco 2: Tom do agente ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Tom do agente</CardTitle>
          <CardDescription>
            Define o estilo de linguagem usado nas conversas com clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {(['formal', 'neutral', 'friendly'] as AgentTone[]).map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => setField('tone', tone)}
                className={cn(
                  'rounded-lg border-2 px-4 py-3 text-left transition-colors duration-150',
                  form.tone === tone
                    ? 'border-brand bg-brand/5 text-foreground'
                    : 'border-border text-muted-foreground hover:border-brand/40'
                )}
              >
                <p className="text-sm font-medium text-foreground">{AGENT_TONE_LABELS[tone]}</p>
                <p className="mt-0.5 text-xs">{AGENT_TONE_DESCRIPTIONS[tone]}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Bloco 3: Especialidades ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Especialidades</CardTitle>
          <CardDescription>
            Áreas jurídicas em que seu escritório atua. O agente usa isso para qualificar leads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {PRACTICE_AREAS.map((area) => {
              const active = form.practiceAreas.includes(area)
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => togglePracticeArea(area)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150',
                    active
                      ? 'border-brand bg-brand text-white'
                      : 'border-border text-muted-foreground hover:border-brand/50 hover:text-foreground'
                  )}
                >
                  {area}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Bloco 4: Mensagens padrão ───────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Mensagens padrão</CardTitle>
          <CardDescription>
            Textos enviados automaticamente pelo agente em situações específicas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'greetingMessage' as const,    label: 'Saudação inicial',         placeholder: 'Mensagem de boas-vindas ao cliente...' },
            { key: 'closingMessage' as const,      label: 'Encerramento',             placeholder: 'Mensagem de despedida ao fim do atendimento...' },
            { key: 'outOfHoursMessage' as const,   label: 'Fora do horário',          placeholder: 'Mensagem quando o cliente contata fora do horário...' },
            { key: 'noContextMessage' as const,    label: 'Sem contexto / fallback',  placeholder: 'Mensagem quando o agente não sabe como responder...' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`ag-${key}`}>{label}</Label>
              <textarea
                id={`ag-${key}`}
                value={form[key]}
                onChange={(e) => setField(key, e.target.value)}
                rows={2}
                placeholder={placeholder}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Bloco 5: Regras de handoff humano ───────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Regras de handoff humano</CardTitle>
          <CardDescription>
            Define quando o agente transfere a conversa para um advogado da equipe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Keywords */}
          <div className="space-y-1.5">
            <Label htmlFor="ag-keywords">Palavras-chave que acionam handoff</Label>
            <Input
              id="ag-keywords"
              value={handoffKeywordsInput}
              onChange={(e) => { setHandoffKeywordsInput(e.target.value); setSaved(false) }}
              placeholder="urgente, processo, prazo, advogado..."
            />
            <p className="text-xs text-muted-foreground">Separe por vírgula.</p>
          </div>

          {/* Limite de mensagens */}
          <div className="space-y-1.5">
            <Label htmlFor="ag-msglimit">Handoff após N mensagens</Label>
            <div className="flex items-center gap-3">
              <input
                id="ag-msglimit"
                type="number"
                min={1}
                max={50}
                value={form.handoffRules.handoffAfterXMessages}
                onChange={(e) => setHandoffField('handoffAfterXMessages', Number(e.target.value))}
                className="h-9 w-20 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <span className="text-sm text-muted-foreground">mensagens sem resolução</span>
            </div>
          </div>

          {/* Mensagem de handoff */}
          <div className="space-y-1.5">
            <Label htmlFor="ag-handoff-msg">Mensagem de transferência</Label>
            <textarea
              id="ag-handoff-msg"
              value={form.handoffRules.handoffMessage}
              onChange={(e) => setHandoffField('handoffMessage', e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Toggles de fallback */}
          <div className="space-y-2">
            {[
              { key: 'fallbackOnNoContext' as const,    label: 'Acionar handoff quando o agente não souber responder' },
              { key: 'fallbackOnOutOfHours' as const,   label: 'Acionar handoff fora do horário de atendimento' },
            ].map(({ key, label }) => (
              <label key={key} className="flex cursor-pointer items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.handoffRules[key]}
                  onClick={() => setHandoffField(key, !form.handoffRules[key])}
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200',
                    form.handoffRules[key] ? 'bg-brand' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                      form.handoffRules[key] ? 'translate-x-4' : 'translate-x-0'
                    )}
                  />
                </button>
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Bloco 6: Canais ativos ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Canais ativos</CardTitle>
          <CardDescription>
            Canais nos quais o agente está disponível para atendimento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {([
              { value: 'whatsapp' as AgentChannel, label: 'WhatsApp' },
              { value: 'web'      as AgentChannel, label: 'Web (site)' },
            ]).map(({ value, label }) => {
              const active = form.activeChannels.includes(value)
              return (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-lg border-2 px-4 py-2.5 transition-colors duration-150',
                    active
                      ? 'border-brand bg-brand/5 text-foreground'
                      : 'border-border text-muted-foreground hover:border-brand/40'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleChannel(value)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      'h-4 w-4 rounded border-2 flex items-center justify-center transition-colors',
                      active ? 'border-brand bg-brand' : 'border-muted-foreground/40'
                    )}
                  >
                    {active && (
                      <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </label>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
        {error ? (
          <span className="text-sm font-medium text-destructive">{error}</span>
        ) : saved ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Configurações salvas com sucesso
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Configuracoes persistem no banco deste tenant.
          </span>
        )}
        <Button type="submit" size="sm" className="gap-2" disabled={isPending}>
          <Save className="h-4 w-4" />
          {isPending ? 'Salvando...' : 'Salvar configuracoes'}
        </Button>
      </div>
    </form>
  )
}
