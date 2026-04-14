'use client'

import { useState, useTransition } from 'react'
import { Camera, CheckCircle2, RefreshCw, Save, Scale } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROLE_LABELS } from '@/types/user'
import type { UserRole } from '@/types/user'
import { updateCurrentUserProfile, uploadCurrentUserAvatar, type UserProfileData } from '@/actions/profile'
import { removeCurrentUserOab, saveCurrentUserPrimaryOab } from '@/actions/lawyer-oabs'
import { requestOabDiscovery } from '@/actions/processos'

interface ProfileFormProps {
  initial: UserProfileData
}

const BR_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function ProfileForm({ initial }: ProfileFormProps) {
  const [name, setName] = useState(initial.name)
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl)
  const [primaryOab, setPrimaryOab] = useState(initial.primaryOab ?? null)
  const [oabNumber, setOabNumber] = useState(initial.primaryOab?.oabNumber ?? '')
  const [oabState, setOabState] = useState(initial.primaryOab?.oabState ?? 'SP')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isSyncingOab, startOabSyncTransition] = useTransition()
  const [isSavingOab, startSaveOabTransition] = useTransition()
  const [isRemovingOab, startRemoveOabTransition] = useTransition()

  const canManageOwnOab = initial.role === 'lawyer' || initial.role === 'admin' || initial.role === 'manager'
  const shouldShowOabSetup = canManageOwnOab && !primaryOab

  function formatDateTime(iso: string | null | undefined) {
    if (!iso) return 'Nunca sincronizada'
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function syncBadge(syncStatus: string) {
    if (syncStatus === 'synced') return 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
    if (syncStatus === 'error') return 'border-red-200 bg-red-100 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
    if (syncStatus === 'stale') return 'border-zinc-200 bg-zinc-100 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300'
    return 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'
  }

  function handleAvatarChange(file: File | null) {
    if (!file) return

    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('file', file)
      const result = await uploadCurrentUserAvatar(formData)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setAvatarUrl(result.url)
      window.dispatchEvent(new Event('lexia-profile-updated'))
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await updateCurrentUserProfile({ name })
      if ('error' in result) {
        setError(result.error)
        return
      }

      window.dispatchEvent(new Event('lexia-profile-updated'))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  function handleSyncOab() {
    if (!primaryOab) return

    setSyncMessage(null)
    setError(null)
    startOabSyncTransition(async () => {
      const result = await requestOabDiscovery(primaryOab.id)
      if ('error' in result) {
        setError(result.error)
        return
      }

      setSyncMessage('Solicitacao de atualizacao enviada para o n8n.')
      setTimeout(() => setSyncMessage(null), 4000)
    })
  }

  function handleSaveOab(searchNow: boolean) {
    setSyncMessage(null)
    setError(null)

    startSaveOabTransition(async () => {
      const result = await saveCurrentUserPrimaryOab({
        oabNumber,
        oabState,
        searchNow,
      })

      if ('error' in result) {
        setError(result.error)
        return
      }

      setPrimaryOab((prev) => ({
        id: result.oabId,
        oabNumber,
        oabState,
        discoveryDone: prev?.discoveryDone ?? false,
        discoveryAt: prev?.discoveryAt ?? null,
        discoveryCount: prev?.discoveryCount ?? 0,
      }))

      if (result.discoveryRequested) {
        setSyncMessage('OAB salva e busca inicial enviada para o n8n.')
      } else if (result.discoveryError) {
        setSyncMessage('OAB salva, mas a busca inicial nao pode ser iniciada agora. Voce pode tentar novamente abaixo.')
      } else {
        setSyncMessage('OAB salva com sucesso.')
      }
    })
  }

  function handleRemoveOab() {
    if (!primaryOab) return
    const confirmed = window.confirm('Deseja remover esta OAB do seu perfil?')
    if (!confirmed) return

    setSyncMessage(null)
    setError(null)

    startRemoveOabTransition(async () => {
      const result = await removeCurrentUserOab(primaryOab.id)
      if ('error' in result) {
        setError(result.error)
        return
      }

      setPrimaryOab(null)
      setOabNumber('')
      setOabState('SP')
      setSyncMessage('OAB removida com sucesso.')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Atualize seus dados basicos e a foto usada na plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-20 w-20 border border-border">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
              <AvatarFallback className="bg-brand text-lg font-semibold text-white">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Foto de perfil</p>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent">
                <Camera className="h-4 w-4" />
                Trocar imagem
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
                />
              </label>
              <p className="text-xs text-muted-foreground">PNG, JPG ou WebP ate 5MB.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="profile-name">Nome</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-email">E-mail</Label>
              <Input id="profile-email" value={initial.email} readOnly disabled />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-role">Perfil</Label>
              <Input
                id="profile-role"
                value={ROLE_LABELS[initial.role as UserRole]}
                readOnly
                disabled
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="profile-office">Escritorio atual</Label>
              <Input id="profile-office" value={initial.tenantName} readOnly disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {canManageOwnOab && (
      <Card id="oab-setup">
        <CardHeader>
          <CardTitle>Minha OAB</CardTitle>
          <CardDescription>
            Cadastre ou edite sua OAB principal para importar seus processos reutilizando o fluxo juridico ja existente da Lexia.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {primaryOab ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Scale className="h-4 w-4 text-muted-foreground" />
                      OAB {primaryOab.oabNumber}/{primaryOab.oabState}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ultima discovery: {formatDateTime(primaryOab.discoveryAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Processos descobertos na ultima carga: {primaryOab.discoveryCount}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={handleSyncOab}
                    disabled={isSyncingOab}
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncingOab ? 'animate-spin' : ''}`} />
                    {isSyncingOab ? 'Solicitando...' : 'Atualizar processos da OAB'}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 rounded-xl border border-border bg-background p-4 sm:grid-cols-[1fr_120px]">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-oab-number">Numero da OAB</Label>
                  <Input
                    id="profile-oab-number"
                    value={oabNumber}
                    onChange={(e) => setOabNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 123456"
                    maxLength={7}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-oab-state">UF</Label>
                  <select
                    id="profile-oab-state"
                    value={oabState}
                    onChange={(e) => setOabState(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background text-foreground px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {BR_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => handleSaveOab(false)} disabled={isSavingOab || isRemovingOab}>
                  {isSavingOab ? 'Salvando...' : 'Salvar OAB'}
                </Button>
                <Button type="button" onClick={() => handleSaveOab(true)} disabled={isSavingOab || isRemovingOab}>
                  {isSavingOab ? 'Salvando...' : 'Salvar e buscar meus processos agora'}
                </Button>
                <Button type="button" variant="destructive" onClick={handleRemoveOab} disabled={isSavingOab || isRemovingOab}>
                  {isRemovingOab ? 'Removendo...' : 'Remover OAB'}
                </Button>
              </div>

              <div className="rounded-xl border border-border">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-medium text-foreground">Processos descobertos pela OAB</p>
                  <p className="text-xs text-muted-foreground">
                    Visibilidade operacional dos processos importados antes do vinculo com casos.
                  </p>
                </div>
                {initial.discoveredProcesses.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-muted-foreground">
                    Nenhum processo descoberto ainda para esta OAB.
                  </div>
                ) : (
                  <div className="space-y-2 px-4 py-4">
                    {initial.discoveredProcesses.map((processo) => (
                      <div key={processo.id} className="rounded-lg border border-border bg-background px-3 py-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 space-y-1">
                            <p className="truncate text-sm font-mono text-foreground">{processo.cnjNumber}</p>
                            <p className="text-xs text-muted-foreground">{processo.tribunal}</p>
                            <p className="text-xs text-muted-foreground">
                              Ultima sync: {formatDateTime(processo.lastSyncedAt)}
                            </p>
                          </div>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${syncBadge(processo.syncStatus)}`}>
                            {processo.syncStatus}
                          </span>
                        </div>
                        {processo.syncError ? (
                          <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
                            Ultimo erro: {processo.syncError}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : shouldShowOabSetup ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                <p className="font-semibold text-amber-950 dark:text-amber-100">
                  Antes de continuar, cadastre sua OAB
                </p>
                <p className="mt-1">
                  Isso permite importar seus processos e iniciar a camada juridica operacional da Lexia para o seu usuario.
                </p>
              </div>

              <div className="grid gap-4 rounded-xl border border-border bg-background p-4 sm:grid-cols-[1fr_120px]">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-oab-number-empty">Numero da OAB</Label>
                  <Input
                    id="profile-oab-number-empty"
                    value={oabNumber}
                    onChange={(e) => setOabNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 123456"
                    maxLength={7}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-oab-state-empty">UF</Label>
                  <select
                    id="profile-oab-state-empty"
                    value={oabState}
                    onChange={(e) => setOabState(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background text-foreground px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {BR_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => handleSaveOab(false)} disabled={isSavingOab || isRemovingOab}>
                  {isSavingOab ? 'Salvando...' : 'Cadastrar minha OAB'}
                </Button>
                <Button type="button" onClick={() => handleSaveOab(true)} disabled={isSavingOab || isRemovingOab}>
                  {isSavingOab ? 'Salvando...' : 'Buscar meus processos agora'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
              Nenhuma OAB primaria cadastrada para este usuario.
            </p>
          )}
        </CardContent>
      </Card>
      )}

      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
        {error ? (
          <span className="text-sm font-medium text-destructive">{error}</span>
        ) : syncMessage ? (
          <span className="text-sm font-medium text-blue-600">{syncMessage}</span>
        ) : saved ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Perfil salvo com sucesso
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Seu avatar e nome sao usados nos modulos internos.</span>
        )}

        <Button type="submit" size="sm" className="gap-2" disabled={isPending}>
          <Save className="h-4 w-4" />
          {isPending ? 'Salvando...' : 'Salvar perfil'}
        </Button>
      </div>
    </form>
  )
}
