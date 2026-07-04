// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\api\master\cobrancas\route.ts

import { NextRequest, NextResponse } from "next/server"

import { requireMasterApiUser } from "@/lib/auth/require-master-api"
import { supabaseAdmin } from "@/lib/supabase/admin"

type StatusFilter =
  | "todos"
  | "pending"
  | "overdue"
  | "paid"
  | "error"
  | "canceled"
  | "needs_action"

type CobrancaRow = {
  id: string
  business_id: string
  assinatura_id: string | null
  valor: number | null
  vencimento: string | null
  status: string | null
  sync_status: string | null
  sync_error: string | null
  ciclo_tipo: string | null
  competencia: string | null
  created_at: string | null
  pago_em: string | null
  bling_cobranca_id: string | null
  bling_numero_documento: string | null
  bling_link_pagamento: string | null
  bling_status_raw: string | null
  ultima_consulta_bling_em: string | null
  metadata: Record<string, unknown> | null
}

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

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function normalizeStatus(value: unknown) {
  const status = normalizeText(value)

  if (status === "cancelled") return "canceled"

  return status
}

function isPastDate(value: string | null) {
  if (!value) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const date = new Date(`${String(value).substring(0, 10)}T00:00:00`)
  date.setHours(0, 0, 0, 0)

  return Number.isFinite(date.getTime()) && date < today
}

function isNeedsAction(cobranca: CobrancaRow) {
  const status = normalizeStatus(cobranca.status)
  const syncStatus = normalizeStatus(cobranca.sync_status)

  if (status === "error") return true
  if (syncStatus === "error") return true

  if (
    (status === "pending" || status === "overdue") &&
    isPastDate(cobranca.vencimento)
  ) {
    return true
  }

  return false
}

function getStatusFilter(request: NextRequest): StatusFilter {
  const value = normalizeStatus(request.nextUrl.searchParams.get("status"))

  if (
    value === "pending" ||
    value === "overdue" ||
    value === "paid" ||
    value === "error" ||
    value === "canceled" ||
    value === "needs_action"
  ) {
    return value
  }

  return "todos"
}

function getLimit(request: NextRequest) {
  const raw = Number(request.nextUrl.searchParams.get("limit") ?? 200)

  if (!Number.isFinite(raw) || raw <= 0) return 200

  return Math.min(500, Math.floor(raw))
}

function matchesSearch(params: {
  search: string
  cobranca: CobrancaRow
  business: BusinessRow | null
  assinatura: AssinaturaRow | null
}) {
  if (!params.search) return true

  const content = normalizeText([
    params.business?.name,
    params.business?.nome_responsavel,
    params.business?.email_financeiro,
    params.business?.whatsapp,
    params.assinatura?.plano,
    params.assinatura?.status,
    params.cobranca.status,
    params.cobranca.bling_cobranca_id,
    params.cobranca.bling_numero_documento,
    params.cobranca.competencia,
  ].join(" "))

  return content.includes(params.search)
}

function matchesStatusFilter(cobranca: CobrancaRow, status: StatusFilter) {
  const normalized = normalizeStatus(cobranca.status)

  if (status === "todos") return true
  if (status === "needs_action") return isNeedsAction(cobranca)

  return normalized === status
}

function getSummary(rows: CobrancaRow[]) {
  return rows.reduce(
    (summary, cobranca) => {
      const status = normalizeStatus(cobranca.status)

      summary.total += 1

      if (status === "pending") summary.pending += 1
      if (status === "overdue") summary.overdue += 1
      if (status === "paid") summary.paid += 1
      if (status === "error") summary.error += 1
      if (status === "canceled") summary.canceled += 1
      if (isNeedsAction(cobranca)) summary.needsAction += 1

      return summary
    },
    {
      total: 0,
      pending: 0,
      overdue: 0,
      paid: 0,
      error: 0,
      canceled: 0,
      needsAction: 0,
    },
  )
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMasterApiUser()

    if (!auth.authorized) {
      return auth.response
    }

    const statusFilter = getStatusFilter(request)
    const limit = getLimit(request)
    const search = normalizeText(request.nextUrl.searchParams.get("search"))

    const { data: cobrancas, error: cobrancasError } = await supabaseAdmin
      .from("ci_cobrancas")
      .select(
        `
          id,
          business_id,
          assinatura_id,
          valor,
          vencimento,
          status,
          sync_status,
          sync_error,
          ciclo_tipo,
          competencia,
          created_at,
          pago_em,
          bling_cobranca_id,
          bling_numero_documento,
          bling_link_pagamento,
          bling_status_raw,
          ultima_consulta_bling_em,
          metadata
        `,
      )
      .order("created_at", { ascending: false })
      .limit(limit)

    if (cobrancasError) {
      throw cobrancasError
    }

    const cobrancasRows = ((cobrancas ?? []) as CobrancaRow[]).filter(
      (cobranca) => matchesStatusFilter(cobranca, statusFilter),
    )

    const businessIds = Array.from(
      new Set(
        cobrancasRows
          .map((cobranca) => cobranca.business_id)
          .filter(Boolean),
      ),
    )

    const assinaturaIds = Array.from(
      new Set(
        cobrancasRows
          .map((cobranca) => cobranca.assinatura_id)
          .filter(Boolean),
      ),
    ) as string[]

    const { data: businesses, error: businessesError } =
      businessIds.length > 0
        ? await supabaseAdmin
            .from("ci_business")
            .select(
              "id, name, nome_responsavel, email_financeiro, whatsapp, created_at",
            )
            .in("id", businessIds)
        : { data: [], error: null }

    if (businessesError) {
      throw businessesError
    }

    const { data: assinaturas, error: assinaturasError } =
      assinaturaIds.length > 0
        ? await supabaseAdmin
            .from("ci_assinaturas")
            .select(
              "id, business_id, status, plano, valor, trial_started_at, trial_ends_at, proximo_vencimento, payment_method, created_at",
            )
            .in("id", assinaturaIds)
        : { data: [], error: null }

    if (assinaturasError) {
      throw assinaturasError
    }

    const businessMap = new Map<string, BusinessRow>()
    const assinaturaMap = new Map<string, AssinaturaRow>()

    ;((businesses ?? []) as BusinessRow[]).forEach((business) => {
      businessMap.set(business.id, business)
    })

    ;((assinaturas ?? []) as AssinaturaRow[]).forEach((assinatura) => {
      assinaturaMap.set(assinatura.id, assinatura)
    })

    const data = cobrancasRows
      .map((cobranca) => {
        const business = businessMap.get(cobranca.business_id) ?? null
        const assinatura = cobranca.assinatura_id
          ? assinaturaMap.get(cobranca.assinatura_id) ?? null
          : null

        return {
          id: cobranca.id,
          business_id: cobranca.business_id,
          assinatura_id: cobranca.assinatura_id,
          cliente: business?.name ?? "Cliente sem nome",
          responsavel: business?.nome_responsavel ?? null,
          email_financeiro: business?.email_financeiro ?? null,
          whatsapp: business?.whatsapp ?? null,
          assinatura_status: assinatura?.status ?? null,
          plano: assinatura?.plano ?? null,
          forma_pagamento: assinatura?.payment_method ?? null,
          proximo_vencimento: assinatura?.proximo_vencimento ?? null,
          valor: cobranca.valor,
          vencimento: cobranca.vencimento,
          status: cobranca.status,
          sync_status: cobranca.sync_status,
          sync_error: cobranca.sync_error,
          ciclo_tipo: cobranca.ciclo_tipo,
          competencia: cobranca.competencia,
          created_at: cobranca.created_at,
          pago_em: cobranca.pago_em,
          bling_cobranca_id: cobranca.bling_cobranca_id,
          bling_numero_documento: cobranca.bling_numero_documento,
          bling_link_pagamento: cobranca.bling_link_pagamento,
          bling_status_raw: cobranca.bling_status_raw,
          ultima_consulta_bling_em: cobranca.ultima_consulta_bling_em,
          needs_action: isNeedsAction(cobranca),
        }
      })
      .filter((item) =>
        matchesSearch({
          search,
          cobranca: {
            id: item.id,
            business_id: item.business_id,
            assinatura_id: item.assinatura_id,
            valor: item.valor,
            vencimento: item.vencimento,
            status: item.status,
            sync_status: item.sync_status,
            sync_error: item.sync_error,
            ciclo_tipo: item.ciclo_tipo,
            competencia: item.competencia,
            created_at: item.created_at,
            pago_em: item.pago_em,
            bling_cobranca_id: item.bling_cobranca_id,
            bling_numero_documento: item.bling_numero_documento,
            bling_link_pagamento: item.bling_link_pagamento,
            bling_status_raw: item.bling_status_raw,
            ultima_consulta_bling_em: item.ultima_consulta_bling_em,
            metadata: null,
          },
          business: {
            id: item.business_id,
            name: item.cliente,
            nome_responsavel: item.responsavel,
            email_financeiro: item.email_financeiro,
            whatsapp: item.whatsapp,
            created_at: null,
          },
          assinatura: item.assinatura_id
            ? {
                id: item.assinatura_id,
                business_id: item.business_id,
                status: item.assinatura_status,
                plano: item.plano,
                valor: null,
                trial_started_at: null,
                trial_ends_at: null,
                proximo_vencimento: item.proximo_vencimento,
                payment_method: item.forma_pagamento,
                created_at: null,
              }
            : null,
        }),
      )

    return NextResponse.json({
      ok: true,
      summary: getSummary(cobrancasRows),
      data,
    })
  } catch (error) {
    console.error("Erro ao carregar cobranças da Torre:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Não foi possível carregar as cobranças da Torre.",
      },
      { status: 500 },
    )
  }
}