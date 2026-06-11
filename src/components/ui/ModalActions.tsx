// src/components/ui/ModalActions.tsx

"use client"

import { Button } from "./Button"

interface Props {
  onCancel: () => void
  onSave: () => void
  onSaveAndContinue?: () => void
  showSaveAndContinue?: boolean
  loading?: boolean
}

export function ModalActions({
  onCancel,
  onSave,
  onSaveAndContinue,
  showSaveAndContinue = true,
  loading = false,
}: Props) {
  return (
    <div className="flex flex-col gap-3 border-t border-[#d9d9d9] pt-4 sm:flex-row sm:justify-end">
      <Button
        variant="secondary"
        onClick={onCancel}
        disabled={loading}
      >
        Cancelar
      </Button>

      {showSaveAndContinue && onSaveAndContinue && (
        <Button
          variant="secondary"
          onClick={onSaveAndContinue}
          disabled={loading}
        >
          {loading ? "Salvando..." : "Salvar e continuar"}
        </Button>
      )}

      <Button
        onClick={onSave}
        disabled={loading}
        loading={loading}
      >
        Salvar
      </Button>
    </div>
  )
}