// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\api\master\financeiro\route.ts

import { NextRequest, NextResponse } from "next/server"

import { requireMasterApiUser } from "@/lib/auth/require-master-api"
import { supabaseAdmin } from "@/lib/supabase/admin"

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
}

type BusinessRow = {
  id: string
  name: string | null
  nome_responsavel: string | null
  email_financeiro: string | null
  whatsapp: string | null
}

type AssinaturaRow = {
  id: string
  business_id: string
  status: string | null
  plano: string | null
  payment_method: string | null
}

type FinanceiroItem = {
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
  valor: number
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

function onlyNumbers(value: string | null) {
  return String(value ?? "").replace(/\D/g, "")
}

function toDateInput(value: string | null) {
  const clean = String(value ?? "").trim()

  if (!clean) return null

  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return null

  return clean
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

function getDefaultStartDate() {
  const date = new Date()
  date.setDate(1)

  return date.toISOString().substring(0, 10)
}

function getDefaultEndDate() {
  const date = new Date()

  return date.toISOString().substring(0, 10)
}

function getCurrentCompetencia() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return `${date.getFullYear()}-${month}`
}

function matchesSearch(item: FinanceiroItem, search: string) {
  if (!search) return true

  const content = normalizeText([
    item.cliente,
    item.responsavel,
    item.email_financeiro,
    item.whatsapp,
    item.status,
    item.sync_status,
    item.sync_error,
    item.plano,
    item.forma_pagamento,
    item.competencia,
    item.bling_cobranca_id,
    item.bling_numero_documento,
    item.bling_status_raw,
  ].join(" "))

  return content.includes(search)
}

function matchesStatus(item: FinanceiroItem, statusFilter: string) {
  const status = normalizeStatus(item.status)

  if (!statusFilter || statusFilter === "todos") return true
  if (statusFilter === "a_receber") return status === "pending" || status === "overdue"
  if (statusFilter === "vencido") {
    return status === "overdue" || (status === "pending" && isPastDate(item.vencimento))
  }
  if (statusFilter === "needs_action") return item.needs_action

  return status === statusFilter
}

function getSummary(items: FinanceiroItem[]) {
  return items.reduce(
    (summary, item) => {
      const status = normalizeStatus(item.status)
      const valor = Number(item.valor ?? 0)

      summary.totalCobrancas += 1

      if (status !== "canceled") {
        summary.totalPeriodo += valor
      }

      if (status === "pending" || status === "overdue") {
        summary.aReceber += valor
      }

      if (status === "paid") {
        summary.recebido += valor
      }

      if (status === "overdue" || (status === "pending" && isPastDate(item.vencimento))) {
        summary.vencido += valor
      }

      if (status === "error" || normalizeStatus(item.sync_status) === "error") {
        summary.erros += valor
      }

      if (item.needs_action) {
        summary.acaoManual += 1
      }

      return summary
    },
    {
      totalCobrancas: 0,
      totalPeriodo: 0,
      aReceber: 0,
      recebido: 0,
      vencido: 0,
      erros: 0,
      acaoManual: 0,
    },
  )
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMasterApiUser()

    if (!auth.authorized) {
      return auth.response
    }

    const search = normalizeText(request.nextUrl.searchParams.get("search"))
    const statusFilter = normalizeStatus(
      request.nextUrl.searchParams.get("status") || "todos",
    )

    const competencia = normalizeText(
      request.nextUrl.searchParams.get("competencia"),
    )

    const dateFrom =
      toDateInput(request.nextUrl.searchParams.get("dateFrom")) ||
      getDefaultStartDate()

    const dateTo =
      toDateInput(request.nextUrl.searchParams.get("dateTo")) ||
      getDefaultEndDate()

    const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? 500)
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(Math.floor(limitRaw), 1), 800)
      : 500

    let query = supabaseAdmin
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
          ultima_consulta_bling_em
        `,
      )
      .order("vencimento", { ascending: false })
      .limit(limit)

    if (competencia) {
      query = query.eq("competencia", competencia)
    } else {
      query = query.gte("vencimento", dateFrom).lte("vencimento", dateTo)
    }

    const { data: cobrancas, error: cobrancasError } = await query

    if (cobrancasError) {
      throw cobrancasError
    }

    const cobrancasRows = (cobrancas ?? []) as CobrancaRow[]

    const businessIds = Array.from(
      new Set(cobrancasRows.map((row) => row.business_id).filter(Boolean)),
    )

    const assinaturaIds = Array.from(
      new Set(cobrancasRows.map((row) => row.assinatura_id).filter(Boolean)),
    ) as string[]

    const { data: businesses, error: businessesError } =
      businessIds.length > 0
        ? await supabaseAdmin
            .from("ci_business")
            .select("id, name, nome_responsavel, email_financeiro, whatsapp")
            .in("id", businessIds)
        : { data: [], error: null }

    if (businessesError) {
      throw businessesError
    }

    const { data: assinaturas, error: assinaturasError } =
      assinaturaIds.length > 0
        ? await supabaseAdmin
            .from("ci_assinaturas")
            .select("id, business_id, status, plano, payment_method")
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

    const items: FinanceiroItem[] = cobrancasRows.map((cobranca) => {
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
        valor: Number(cobranca.valor ?? 0),
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

    const searchedItems = items.filter((item) => matchesSearch(item, search))
    const filteredItems = searchedItems.filter((item) =>
      matchesStatus(item, statusFilter),
    )

    return NextResponse.json({
      ok: true,
      filters: {
        dateFrom,
        dateTo,
        competencia: competencia || getCurrentCompetencia(),
        usingCompetencia: Boolean(competencia),
      },
      summary: getSummary(searchedItems),
      data: filteredItems,
    })
  } catch (error) {
    console.error("Erro ao carregar financeiro da Torre:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Não foi possível carregar o financeiro da Torre.",
      },
      { status: 500 },
    )
  }
}