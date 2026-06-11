// src/features/lancamentos/components/ServicosSelecionados.tsx

"use client"

import { formatCurrency } from "@/lib/formatters"

type SelectedService = {
  service_id: string
  service_name: string
  service_price: number
}

interface Props {
  services: SelectedService[]
  onRemove: (id: string) => void
}

export function ServicosSelecionados({
  services,
  onRemove,
}: Props) {
  if (!services || services.length === 0) {
    return (
      <p className="text-sm text-neutral-400">
        Nenhum serviço adicionado
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {services.map((s) => (
        <div
          key={s.service_id}
          className="flex items-center justify-between rounded-2xl border border-[#d9d9d9] bg-white px-3 py-2.5"
        >
          <div className="min-w-0 pr-3">
            <span className="truncate text-sm font-medium text-slate-800">
              {s.service_name} - {formatCurrency(s.service_price)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onRemove(s.service_id)}
            className="shrink-0 text-xs text-rose-500 transition hover:underline"
          >
            remover
          </button>
        </div>
      ))}
    </div>
  )
}