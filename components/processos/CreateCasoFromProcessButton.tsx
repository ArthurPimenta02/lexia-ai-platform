'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createCasoFromImportedProcess } from '@/actions/processos-importados'

interface CreateCasoFromProcessButtonProps {
  processoId: string
  disabled?: boolean
  onSuccess?: (casoId: string) => void
}

export function CreateCasoFromProcessButton({
  processoId,
  disabled,
  onSuccess,
}: CreateCasoFromProcessButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await createCasoFromImportedProcess(processoId)
      if ('error' in result) {
        alert(result.error)
        return
      }

      onSuccess?.(result.casoId)
      router.refresh()
    })
  }

  return (
    <Button
      type="button"
      size="sm"
      className="gap-2"
      onClick={handleClick}
      disabled={disabled || isPending}
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
      {isPending ? 'Criando...' : 'Criar caso'}
    </Button>
  )
}
