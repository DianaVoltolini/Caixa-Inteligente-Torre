// src/features/configuracoes/hooks/usePerfil.ts

"use client"

import { useState } from "react"
import { useAccount } from "@/contexts/AccountContext"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export function usePerfil() {
  const { user, business, subscription, loading } = useAccount()

  const [openDelete, setOpenDelete] = useState(false)

  // ✅ STATUS
  const isActive = subscription?.status === "active"

  // ✅ PLANO
  const plano = isActive
    ? "Plano Lucro Real"
    : "Plano Lucro Real - Trial"

  // ✅ VALOR
  const valorPlano = isActive ? formatCurrency(29.9) : "-"

  // ✅ VENCIMENTO (NOVO PADRÃO)
  const vencimento =
    isActive && subscription?.proximo_vencimento
      ? new Date(subscription.proximo_vencimento).toLocaleDateString("pt-BR")
      : "-"

  // ✅ STATUS HUMANO (ALINHADO COM SEU BACKEND)
  let status = "Trial ativo"

  if (subscription?.status === "active") {
    status = "Ativo"
  }

  if (subscription?.status === "awaiting_payment") {
    status = "Aguardando pagamento"
  }

  if (subscription?.status === "grace_period") {
    status = "Pagamento pendente"
  }

  if (subscription?.status === "overdue") {
    status = "Pagamento pendente"
  }

  if (subscription?.status === "canceled") {
    status = "Cancelado"
  }

  return {
    user,
    business,
    subscription,
    plano,
    valorPlano,
    vencimento,
    status,
    openDelete,
    setOpenDelete,
    loading: Boolean(loading && !business && !user),
  }
}