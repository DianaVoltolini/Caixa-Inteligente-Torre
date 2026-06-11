"use client"

import { Card } from "@/components/ui/Card"
import { MiniMetric } from "@/features/dashboard/components/MiniMetric"

type HeroResultCardProps = {
  profit: number
  revenue: number
  expense: number
  mediaAtual: number
  lucroPercentual: number
  formatCurrency: (value: number) => string
}

function ScoreRing({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value))

  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <path
          d="M18 2 a 16 16 0 1 1 0 32 a 16 16 0 1 1 0 -32"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="3"
        />
        <path
          d="M18 2 a 16 16 0 1 1 0 32 a 16 16 0 1 1 0 -32"
          fill="none"
          stroke="#002198"
          strokeWidth="3"
          strokeDasharray={`${safeValue}, 100`}
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[#002198]">
          {safeValue.toFixed(0)}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
          Score
        </span>
      </div>
    </div>
  )
}

function DiagnosisPill({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-full border border-[#dbe3f4] bg-white/85 px-3 py-1.5 text-xs font-medium text-neutral-600">
      <span className="text-neutral-500">{label}: </span>
      <span className="font-semibold text-black">{value}</span>
    </div>
  )
}

export function HeroResultCard({
  profit,
  revenue,
  expense,
  mediaAtual,
  lucroPercentual,
  formatCurrency,
}: HeroResultCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-[#e8eef9] bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_45%,#eef3ff_100%)] p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
              Seu resultado principal
            </p>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-black md:text-2xl">
                Isso ficou pra você
              </h2>

              <p
                className={`text-4xl font-bold tracking-tight md:text-5xl ${
                  profit >= 0 ? "text-black" : "text-rose-600"
                }`}
              >
                {formatCurrency(profit)}
              </p>
            </div>

            <p className="max-w-xl text-sm leading-7 text-neutral-600 md:text-base">
              Esse é o número mais importante do seu dashboard. Não é o quanto entrou.
              É o quanto realmente sobrou pra você depois de tudo.
            </p>
          </div>

          <div className="flex justify-start md:justify-end">
            <div className="rounded-[28px] border border-[#dbe3f4] bg-white/90 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
              <ScoreRing value={lucroPercentual} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <DiagnosisPill label="Entrou" value={formatCurrency(revenue)} />
          <DiagnosisPill label="Saiu" value={formatCurrency(expense)} />
          <DiagnosisPill
            label="Margem"
            value={`${lucroPercentual.toFixed(1)}%`}
          />
        </div>
      </div>

      <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
        <MiniMetric
          label="Entrou no seu caixa"
          value={formatCurrency(revenue)}
          tone="primary"
        />
        <MiniMetric
          label="Foi embora sem você ver"
          value={formatCurrency(expense)}
          tone="danger"
        />
        <MiniMetric
          label="Em média por dia"
          value={formatCurrency(mediaAtual)}
        />
      </div>
    </Card>
  )
}