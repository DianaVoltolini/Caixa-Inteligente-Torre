// src/features/dashboard/components/ActionCard.tsx

"use client"

import { Card } from "@/components/ui/Card"
import { MiniMetric } from "@/features/dashboard/components/MiniMetric"

type ActionCardProps = {
  mediaNecessaria: number
  semanalNecessario: number
  diasRestantes: number
  nextStepText: string
  formatCurrency: (value: number) => string
}

export default function ActionCard({
  mediaNecessaria,
  semanalNecessario,
  diasRestantes,
  nextStepText,
  formatCurrency,
}: ActionCardProps) {
  return (
    <Card className="p-6 md:p-8">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
            Próximo passo
          </p>

          <h2 className="text-xl font-semibold text-black">
            O que você precisa fazer agora
          </h2>

          <p className="text-sm leading-7 text-neutral-600">
            Sua meta só vira realidade quando ela se transforma em ação prática.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <MiniMetric
              label="Por dia"
              value={formatCurrency(mediaNecessaria)}
              tone="primary"
            />

            <MiniMetric
              label="Por semana"
              value={formatCurrency(semanalNecessario)}
            />

            <MiniMetric
              label="Dias restantes"
              value={`${diasRestantes} dias`}
            />
          </div>

          <Card variant="soft" className="p-5 text-sm leading-7">
            {nextStepText}
          </Card>
        </div>
      </div>
    </Card>
  )
}