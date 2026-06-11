// src/components/subscription/TrialLimitModal.tsx

"use client"

import Link from "next/link"
import { Button } from "@/components/ui/Button"

type Props = {
  open: boolean
  onClose: () => void
}

export function TrialLimitModal({ open, onClose }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[28px] border border-[#dfe7f7] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
            Limite do trial
          </p>

          <h2 className="text-xl font-semibold text-black">
            Você chegou no limite do seu período de teste
          </h2>

          <p className="text-sm leading-7 text-neutral-600">
            Você já começou a organizar seu caixa e agora está no modo visualização.
          </p>

          <p className="text-sm leading-7 text-neutral-600">
            Para continuar registrando entradas e saídas sem perder esse controle,
            libere seu acesso completo.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Voltar
          </Button>

          <Link href="/assinaturas">
            <Button>
              Liberar meu acesso completo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}