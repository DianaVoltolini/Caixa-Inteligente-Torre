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

type TipoFilter = "todos" | "ativacao" | "renovacao"

type TipoCode = "ativacao" | "renovacao" | "outro"

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
  gerada_em: string | null
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
  tipo_code: TipoCode
  tipo_label: string
  competencia: string | null
  gerada_em: string | null
  created_at: string | null
  data_criacao: string | null
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

function toDateInput(value: string | null) {
  const clean = String(value ?? "").trim()

  if (!clean) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return null

  return clean
}

function toDateOnly(value: string | null) {
  if (!value) return null

  return String(value).substring(0, 10)
}

function getTimestamp(value: string | null) {
  if (!value) return 0

  const date = new Date(value)

  return Number.isFinite(date.getTime()) ? date.getTime() : 0
}

function isPastDate(value: string | null) {
  if (!value) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const date = new Date(`${String(value).substring(0, 10)}T00:00:00`)
  date.setHours(0, 0, 0, 0)

  return Number.isFinite(date.getTime()) && date < today
}

function getChargeCreatedAt(cobranca: CobrancaRow) {
  return cobranca.gerada_em || cobranca.created_at || null
}

function getMetadataText(metadata: Record<string, unknown> | null) {
  if (!metadata) return ""

  return normalizeText(JSON.stringify(metadata))
}

function getTipoCode(
  cicloTipo: string | null,
  metadata: Record<string, unknown> | null,
): TipoCode {
  const normalized = normalizeText(cicloTipo)
  const metadataText = getMetadataText(metadata)
  const text = `${normalized} ${metadataText}`

  if (
    text.includes("first_charge") ||
    text.includes("first") ||
    text.includes("ativacao") ||
    text.includes("ativação") ||
    text.includes("ativ")
  ) {
    return "ativacao"
  }

  if (
    text.includes("recurring") ||
    text.includes("recurrence") ||
    text.includes("mensalidade") ||
    text.includes("renovacao") ||
    text.includes("renovação") ||
    text.includes("renov") ||
    text.includes("recorr")
  ) {
    return "renovacao"
  }

  return "outro"
}

function getTipoLabel(tipo: TipoCode, originalValue: string | null) {
  if (tipo === "ativacao") return "Ativação"
  if (tipo === "renovacao") return "Renovação"

  return originalValue || "Não informado"
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

function getTipoFilter(request: NextRequest): TipoFilter {
  const value = normalizeText(request.nextUrl.searchParams.get("tipo"))

  if (value === "ativacao" || value === "renovacao") {
    return value
  }

  return "todos"
}

function getLimit(request: NextRequest) {
  const raw = Number(request.nextUrl.searchParams.get("limit") ?? 1000)

  if (!Number.isFinite(raw) || raw <= 0) return 1000

  return Math.min(2000, Math.floor(raw))
}

function matchesStatusFilter(item: CobrancaResponseItem, status: StatusFilter) {
  const normalized = normalizeStatus(item.status)

  if (status === "todos") return true
  if (status === "needs_action") return item.needs_action
  if (status === "pending") return normalized === "pending" && !isPastDate(item.vencimento)
  if (status === "overdue") {
    return normalized === "overdue" || (normalized === "pending" && isPastDate(item.vencimento))
  }

  return normalized === status
}

function matchesTipoFilter(item: CobrancaResponseItem, tipo: TipoFilter) {
  if (tipo === "todos") return true

  return item.tipo_code === tipo
}

function matchesDateFilter(
  item: CobrancaResponseItem,
  dateFrom: string | null,
  dateTo: string | null,
) {
  if (!dateFrom && !dateTo) return true

  const dataCriacao = toDateOnly(item.data_criacao)

  if (!dataCriacao) return false
  if (dateFrom && dataCriacao < dateFrom) return false
  if (dateTo && dataCriacao > dateTo) return false

  return true
}

function matchesSearch(item: CobrancaResponseItem, search: string) {
  if (!search) return true

  const content = normalizeText(
    [
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
      item.tipo_label,
      item.competencia,
      item.bling_cobranca_id,
      item.bling_numero_documento,
      item.bling_status_raw,
    ].join(" "),
  )

  return content.includes(search)
}

function getCurrentChargeByClient(rows: CobrancaResponseItem[]) {
  const map = new Map<string, CobrancaResponseItem>()

  rows.forEach((row) => {
    const key = row.business_id

    if (!key) return

    const current = map.get(key)

    if (!current) {
      map.set(key, row)
      return
    }

    const currentDate =
      getTimestamp(current.data_criacao) ||
      getTimestamp(current.created_at) ||
      getTimestamp(current.vencimento)

    const rowDate =
      getTimestamp(row.data_criacao) ||
      getTimestamp(row.created_at) ||
      getTimestamp(row.vencimento)

    if (rowDate > currentDate) {
      map.set(key, row)
    }
  })

  return Array.from(map.values())
}

function getSummary(rows: CobrancaResponseItem[]) {
  return rows.reduce(
    (summary, cobranca) => {
      const status = normalizeStatus(cobranca.status)
      const syncStatus = normalizeStatus(cobranca.sync_status)

      summary.total += 1

      if (cobranca.tipo_code === "ativacao") summary.ativacao += 1
      if (cobranca.tipo_code === "renovacao") summary.renovacao += 1

      if (status === "canceled") {
        summary.canceled += 1
        summary.cancelamento += 1
      }

      if (status === "pending" && !isPastDate(cobranca.vencimento)) {
        summary.pending += 1
      }

      if (
        status === "overdue" ||
        (status === "pending" && isPastDate(cobranca.vencimento))
      ) {
        summary.overdue += 1
      }

      if (status === "paid") summary.paid += 1

      if (status === "error" || syncStatus === "error") {
        summary.error += 1
      }

      if (cobranca.needs_action) summary.needsAction += 1

      return summary
    },
    {
      total: 0,
      ativacao: 0,
      renovacao: 0,
      cancelamento: 0,
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
    const tipoFilter = getTipoFilter(request)
    const limit = getLimit(request)
    const search = normalizeText(request.nextUrl.searchParams.get("search"))
    const dateFrom = toDateInput(request.nextUrl.searchParams.get("dateFrom"))
    const dateTo = toDateInput(request.nextUrl.searchParams.get("dateTo"))

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
          gerada_em,
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
      const tipoCode = getTipoCode(cobranca.ciclo_tipo, cobranca.metadata)
      const dataCriacao = getChargeCreatedAt(cobranca)

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
        tipo_code: tipoCode,
        tipo_label: getTipoLabel(tipoCode, cobranca.ciclo_tipo),
        competencia: cobranca.competencia,
        gerada_em: cobranca.gerada_em,
        created_at: cobranca.created_at,
        data_criacao: dataCriacao,
        pago_em: cobranca.pago_em,
        bling_cobranca_id: cobranca.bling_cobranca_id,
        bling_numero_documento: cobranca.bling_numero_documento,
        bling_link_pagamento: cobranca.bling_link_pagamento,
        bling_status_raw: cobranca.bling_status_raw,
        ultima_consulta_bling_em: cobranca.ultima_consulta_bling_em,
        needs_action: isNeedsAction(cobranca),
      }
    })

    const currentRows = getCurrentChargeByClient(enrichedRows)

    const searchedRows = currentRows.filter((item) =>
      matchesSearch(item, search),
    )

    const typedRows = searchedRows.filter((item) =>
      matchesTipoFilter(item, tipoFilter),
    )

    const datedRows = typedRows.filter((item) =>
      matchesDateFilter(item, dateFrom, dateTo),
    )

    const filteredRows = datedRows.filter((item) =>
      matchesStatusFilter(item, statusFilter),
    )

    return NextResponse.json({
      ok: true,
      summary: getSummary(datedRows),
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