// src/components/subscription/TrialProgressWidget.tsx

"use client"

import { useMemo } from "react"

import { useAccount } from "@/contexts/AccountContext"
import { useBusiness } from "@/contexts/BusinessContext"
import { useSubscription } from "@/features/subscription/hooks/useSubscription"
import { evaluateFeatures } from "@/lib/subscription/featureGate"

type TrialProgressWidgetProps = {
  className?: string
}

export function TrialProgressWidget({
  className = "",
}: TrialProgressWidgetProps) {
  const { businessId } = useBusiness()
  const { subscription: accountSubscription } = useAccount()
  const { subscription: snapshotSubscription, transactionCount } = useSubscription(businessId)

  const effectiveSubscription = accountSubscription ?? snapshotSubscription ?? null

  const trialData = useMemo(() => {
    if (!effectiveSubscription) {
      return null
    }

    const hasTrial =
      Boolean(effectiveSubscription.trial_started_at) &&
      Boolean(effectiveSubscription.trial_ends_at)

    if (!hasTrial) {
      return null
    }

    const access = evaluateFeatures(
      effectiveSubscription as any,
      transactionCount ?? 0,
    )

    return {
      daysLeft: Math.max(0, access.daysRemaining),
      usedTransactions: Math.max(0, transactionCount ?? 0),
      maxTransactions: effectiveSubscription.max_transactions ?? 30,
      isViewOnlyMode:
        access.trialExpired || access.remainingTransactions <= 0,
    }
  }, [effectiveSubscription, transactionCount])

  if (!trialData) {
    return null
  }

  return (
    <div
      className={`rounded-2xl border border-[#cfd8ff] bg-[#eeeeee] p-4 shadow-[0_4px_18px_rgba(0,0,0,0.04)] ${className}`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[#002198]">
            {trialData.isViewOnlyMode
              ? "Seus dados continuam visíveis."
              : "Você já começou a organizar seu dinheiro."}
          </p>

          <p className="mt-1 text-xs text-neutral-600">
            {trialData.isViewOnlyMode
              ? "Seu período atual está em modo visualização. Para voltar a registrar e editar, ative seu acesso completo."
              : "Aproveite esse período para registrar seu movimento e entender o que realmente sobra no fim do mês."}
          </p>
        </div>

        <div className="flex gap-2 lg:justify-end">
          <div className="min-w-[110px] rounded-[16px] border border-[#e3e7ef] bg-[#f4f4f4] px-3 py-2">
            <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
              Dias restantes
            </p>

            <p className="mt-1 text-[16px] leading-none font-semibold text-slate-800">
              {trialData.daysLeft}
            </p>
          </div>

          <div className="min-w-[125px] rounded-[16px] border border-[#e3e7ef] bg-[#f4f4f4] px-3 py-2">
            <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
              Lançamentos
            </p>

            <p className="mt-1 text-[16px] leading-none font-semibold text-slate-800">
              {trialData.usedTransactions} de {trialData.maxTransactions}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}