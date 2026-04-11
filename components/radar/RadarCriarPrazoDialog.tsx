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
import { RESPONSAVEIS_DISPONIVEIS } from '@/lib/mock/casos'
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
  responsavel: string
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
  onSave: (data: FormState & { casoId: string; casoTitulo: string }) => void
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
    responsavel: RESPONSAVEIS_DISPONIVEIS[0],
    tipo: 'outro',
    observacoes: '',
  })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (open && item) {
      setSubmitted(false)
      setForm({
        titulo: item.proximoPasso.length > 80
          ? item.proximoPasso.slice(0, 80)
          : item.proximoPasso,
        dataLimite: defaultDataLimite(),
        responsavel: RESPONSAVEIS_DISPONIVEIS[0],
        tipo: 'outro',
        observacoes: '',
      })
    }
  }, [open, item])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!form.titulo.trim() || !form.dataLimite) return
    onSave({
      ...form,
      casoId: item!.casoId,
      casoTitulo: item!.casoTitulo,
    })
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
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              value={form.responsavel}
              onChange={(e) => set('responsavel', e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {RESPONSAVEIS_DISPONIVEIS.map((r) => (
                <option key={r} value={r}>{r}</option>
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
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Criar prazo</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
