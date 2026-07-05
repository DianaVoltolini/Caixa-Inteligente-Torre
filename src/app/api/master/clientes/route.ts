// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\api\master\clientes\route.ts

import { NextResponse } from "next/server"

import { requireMasterApiUser } from "@/lib/auth/require-master-api"
import { supabaseAdmin } from "@/lib/supabase/admin"

type BusinessRow = {
  id: string
  name: string | null
  nome_responsavel: string | null
  email_financeiro: string | null
  whatsapp: string | null
  created_at: string | null
}

type AssinaturaRow = {
  id: string
  business_id: string
  status: string | null
  plano: string | null
  valor: number | null
  trial_started_at: string | null
  trial_ends_at: string | null
  proximo_vencimento: string | null
  payment_method: string | null
  created_at: string | null
}

type CobrancaRow = {
  id: string
  business_id: string
  assinatura_id: string | null
  valor: number | null
  vencimento: string | null
  status: string | null
  sync_status: string | null
  ciclo_tipo: string | null
  created_at: string | null
  bling_cobranca_id?: string | null
  bling_link_pagamento?: string | null
}

type TransactionRow = {
  business_id: string
}

type CobrancaStatus =
  | "aguardando_cancelamento_manual"
  | "cobranca_pendente"
  | "cobranca_cancelada"
  | "cobranca_com_erro"
  | "sem_cobranca"

function isPastDate(value: string | null) {
  if (!value) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const date = new Date(`${String(value).substring(0, 10)}T00:00:00`)
  date.setHours(0, 0, 0, 0)

  return Number.isFinite(date.getTime()) && date < today
}

function getAlertaFinanceiro(cobranca: CobrancaRow | undefined): CobrancaStatus {
  if (!cobranca) return "sem_cobranca"

  if (cobranca.status === "error" || cobranca.sync_status === "error") {
    return "cobranca_com_erro"
  }

  if (
    (cobranca.status === "pending" || cobranca.status === "overdue") &&
    isPastDate(cobranca.vencimento)
  ) {
    return "aguardando_cancelamento_manual"
  }

  if (cobranca.status === "pending" || cobranca.status === "overdue") {
    return "cobranca_pendente"
  }

  if (cobranca.status === "canceled") {
    return "cobranca_cancelada"
  }

  return "sem_cobranca"
}

export async function GET() {
  try {
    const auth = await requireMasterApiUser()

    if (!auth.authorized) {
      return auth.response
    }

    const { data: businessesData, error: businessError } = await supabaseAdmin
      .from("ci_business")
      .select(
        "id, name, nome_responsavel, email_financeiro, whatsapp, created_at",
      )
      .order("created_at", { ascending: false })

    if (businessError) {
      throw businessError
    }

    const businesses = (businessesData ?? []) as BusinessRow[]
    const businessIds = businesses.map((business) => business.id)

    if (businessIds.length === 0) {
      return NextResponse.json({
        ok: true,
        success: true,
        data: [],
      })
    }

    const { data: assinaturasData, error: assinaturaError } =
      await supabaseAdmin
        .from("ci_assinaturas")
        .select(
          "id, business_id, status, plano, valor, trial_started_at, trial_ends_at, proximo_vencimento, payment_method, created_at",
        )
        .in("business_id", businessIds)
        .order("created_at", { ascending: false })

    if (assinaturaError) {
      throw assinaturaError
    }

    const { data: cobrancasData, error: cobrancaError } = await supabaseAdmin
      .from("ci_cobrancas")
      .select(
        "id, business_id, assinatura_id, valor, vencimento, status, sync_status, ciclo_tipo, created_at, bling_cobranca_id, bling_link_pagamento",
      )
      .in("business_id", businessIds)
      .order("created_at", { ascending: false })

    if (cobrancaError) {
      throw cobrancaError
    }

    const { data: transactionsData, error: transactionsError } =
      await supabaseAdmin
        .from("ci_transactions")
        .select("business_id")
        .in("business_id", businessIds)

    if (transactionsError) {
      console.error(
        "Erro ao contar lançamentos para Torre:",
        transactionsError,
      )
    }

    const assinaturas = (assinaturasData ?? []) as AssinaturaRow[]
    const cobrancas = (cobrancasData ?? []) as CobrancaRow[]
    const transactions = (transactionsData ?? []) as TransactionRow[]

    const assinaturaPorBusiness = new Map<string, AssinaturaRow>()
    const cobrancaPorBusiness = new Map<string, CobrancaRow>()
    const totalLancamentosPorBusiness = new Map<string, number>()

    assinaturas.forEach((assinatura) => {
      if (!assinaturaPorBusiness.has(assinatura.business_id)) {
        assinaturaPorBusiness.set(assinatura.business_id, assinatura)
      }
    })

    cobrancas.forEach((cobranca) => {
      if (!cobrancaPorBusiness.has(cobranca.business_id)) {
        cobrancaPorBusiness.set(cobranca.business_id, cobranca)
      }
    })

    transactions.forEach((transaction) => {
      const current = totalLancamentosPorBusiness.get(transaction.business_id) ?? 0
      totalLancamentosPorBusiness.set(transaction.business_id, current + 1)
    })

    const clientes = businesses.map((business) => {
      const assinatura = assinaturaPorBusiness.get(business.id)
      const cobranca = cobrancaPorBusiness.get(business.id)

      return {
        business_id: business.id,
        negocio: business.name,
        name: business.name,
        nome_responsavel: business.nome_responsavel,
        email_financeiro: business.email_financeiro,
        whatsapp: business.whatsapp,
        cliente_criado_em: business.created_at,

        assinatura_id: assinatura?.id || null,
        assinatura_status: assinatura?.status || null,
        plano: assinatura?.plano || null,
        assinatura_valor: assinatura?.valor || null,
        trial_started_at: assinatura?.trial_started_at || null,
        trial_ends_at: assinatura?.trial_ends_at || null,
        proximo_vencimento: assinatura?.proximo_vencimento || null,
        forma_pagamento: assinatura?.payment_method || null,
        assinatura_criada_em: assinatura?.created_at || null,

        total_lancamentos: totalLancamentosPorBusiness.get(business.id) ?? 0,

        cobranca_id: cobranca?.id || null,
        cobranca_status: cobranca?.status || null,
        cobranca_valor: cobranca?.valor || null,
        cobranca_vencimento: cobranca?.vencimento || null,
        cobranca_sync_status: cobranca?.sync_status || null,
        cobranca_ciclo_tipo: cobranca?.ciclo_tipo || null,
        cobranca_bling_id: cobranca?.bling_cobranca_id || null,
        cobranca_link_pagamento: cobranca?.bling_link_pagamento || null,

        alerta_financeiro: getAlertaFinanceiro(cobranca),
      }
    })

    return NextResponse.json({
      ok: true,
      success: true,
      data: clientes,
    })
  } catch (error) {
    console.error("Erro ao carregar Central de clientes:", error)

    return NextResponse.json(
      {
        ok: false,
        success: false,
        message: "Não foi possível carregar a Central de clientes.",
      },
      { status: 500 },
    )
  }
}