// src/app/api/master/clientes/route.ts

import { NextResponse } from "next/server"

import { requireMasterApiUser } from "@/lib/auth/require-master-api"
import { supabaseAdmin } from "@/lib/supabase/admin"

type CobrancaStatus =
  | "aguardando_cancelamento_manual"
  | "cobranca_pendente"
  | "cobranca_cancelada"
  | "sem_cobranca"

function isPastDate(value: string | null) {
  if (!value) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const date = new Date(`${value}T00:00:00`)
  date.setHours(0, 0, 0, 0)

  return date < today
}

function getAlertaFinanceiro(cobranca: any): CobrancaStatus {
  if (!cobranca) return "sem_cobranca"

  if (cobranca.status === "pending" && isPastDate(cobranca.vencimento)) {
    return "aguardando_cancelamento_manual"
  }

  if (cobranca.status === "pending") {
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

    const { data: businesses, error: businessError } = await supabaseAdmin
      .from("ci_business")
      .select(
        "id, name, nome_responsavel, email_financeiro, whatsapp, created_at"
      )
      .order("created_at", { ascending: false })

    if (businessError) {
      throw businessError
    }

    const businessIds = (businesses || []).map((business) => business.id)

    if (businessIds.length === 0) {
      return NextResponse.json({
        ok: true,
        data: [],
      })
    }

    const { data: assinaturas, error: assinaturaError } = await supabaseAdmin
      .from("ci_assinaturas")
      .select(
        "id, business_id, status, plano, valor, trial_started_at, trial_ends_at, proximo_vencimento, payment_method, created_at"
      )
      .in("business_id", businessIds)
      .order("created_at", { ascending: false })

    if (assinaturaError) {
      throw assinaturaError
    }

    const { data: cobrancas, error: cobrancaError } = await supabaseAdmin
      .from("ci_cobrancas")
      .select(
        "id, business_id, assinatura_id, valor, vencimento, status, sync_status, ciclo_tipo, created_at"
      )
      .in("business_id", businessIds)
      .order("created_at", { ascending: false })

    if (cobrancaError) {
      throw cobrancaError
    }

    const assinaturaPorBusiness = new Map<string, any>()
    const cobrancaPorBusiness = new Map<string, any>()

    ;(assinaturas || []).forEach((assinatura) => {
      if (!assinaturaPorBusiness.has(assinatura.business_id)) {
        assinaturaPorBusiness.set(assinatura.business_id, assinatura)
      }
    })

    ;(cobrancas || []).forEach((cobranca) => {
      if (!cobrancaPorBusiness.has(cobranca.business_id)) {
        cobrancaPorBusiness.set(cobranca.business_id, cobranca)
      }
    })

    const clientes = (businesses || []).map((business) => {
      const assinatura = assinaturaPorBusiness.get(business.id)
      const cobranca = cobrancaPorBusiness.get(business.id)

      return {
        business_id: business.id,
        negocio: business.name,
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

        cobranca_id: cobranca?.id || null,
        cobranca_status: cobranca?.status || null,
        cobranca_valor: cobranca?.valor || null,
        cobranca_vencimento: cobranca?.vencimento || null,
        cobranca_sync_status: cobranca?.sync_status || null,
        cobranca_ciclo_tipo: cobranca?.ciclo_tipo || null,

        alerta_financeiro: getAlertaFinanceiro(cobranca),
      }
    })

    return NextResponse.json({
      ok: true,
      data: clientes,
    })
  } catch (error) {
    console.error("Erro ao carregar Central de clientes:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Não foi possível carregar a Central de clientes.",
      },
      { status: 500 }
    )
  }
}