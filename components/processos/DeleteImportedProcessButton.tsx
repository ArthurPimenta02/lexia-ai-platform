'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DeleteImportedProcessButtonProps {
  disabled?: boolean
  isDeleting?: boolean
  onClick: () => void
}

export function DeleteImportedProcessButton({
  disabled = false,
  isDeleting = false,
  onClick,
}: DeleteImportedProcessButtonProps) {
  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={onClick}
      disabled={disabled || isDeleting}
      className="h-8"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {isDeleting ? 'Excluindo...' : 'Excluir'}
    </Button>
  )
}
