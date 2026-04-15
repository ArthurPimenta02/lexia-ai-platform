'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DeleteImportedProcessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cnjNumber: string
  isDeleting?: boolean
  onConfirm: () => void
}

export function DeleteImportedProcessDialog({
  open,
  onOpenChange,
  cnjNumber,
  isDeleting = false,
  onConfirm,
}: DeleteImportedProcessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Excluir processo</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o processo{' '}
            <span className="font-medium text-foreground">{cnjNumber}</span>?
            Esta acao nao pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Excluindo...' : 'Excluir processo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
