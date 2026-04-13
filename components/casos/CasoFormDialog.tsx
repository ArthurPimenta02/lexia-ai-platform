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
import type { CasoSummary, CasoArea, CasoStatus, CasoFormData } from '@/types/caso'
import { CASO_AREAS, CASO_STATUSES } from '@/types/caso'

interface FormState {
  titulo: string
  area: CasoArea
  status: CasoStatus
  clienteNome: string
  responsavelId: string
  leadId: string
  descricao: string
  proximaAcao: string
  proximaAcaoData: string
}

const DEFAULT_FORM: FormState = {
  titulo: '',
  area: 'Cível',
  status: 'Ativo',
  clienteNome: '',
  responsavelId: '',
  leadId: '',
  descricao: '',
  proximaAcao: '',
  proximaAcaoData: '',
}

interface CasoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caso?: CasoSummary
  users: { id: string; name: string }[]
  leads: { id: string; name: string }[]
  onSave: (data: CasoFormData) => void
}

export function CasoFormDialog({ open, onOpenChange, caso, users, leads, onSave }: CasoFormDialogProps) {
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
          clienteNome: caso.clienteNome,
          responsavelId: caso.responsavelId ?? '',
          leadId: caso.leadId ?? '',
          descricao: '',
          proximaAcao: caso.proximaAcao ?? '',
          proximaAcaoData: caso.proximaAcaoData ?? '',
        })
      } else {
        setForm({ ...DEFAULT_FORM, responsavelId: users[0]?.id ?? '' })
      }
    }
  }, [open, caso, users])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!form.titulo.trim() || !form.clienteNome.trim()) return
    onSave({
      titulo: form.titulo,
      area: form.area,
      status: form.status,
      clienteNome: form.clienteNome,
      responsavelId: form.responsavelId,
      leadId: form.leadId,
      descricao: form.descricao,
      proximaAcao: form.proximaAcao,
      proximaAcaoData: form.proximaAcaoData,
    })
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
              value={form.clienteNome}
              onChange={(e) => set('clienteNome', e.target.value)}
              placeholder="Nome do cliente ou empresa"
              aria-invalid={fieldError(form.clienteNome)}
              className={fieldError(form.clienteNome) ? 'border-red-400 focus-visible:ring-red-400' : ''}
            />
            {fieldError(form.clienteNome) && (
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
                className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CASO_AREAS.map((a) => (
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
                className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CASO_STATUSES.map((s) => (
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
              value={form.responsavelId}
              onChange={(e) => set('responsavelId', e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">— Sem responsável —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Lead de origem */}
          {leads.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="cf-lead">Lead de origem</Label>
              <select
                id="cf-lead"
                value={form.leadId}
                onChange={(e) => set('leadId', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">— Sem lead vinculado —</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          )}

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

          {/* Data da próxima ação */}
          {form.proximaAcao && (
            <div className="space-y-1.5">
              <Label htmlFor="cf-proxima-acao-data">Data limite</Label>
              <Input
                id="cf-proxima-acao-data"
                type="date"
                value={form.proximaAcaoData ? form.proximaAcaoData.substring(0, 10) : ''}
                onChange={(e) => set('proximaAcaoData', e.target.value ? new Date(e.target.value).toISOString() : '')}
              />
            </div>
          )}

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
