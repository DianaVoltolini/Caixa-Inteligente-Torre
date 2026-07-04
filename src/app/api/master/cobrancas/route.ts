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

type CobrancaResponseItem = {
  id: string
  business_id: string
  assinatura_id: string | null
  cliente: string
  responsavel: string | null
  email_financeiro: string | null
  whatsapp: string | null
  assinatura_status: string | null
  plano: string | null
  forma_pagamento: string | null
  proximo_vencimento: string | null
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
  needs_action: boolean
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
  const raw = Number(request.nextUrl.searchParams.get("limit") ?? 300)

  if (!Number.isFinite(raw) || raw <= 0) return 300

  return Math.min(500, Math.floor(raw))
}

function matchesStatusFilter(item: CobrancaResponseItem, status: StatusFilter) {
  const normalized = normalizeStatus(item.status)

  if (status === "todos") return true
  if (status === "needs_action") return item.needs_action

  return normalized === status
}

function matchesSearch(item: CobrancaResponseItem, search: string) {
  if (!search) return true

  const content = normalizeText([
    item.cliente,
    item.responsavel,
    item.email_financeiro,
    item.whatsapp,
    item.assinatura_status,
    item.plano,
    item.forma_pagamento,
    item.status,
    item.sync_status,
    item.sync_error,
    item.ciclo_tipo,
    item.competencia,
    item.bling_cobranca_id,
    item.bling_numero_documento,
    item.bling_status_raw,
  ].join(" "))

  return content.includes(search)
}

function getSummary(rows: CobrancaResponseItem[]) {
  return rows.reduce(
    (summary, cobranca) => {
      const status = normalizeStatus(cobranca.status)

      summary.total += 1

      if (status === "pending") summary.pending += 1
      if (status === "overdue") summary.overdue += 1
      if (status === "paid") summary.paid += 1
      if (status === "error") summary.error += 1
      if (status === "canceled") summary.canceled += 1
      if (cobranca.needs_action) summary.needsAction += 1

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

    const cobrancasRows = (cobrancas ?? []) as CobrancaRow[]

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

    const enrichedRows: CobrancaResponseItem[] = cobrancasRows.map((cobranca) => {
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

    const searchedRows = enrichedRows.filter((item) =>
      matchesSearch(item, search),
    )

    const filteredRows = searchedRows.filter((item) =>
      matchesStatusFilter(item, statusFilter),
    )

    return NextResponse.json({
      ok: true,
      summary: getSummary(searchedRows),
      data: filteredRows,
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