'use client'

import { useState, useTransition } from 'react'
import { Save, CheckCircle2, ImagePlus, Copy, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TIMEZONES } from '@/types/settings'
import type { OfficeSettings } from '@/types/settings'
import { cn } from '@/lib/utils'
import { updateTenantSettings, uploadTenantLogo } from '@/actions/settings'

const PRACTICE_AREA_OPTIONS = [
  'Trabalhista', 'Civel', 'Familia', 'Criminal',
  'Empresarial', 'Tributario', 'Previdenciario',
  'Consumidor', 'Imobiliario', 'Ambiental',
]

interface OfficeFormProps {
  initial: OfficeSettings
}

export function OfficeForm({ initial }: OfficeFormProps) {
  const [form, setForm] = useState(initial)
  const [saved, setSaved] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [isPending, startTransition] = useTransition()

  function set<K extends keyof OfficeSettings>(key: K, value: OfficeSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function setAddress(key: keyof OfficeSettings['address'], value: string) {
    setForm((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }))
    setSaved(false)
  }

  async function handleLogoChange(file: File | null) {
    if (!file) return

    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('file', file)
      const result = await uploadTenantLogo(formData)
      if ('error' in result) {
        setError(result.error)
        return
      }

      setForm((prev) => ({ ...prev, logoUrl: result.url }))
      window.dispatchEvent(new Event('lexia-office-updated'))
    })
  }

  async function handleCopyCode() {
    await navigator.clipboard.writeText(form.officeCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  function handleSubmitReal(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!form.name.trim() || !form.email.trim()) return

    setError(null)
    startTransition(async () => {
      const result = await updateTenantSettings(form)
      if ('error' in result) {
        setSaved(false)
        setError(result.error)
        return
      }
      window.dispatchEvent(new Event('lexia-office-updated'))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  const err = (val: string) => submitted && !val.trim()

  return (
    <form onSubmit={handleSubmitReal} className="space-y-6 p-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Identidade do escritorio</CardTitle>
          <CardDescription>
            Informacoes que representam o tenant real da sua operacao dentro da Lexia.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-background text-muted-foreground">
                  {form.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.logoUrl} alt={form.displayName || form.name} className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Logo do escritorio</p>
                  <p className="text-xs text-muted-foreground">Imagem usada para identificar o escritorio na plataforma.</p>
                </div>
              </div>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent">
                <ImagePlus className="h-4 w-4" />
                Enviar logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="of-code">Codigo do escritorio</Label>
              <div className="flex gap-2">
                <Input id="of-code" value={form.officeCode} readOnly disabled className="font-mono tracking-[0.2em] uppercase" />
                <Button type="button" variant="outline" onClick={handleCopyCode} className="gap-2">
                  <Copy className="h-4 w-4" />
                  {copiedCode ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Compartilhe este codigo com quem precisa entrar no escritorio existente.
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="of-name">
                Nome oficial <span className="text-red-500">*</span>
              </Label>
              <Input
                id="of-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Razao social do escritorio"
                aria-invalid={err(form.name)}
                className={cn(err(form.name) && 'border-red-400 focus-visible:ring-red-400')}
              />
              {err(form.name) && <p className="text-xs text-red-500">Nome e obrigatorio</p>}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="of-displayname">Nome exibido</Label>
              <Input
                id="of-displayname"
                value={form.displayName}
                onChange={(e) => set('displayName', e.target.value)}
                placeholder="Nome curto exibido na plataforma"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="of-area">Area principal de atuacao</Label>
              <select
                id="of-area"
                value={form.primaryPracticeArea}
                onChange={(e) => set('primaryPracticeArea', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {PRACTICE_AREA_OPTIONS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="of-timezone">Fuso horario</Label>
              <select
                id="of-timezone"
                value={form.timezone}
                onChange={(e) => set('timezone', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Contato e endereco</CardTitle>
          <CardDescription>
            Dados de contato e localizacao do escritorio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="of-cnpj">CNPJ</Label>
              <Input
                id="of-cnpj"
                value={form.cnpj}
                onChange={(e) => set('cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="of-phone">Telefone</Label>
              <Input
                id="of-phone"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="(11) 0000-0000"
              />
            </div>

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
              {err(form.email) && <p className="text-xs text-red-500">Email e obrigatorio</p>}
            </div>

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
                <Label htmlFor="of-number">Numero</Label>
                <Input
                  id="of-number"
                  value={form.address.number}
                  onChange={(e) => setAddress('number', e.target.value)}
                  placeholder="1578"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="of-complement">Complemento</Label>
              <Input
                id="of-complement"
                value={form.address.complement ?? ''}
                onChange={(e) => setAddress('complement', e.target.value)}
                placeholder="Sala, andar, conjunto..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="of-city">Cidade</Label>
              <Input
                id="of-city"
                value={form.address.city}
                onChange={(e) => setAddress('city', e.target.value)}
                placeholder="Sao Paulo"
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

      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
        {error ? (
          <span className="text-sm font-medium text-destructive">{error}</span>
        ) : saved ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Alteracoes salvas com sucesso
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Edicoes persistem no banco deste tenant.
          </span>
        )}
        <Button type="submit" size="sm" className="gap-2" disabled={isPending}>
          <Save className="h-4 w-4" />
          {isPending ? 'Salvando...' : 'Salvar alteracoes'}
        </Button>
      </div>
    </form>
  )
}
