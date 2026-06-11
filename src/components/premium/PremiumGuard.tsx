// src/components/premium/PremiumGuard.tsx

"use client"

import { ReactNode } from "react"
import { useUserPlan } from "@/store/UserPlanStore"

type Props = {
  children: ReactNode
}

export function PremiumGuard({ children }: Props) {

  const { plan, loading } = useUserPlan()

  if (loading) {

    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        Carregando...
      </div>
    )

  }

  if (plan !== "premium") {

    return (

      <div className="bg-white border border-amber-200 rounded-2xl p-8 text-center shadow-sm space-y-4">

        <h2 className="text-xl font-semibold text-slate-800">
          🔒 Esse recurso ainda não está disponível
        </h2>

        <p className="text-sm text-slate-500">
          Esse tipo de visão ajuda você a entender exatamente para onde está indo o seu dinheiro.
        </p>

        <button
          className="px-6 py-3 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 transition"
        >
          Quero ter mais controle do meu dinheiro
        </button>

      </div>

    )

  }

  return <>{children}</>

}