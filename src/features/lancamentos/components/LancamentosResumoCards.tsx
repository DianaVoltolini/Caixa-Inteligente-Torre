// src/features/lancamentos/components/LancamentosResumoCards.tsx

"use client"

import { Card, IconButton } from "@/components/ui"

type Props = {
  resumo?: {
    receitas: number
    despesas: number
    saldo: number
  }
  onNovaReceita?: () => void
  onNovaDespesa?: () => void
  onFiltrarReceitas?: () => void
  onFiltrarDespesas?: () => void
  onLimparFiltro?: () => void
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function SummaryCard({
  title,
  value,
  description,
  valueClassName,
  onClick,
  onActionClick,
}: {
  title: string
  value: string
  description: string
  valueClassName: string
  onClick?: () => void
  onActionClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick?.()
        }
      }}
      className="cursor-pointer"
    >
      <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)] transition hover:border-[#cfd8ff]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-sm text-neutral-500">{title}</p>

            <p className={`text-xl font-bold ${valueClassName}`}>{value}</p>

            <p className="text-xs text-neutral-400">{description}</p>
          </div>

          {onActionClick ? (
            <IconButton
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                event.stopPropagation()
                onActionClick(event)
              }}
            >
              +
            </IconButton>
          ) : null}
        </div>
      </Card>
    </div>
  )
}

export function LancamentosResumoCards({
  resumo,
  onNovaReceita,
  onNovaDespesa,
  onFiltrarReceitas,
  onFiltrarDespesas,
  onLimparFiltro,
}: Props) {
  const receitas = resumo?.receitas ?? 0
  const despesas = resumo?.despesas ?? 0
  const saldo = resumo?.saldo ?? 0

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <SummaryCard
        title="Entradas do período"
        value={formatCurrency(receitas)}
        description="Tudo que entrou no seu caixa"
        valueClassName="text-emerald-600"
        onClick={onFiltrarReceitas}
        onActionClick={() => onNovaReceita?.()}
      />

      <SummaryCard
        title="Saídas do período"
        value={formatCurrency(despesas)}
        description="Tudo que saiu do seu caixa"
        valueClassName="text-rose-600"
        onClick={onFiltrarDespesas}
        onActionClick={() => onNovaDespesa?.()}
      />

      <SummaryCard
        title="Quanto sobrou pra você"
        value={formatCurrency(saldo)}
        description="Esse é o dinheiro que realmente ficou no seu bolso"
        valueClassName={saldo >= 0 ? "text-[#002198]" : "text-rose-600"}
        onClick={onLimparFiltro}
      />
    </div>
  )
}