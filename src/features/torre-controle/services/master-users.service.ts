// src/features/torre-controle/services/master-users.service.ts

export type ClienteSaasRow = {
  business_id: string
  negocio: string
  nome_responsavel: string | null
  email_financeiro: string | null
  whatsapp: string | null
  cliente_criado_em: string

  assinatura_id: string | null
  assinatura_status: string | null
  plano: string | null
  assinatura_valor: number | null
  trial_started_at: string | null
  trial_ends_at: string | null
  proximo_vencimento: string | null
  forma_pagamento: string | null

  cobranca_id: string | null
  cobranca_status: string | null
  cobranca_valor: number | null
  cobranca_vencimento: string | null
  cobranca_sync_status: string | null
  cobranca_ciclo_tipo: string | null

  alerta_financeiro:
    | "aguardando_cancelamento_manual"
    | "cobranca_pendente"
    | "cobranca_cancelada"
    | "sem_cobranca"
}

export type MasterUserRow = ClienteSaasRow

export type MasterUsersFilters = {
  search?: string
  status?: string
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase()
}

export async function getMasterUsers(
  filters: MasterUsersFilters = {}
): Promise<MasterUserRow[]> {
  const response = await fetch("/api/master/clientes", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })

  const payload = await response.json()

  if (!response.ok || !payload.ok) {
    throw new Error(
      payload.message || "Não consegui carregar a Central de clientes."
    )
  }

  let clientes = (payload.data || []) as MasterUserRow[]

  const search = normalizeSearch(filters.search || "")
  const status = String(filters.status || "").trim()

  if (search) {
    clientes = clientes.filter((cliente) => {
      const content = [
        cliente.negocio,
        cliente.nome_responsavel,
        cliente.email_financeiro,
        cliente.whatsapp,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return content.includes(search)
    })
  }

  if (status && status !== "todos") {
    clientes = clientes.filter((cliente) => {
      if (status === "trialing") {
        return cliente.assinatura_status === "trialing"
      }

      if (status === "awaiting_payment") {
        return cliente.assinatura_status === "awaiting_payment"
      }

      if (status === "canceled") {
        return cliente.assinatura_status === "canceled"
      }

      if (status === "manual_cancel_required") {
        return cliente.alerta_financeiro === "aguardando_cancelamento_manual"
      }

      if (status === "pending_charge") {
        return cliente.cobranca_status === "pending"
      }

      return true
    })
  }

  return clientes
}

export async function createMasterUser() {
  throw new Error(
    "Clientes do SaaS são criados pelo fluxo de cadastro/onboarding, não pela Torre de Controle."
  )
}

export async function isMasterUserByEmail(): Promise<boolean> {
  return false
}