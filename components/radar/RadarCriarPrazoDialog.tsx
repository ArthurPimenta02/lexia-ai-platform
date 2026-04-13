'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { createPrazo, getTenantUsers, type CreatePrazoData } from '@/actions/radar'
import type { RadarItem } from '@/types/radar'

type TipoPrazo =
  | 'recursal'
  | 'contestacao'
  | 'replica'
  | 'manifestacao'
  | 'pericia'
  | 'audiencia'
  | 'protocolo'
  | 'outro'

const TIPOS_PRAZO: Record<TipoPrazo, string> = {
  recursal: 'Recursal',
  contestacao: 'Contestação',
  replica: 'Réplica',
  manifestacao: 'Manifestação',
  pericia: 'Perícia',
  audiencia: 'Audiência',
  protocolo: 'Protocolo',
  outro: 'Outro',
}

interface FormState {
  titulo: string
  dataLimite: string
  responsavelId: string
  tipo: TipoPrazo
  observacoes: string
}

function defaultDataLimite(): string {
  const d = new Date()
  d.setDate(d.getDate() + 15)
  return d.toISOString().slice(0, 10)
}

interface RadarCriarPrazoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: RadarItem | null
  onSave: (data: { titulo: string; dataLimite: string; tipo: string }) => void
}

export function RadarCriarPrazoDialog({
  open,
  onOpenChange,
  item,
  onSave,
}: RadarCriarPrazoDialogProps) {
  const [form, setForm] = useState<FormState>({
    titulo: '',
    dataLimite: defaultDataLimite(),
    responsavelId: '',
    tipo: 'outro',
    observacoes: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [users, setUsers] = useState<{ id: string; name: string; role: string }[]>([])

  // Busca usuários do tenant quando o dialog abre
  useEffect(() => {
    if (!open) return
    getTenantUsers().then((result) => {
      if ('users' in result) setUsers(result.users)
    })
  }, [open])

  useEffect(() => {
    if (open && item) {
      setSubmitted(false)
      setServerError(null)
      setForm({
        titulo: item.proximoPasso.length > 80
          ? item.proximoPasso.slice(0, 80)
          : item.proximoPasso,
        dataLimite: defaultDataLimite(),
        responsavelId: '',
        tipo: 'outro',
        observacoes: '',
      })
    }
  }, [open, item])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setServerError(null)

    if (!form.titulo.trim() || !form.dataLimite) return
    if (!item) return

    setSaving(true)

    const data: CreatePrazoData = {
      titulo: form.titulo.trim(),
      dataLimite: form.dataLimite,
      tipo: form.tipo,
      observacoes: form.observacoes.trim() || undefined,
      responsavelId: form.responsavelId || undefined,
      casoId: item.casoId,
      radarItemId: item.id,
      radarItemTitulo: item.titulo,
    }

    const result = await createPrazo(data)
    setSaving(false)

    if ('error' in result) {
      setServerError(result.error)
      return
    }

    onSave({ titulo: form.titulo.trim(), dataLimite: form.dataLimite, tipo: form.tipo })
    onOpenChange(false)
  }

  const fieldError = (val: string) => submitted && !val.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar prazo</DialogTitle>
        </DialogHeader>

        {item && (
          <div className="rounded-md bg-muted/50 border border-border/60 px-3 py-2 text-xs text-muted-foreground -mt-1">
            <span className="font-medium text-foreground/70">{item.casoTitulo}</span>
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            {item.cliente}
          </div>
        )}

        {serverError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Título do prazo */}
          <div className="space-y-1.5">
            <Label htmlFor="rp-titulo">
              Descrição do prazo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="rp-titulo"
              value={form.titulo}
              onChange={(e) => set('titulo', e.target.value)}
              placeholder="Ex: Protocolar réplica à contestação"
              aria-invalid={fieldError(form.titulo)}
              className={fieldError(form.titulo) ? 'border-red-400 focus-visible:ring-red-400' : ''}
              disabled={saving}
            />
            {fieldError(form.titulo) && (
              <p className="text-xs text-red-500">Descrição é obrigatória</p>
            )}
          </div>

          {/* Tipo + Data limite */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rp-tipo">Tipo de prazo</Label>
              <select
                id="rp-tipo"
                value={form.tipo}
                onChange={(e) => set('tipo', e.target.value as TipoPrazo)}
                disabled={saving}
                className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {(Object.keys(TIPOS_PRAZO) as TipoPrazo[]).map((t) => (
                  <option key={t} value={t}>{TIPOS_PRAZO[t]}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rp-data">
                Data limite <span className="text-red-500">*</span>
              </Label>
              <Input
                id="rp-data"
                type="date"
                value={form.dataLimite}
                onChange={(e) => set('dataLimite', e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                aria-invalid={submitted && !form.dataLimite}
                className={submitted && !form.dataLimite ? 'border-red-400 focus-visible:ring-red-400' : ''}
                disabled={saving}
              />
              {submitted && !form.dataLimite && (
                <p className="text-xs text-red-500">Data limite é obrigatória</p>
              )}
            </div>
          </div>

          {/* Responsável */}
          <div className="space-y-1.5">
            <Label htmlFor="rp-responsavel">Responsável</Label>
            <select
              id="rp-responsavel"
              value={form.responsavelId}
              onChange={(e) => set('responsavelId', e.target.value)}
              disabled={saving}
              className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Sem responsável</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label htmlFor="rp-obs">Observações</Label>
            <textarea
              id="rp-obs"
              value={form.observacoes}
              onChange={(e) => set('observacoes', e.target.value)}
              rows={3}
              placeholder="Contexto adicional, instrução para o responsável..."
              disabled={saving}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando…</> : 'Criar prazo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
