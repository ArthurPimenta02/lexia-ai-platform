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
import { AREAS_DISPONIVEIS, RESPONSAVEIS_DISPONIVEIS, STATUS_DISPONIVEIS } from '@/lib/mock/casos'
import type { Caso, CasoArea, CasoStatus } from '@/types/caso'

interface FormState {
  titulo: string
  area: CasoArea
  status: CasoStatus
  cliente: string
  responsavel: string
  descricao: string
  proximaAcao: string
}

const DEFAULT_FORM: FormState = {
  titulo: '',
  area: 'Cível',
  status: 'Ativo',
  cliente: '',
  responsavel: RESPONSAVEIS_DISPONIVEIS[0],
  descricao: '',
  proximaAcao: '',
}

interface CasoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caso?: Caso
  onSave: (data: FormState) => void
}

export function CasoFormDialog({ open, onOpenChange, caso, onSave }: CasoFormDialogProps) {
  const isEdit = Boolean(caso)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (open) {
      setSubmitted(false)
      if (caso) {
        setForm({
          titulo: caso.titulo,
          area: caso.area,
          status: caso.status,
          cliente: caso.cliente,
          responsavel: caso.responsavel,
          descricao: caso.descricao ?? '',
          proximaAcao: caso.proximaAcao ?? '',
        })
      } else {
        setForm(DEFAULT_FORM)
      }
    }
  }, [open, caso])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!form.titulo.trim() || !form.cliente.trim()) return
    onSave(form)
    onOpenChange(false)
  }

  const fieldError = (val: string) => submitted && !val.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Caso' : 'Novo Caso'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="cf-titulo">
              Título <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cf-titulo"
              value={form.titulo}
              onChange={(e) => set('titulo', e.target.value)}
              placeholder="Ex: Rescisão Indireta — João Silva x Empresa Ltda."
              aria-invalid={fieldError(form.titulo)}
              className={fieldError(form.titulo) ? 'border-red-400 focus-visible:ring-red-400' : ''}
            />
            {fieldError(form.titulo) && (
              <p className="text-xs text-red-500">Título é obrigatório</p>
            )}
          </div>

          {/* Cliente */}
          <div className="space-y-1.5">
            <Label htmlFor="cf-cliente">
              Cliente <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cf-cliente"
              value={form.cliente}
              onChange={(e) => set('cliente', e.target.value)}
              placeholder="Nome do cliente ou empresa"
              aria-invalid={fieldError(form.cliente)}
              className={fieldError(form.cliente) ? 'border-red-400 focus-visible:ring-red-400' : ''}
            />
            {fieldError(form.cliente) && (
              <p className="text-xs text-red-500">Cliente é obrigatório</p>
            )}
          </div>

          {/* Área + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cf-area">Área jurídica</Label>
              <select
                id="cf-area"
                value={form.area}
                onChange={(e) => set('area', e.target.value as CasoArea)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {AREAS_DISPONIVEIS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cf-status">Status</Label>
              <select
                id="cf-status"
                value={form.status}
                onChange={(e) => set('status', e.target.value as CasoStatus)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {STATUS_DISPONIVEIS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Responsável */}
          <div className="space-y-1.5">
            <Label htmlFor="cf-responsavel">Responsável</Label>
            <select
              id="cf-responsavel"
              value={form.responsavel}
              onChange={(e) => set('responsavel', e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {RESPONSAVEIS_DISPONIVEIS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Próxima ação */}
          <div className="space-y-1.5">
            <Label htmlFor="cf-proxima-acao">Próxima ação</Label>
            <Input
              id="cf-proxima-acao"
              value={form.proximaAcao}
              onChange={(e) => set('proximaAcao', e.target.value)}
              placeholder="Ex: Protocolar réplica à contestação"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="cf-descricao">Descrição / Observações</Label>
            <textarea
              id="cf-descricao"
              value={form.descricao}
              onChange={(e) => set('descricao', e.target.value)}
              rows={3}
              placeholder="Contexto do caso, histórico relevante..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEdit ? 'Salvar alterações' : 'Criar caso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
