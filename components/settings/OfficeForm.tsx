'use client'

import { useState } from 'react'
import { Save, CheckCircle2, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TIMEZONES } from '@/types/settings'
import type { OfficeSettings } from '@/types/settings'
import { cn } from '@/lib/utils'

const PRACTICE_AREA_OPTIONS = [
  'Trabalhista', 'Cível', 'Família', 'Criminal',
  'Empresarial', 'Tributário', 'Previdenciário',
  'Consumidor', 'Imobiliário', 'Ambiental',
]

interface OfficeFormProps {
  initial: OfficeSettings
}

export function OfficeForm({ initial }: OfficeFormProps) {
  const [form, setForm] = useState(initial)
  const [saved, setSaved] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function set<K extends keyof OfficeSettings>(key: K, value: OfficeSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function setAddress(key: keyof OfficeSettings['address'], value: string) {
    setForm((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }))
    setSaved(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!form.name.trim() || !form.email.trim()) return
    // mock save — no backend yet
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const err = (val: string) => submitted && !val.trim()

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      {/* ── Bloco 1: Identidade ─────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Identidade do escritório</CardTitle>
          <CardDescription>
            Informações que identificam o escritório na plataforma e para seus clientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo placeholder */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted text-muted-foreground">
              <ImagePlus className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium">Logo do escritório</p>
              <p className="text-xs text-muted-foreground">Upload disponível na Fase 3</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Nome oficial */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="of-name">
                Nome oficial <span className="text-red-500">*</span>
              </Label>
              <Input
                id="of-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Razão social do escritório"
                aria-invalid={err(form.name)}
                className={cn(err(form.name) && 'border-red-400 focus-visible:ring-red-400')}
              />
              {err(form.name) && <p className="text-xs text-red-500">Nome é obrigatório</p>}
            </div>

            {/* Nome exibido */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="of-displayname">Nome exibido</Label>
              <Input
                id="of-displayname"
                value={form.displayName}
                onChange={(e) => set('displayName', e.target.value)}
                placeholder="Nome curto exibido na plataforma"
              />
              <p className="text-xs text-muted-foreground">
                Este nome aparece na sidebar e nas comunicações com o cliente.
              </p>
            </div>

            {/* Área principal */}
            <div className="space-y-1.5">
              <Label htmlFor="of-area">Área principal de atuação</Label>
              <select
                id="of-area"
                value={form.primaryPracticeArea}
                onChange={(e) => set('primaryPracticeArea', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {PRACTICE_AREA_OPTIONS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Fuso horário */}
            <div className="space-y-1.5">
              <Label htmlFor="of-timezone">Fuso horário</Label>
              <select
                id="of-timezone"
                value={form.timezone}
                onChange={(e) => set('timezone', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Bloco 2: Contato & Endereço ─────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Contato e endereço</CardTitle>
          <CardDescription>
            Dados de contato e localização do escritório.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* CNPJ */}
            <div className="space-y-1.5">
              <Label htmlFor="of-cnpj">CNPJ</Label>
              <Input
                id="of-cnpj"
                value={form.cnpj}
                onChange={(e) => set('cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>

            {/* Telefone */}
            <div className="space-y-1.5">
              <Label htmlFor="of-phone">Telefone</Label>
              <Input
                id="of-phone"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="(11) 0000-0000"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="of-email">
                Email de contato <span className="text-red-500">*</span>
              </Label>
              <Input
                id="of-email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="contato@escritorio.com.br"
                aria-invalid={err(form.email)}
                className={cn(err(form.email) && 'border-red-400 focus-visible:ring-red-400')}
              />
              {err(form.email) && <p className="text-xs text-red-500">Email é obrigatório</p>}
            </div>

            {/* Rua + Número */}
            <div className="space-y-1.5 sm:col-span-2 sm:flex sm:gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="of-street">Rua / Avenida</Label>
                <Input
                  id="of-street"
                  value={form.address.street}
                  onChange={(e) => setAddress('street', e.target.value)}
                  placeholder="Av. Paulista"
                />
              </div>
              <div className="w-28 space-y-1.5">
                <Label htmlFor="of-number">Número</Label>
                <Input
                  id="of-number"
                  value={form.address.number}
                  onChange={(e) => setAddress('number', e.target.value)}
                  placeholder="1578"
                />
              </div>
            </div>

            {/* Complemento */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="of-complement">Complemento</Label>
              <Input
                id="of-complement"
                value={form.address.complement ?? ''}
                onChange={(e) => setAddress('complement', e.target.value)}
                placeholder="Sala, andar, conjunto..."
              />
            </div>

            {/* Cidade + Estado + CEP */}
            <div className="space-y-1.5">
              <Label htmlFor="of-city">Cidade</Label>
              <Input
                id="of-city"
                value={form.address.city}
                onChange={(e) => setAddress('city', e.target.value)}
                placeholder="São Paulo"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="of-state">Estado</Label>
                <Input
                  id="of-state"
                  value={form.address.state}
                  onChange={(e) => setAddress('state', e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="of-zip">CEP</Label>
                <Input
                  id="of-zip"
                  value={form.address.zip}
                  onChange={(e) => setAddress('zip', e.target.value)}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
        {saved ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Alterações salvas com sucesso
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Os dados são salvos apenas localmente (mock).
          </span>
        )}
        <Button type="submit" size="sm" className="gap-2">
          <Save className="h-4 w-4" />
          Salvar alterações
        </Button>
      </div>
    </form>
  )
}
