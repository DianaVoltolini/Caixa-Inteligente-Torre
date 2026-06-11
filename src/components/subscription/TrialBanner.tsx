// src/components/subscription/TrialBanner.tsx

"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/Button"
import { useBusiness } from "@/contexts/BusinessContext"
import { useSubscription } from "@/features/subscription/hooks/useSubscription"

type Props = {
  diasRestantes?: number
  uso?: number
  limite?: number
}

const TRIAL_DIAS_LIMITE = 7
const TRIAL_LANCAMENTOS_LIMITE = 30
const DAY_IN_MS = 1000 * 60 * 60 * 24

function calcularDiasRestantes(
  trialStartedAt?: string | null,
  trialEndsAt?: string | null,
) {
  const fim = trialEndsAt ? new Date(trialEndsAt) : null

  if (fim && !Number.isNaN(fim.getTime())) {
    const diff = fim.getTime() - Date.now()

    return Math.max(
      0,
      Math.min(
        TRIAL_DIAS_LIMITE,
        Math.ceil(diff / DAY_IN_MS),
      ),
    )
  }

  const inicio = trialStartedAt ? new Date(trialStartedAt) : null

  if (inicio && !Number.isNaN(inicio.getTime())) {
    const trialEnd = new Date(inicio)
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DIAS_LIMITE)

    const diff = trialEnd.getTime() - Date.now()

    return Math.max(
      0,
      Math.min(
        TRIAL_DIAS_LIMITE,
        Math.ceil(diff / DAY_IN_MS),
      ),
    )
  }

  return TRIAL_DIAS_LIMITE
}

export function TrialBanner({
  diasRestantes,
  uso,
  limite,
}: Props) {
  const router = useRouter()
  const { businessId } = useBusiness()

  const {
    subscription,
    transactionCount,
    loading,
  } = useSubscription(businessId)

  const trialInfo = useMemo(() => {
    const trialLimit =
      limite ??
      TRIAL_LANCAMENTOS_LIMITE

    const usedTransactions =
      uso ??
      transactionCount ??
      0

    const remainingDays =
      diasRestantes ??
      calcularDiasRestantes(
        subscription?.trial_started_at,
        subscription?.trial_ends_at,
      )

    return {
      diasRestantes: Math.max(
        0,
        Math.min(TRIAL_DIAS_LIMITE, remainingDays),
      ),
      uso: Math.max(0, usedTransactions),
      limite: trialLimit,
    }
  }, [
    diasRestantes,
    uso,
    limite,
    subscription?.trial_started_at,
    subscription?.trial_ends_at,
    transactionCount,
  ])

  const trialEncerrado =
    trialInfo.diasRestantes <= 0 ||
    trialInfo.uso >= trialInfo.limite

  if (loading) {
    return null
  }

  return (
    <div className="rounded-[28px] border border-[#e2e8f0] bg-[#f8fafc] px-6 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          {trialEncerrado ? (
            <>
              <p className="text-sm font-semibold text-black">
                Seu período de teste terminou
              </p>

              <p className="text-sm text-neutral-600">
                Seus dados continuam visíveis, mas criar, editar e excluir lançamentos fica congelado até ativar seu acesso completo.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-black">
                Você já começou a enxergar seu dinheiro de verdade
              </p>

              <p className="text-sm text-neutral-600">
                Continue registrando seu caixa e evite perder esse controle nos próximos dias.
              </p>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-center">
            <p className="text-[10px] uppercase text-neutral-500">
              Dias
            </p>

            <p className="text-sm font-semibold text-black">
              {trialInfo.diasRestantes}
            </p>
          </div>

          <div className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-center">
            <p className="text-[10px] uppercase text-neutral-500">
              Uso
            </p>

            <p className="text-sm font-semibold text-black">
              {trialInfo.uso}/{trialInfo.limite}
            </p>
          </div>

          <Button
            onClick={() => router.push("/assinaturas")}
            className="px-5 py-2.5"
          >
            Liberar meu acesso completo
          </Button>
        </div>
      </div>
    </div>
  )
}