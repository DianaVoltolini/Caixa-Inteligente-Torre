// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\api\master\financeiro\route.ts

import { NextRequest, NextResponse } from "next/server"

import { requireMasterApiUser } from "@/lib/auth/require-master-api"
import { supabaseAdmin } from "@/lib/supabase/admin"

type SituacaoFinanceira =
  | "a_receber"
  | "recebido"
  | "vencido"
  | "cancelado"
  | "erro"
  | "pendente_emissao"

type StatusFilter =
  | "todos"
  | "a_receber"
  | "paid"
  | "vencido"
  | "pending_emission"
  | "canceled"
  | "error"
  | "needs_action"

type TipoCobranca = "ativacao" | "renovacao" | "outro"

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
  valor: number | null
  payment_method: string | null
  proximo_vencimento: string | null
  trial_converted_at: string | null
  created_at: string | null
  updated_at: string | null
}

type FinanceiroItem = {
  id: string
  virtual: boolean
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
  situacao_code: SituacaoFinanceira
  situacao_label: string
  sync_status: string | null
  sync_error: string | null
  ciclo_tipo: string | null
  tipo_code: TipoCobranca
  tipo_label: string
  competencia: string | null
  created_at: string | null
  gerada_em: string | null
  pago_em: string | null
  data_referencia: string | null
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

function getDateTime(value: string | null) {
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

function isDateWithinNextDays(value: string | null, days: number) {
  if (!value) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const limitDate = new Date(today)
  limitDate.setDate(limitDate.getDate() + days)

  const date = new Date(`${String(value).substring(0, 10)}T00:00:00`)
  date.setHours(0, 0, 0, 0)

  return (
    Number.isFinite(date.getTime()) &&
    date >= today &&
    date <= limitDate
  )
}

function getMonthKey(value: string | null) {
  if (!value) return null

  const clean = String(value).substring(0, 7)

  if (!/^\d{4}-\d{2}$/.test(clean)) return null

  return clean
}

function getCompetenciaFromDate(value: string | null) {
  return getMonthKey(value)
}

function getChargeCreatedAt(cobranca: CobrancaRow) {
  return cobranca.gerada_em || cobranca.created_at || null
}

function getTipoCode(value: string | null): TipoCobranca {
  const normalized = normalizeText(value)

  if (
    normalized === "first_charge" ||
    normalized === "first" ||
    normalized.includes("ativ")
  ) {
    return "ativacao"
  }

  if (
    normalized === "recurring" ||
    normalized === "recurrence" ||
    normalized === "mensalidade" ||
    normalized.includes("renov") ||
    normalized.includes("recorr")
  ) {
    return "renovacao"
  }

  return "outro"
}

function getTipoLabel(tipo: TipoCobranca, originalValue: string | null) {
  if (tipo === "ativacao") return "Ativação"
  if (tipo === "renovacao") return "Renovação"

  return originalValue || "Não informado"
}

function getSituacaoFinanceira(cobranca: CobrancaRow): {
  code: SituacaoFinanceira
  label: string
} {
  const status = normalizeStatus(cobranca.status)
  const syncStatus = normalizeStatus(cobranca.sync_status)

  if (status === "canceled") {
    return {
      code: "cancelado",
      label: "Cancelado",
    }
  }

  if (status === "error" || syncStatus === "error") {
    return {
      code: "erro",
      label: "Com erro",
    }
  }

  if (status === "paid") {
    return {
      code: "recebido",
      label: "Recebido",
    }
  }

  if (
    status === "overdue" ||
    (status === "pending" && isPastDate(cobranca.vencimento))
  ) {
    return {
      code: "vencido",
      label: "Vencido",
    }
  }

  if (status === "pending") {
    return {
      code: "a_receber",
      label: "A receber",
    }
  }

  return {
    code: "a_receber",
    label: "A receber",
  }
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

  if (
    status === "pending" &&
    !cobranca.bling_link_pagamento
  ) {
    return true
  }

  return false
}

function getReferenceDate(item: {
  situacao_code: SituacaoFinanceira
  vencimento: string | null
  pago_em: string | null
  created_at: string | null
  gerada_em?: string | null
}) {
  if (item.situacao_code === "recebido" && item.pago_em) {
    return item.pago_em
  }

  return item.vencimento || item.gerada_em || item.created_at || null
}

function matchesDateFilter(
  item: FinanceiroItem,
  dateFrom: string | null,
  dateTo: string | null,
) {
  if (!dateFrom && !dateTo) return true

  const referenceDate = toDateOnly(item.data_referencia)

  if (!referenceDate) return false
  if (dateFrom && referenceDate < dateFrom) return false
  if (dateTo && referenceDate > dateTo) return false

  return true
}

function matchesSearch(item: FinanceiroItem, search: string) {
  if (!search) return true

  const content = normalizeText(
    [
      item.cliente,
      item.responsavel,
      item.email_financeiro,
      item.whatsapp,
      item.situacao_label,
      item.status,
      item.sync_status,
      item.sync_error,
      item.plano,
      item.forma_pagamento,
      item.competencia,
      item.tipo_label,
      item.bling_cobranca_id,
      item.bling_numero_documento,
      item.bling_status_raw,
    ].join(" "),
  )

  return content.includes(search)
}

function matchesStatus(item: FinanceiroItem, statusFilter: StatusFilter) {
  if (!statusFilter || statusFilter === "todos") return true

  if (statusFilter === "a_receber") return item.situacao_code === "a_receber"
  if (statusFilter === "paid") return item.situacao_code === "recebido"
  if (statusFilter === "vencido") return item.situacao_code === "vencido"
  if (statusFilter === "pending_emission") {
    return item.situacao_code === "pendente_emissao"
  }
  if (statusFilter === "canceled") return item.situacao_code === "cancelado"
  if (statusFilter === "error") return item.situacao_code === "erro"
  if (statusFilter === "needs_action") return item.needs_action

  return true
}

function getLatestAssinaturaByBusiness(rows: AssinaturaRow[]) {
  const map = new Map<string, AssinaturaRow>()

  rows.forEach((row) => {
    const current = map.get(row.business_id)

    if (!current) {
      map.set(row.business_id, row)
      return
    }

    const currentTime = getDateTime(current.created_at)
    const rowTime = getDateTime(row.created_at)

    if (rowTime > currentTime) {
      map.set(row.business_id, row)
    }
  })

  return map
}

function shouldHaveCharge(assinatura: AssinaturaRow) {
  const status = normalizeStatus(assinatura.status)

  if (!assinatura.proximo_vencimento) return false

  if (status === "canceled") return false
  if (status === "trialing") return false

  if (
    status === "awaiting_payment" ||
    status === "grace_period" ||
    status === "overdue" ||
    status === "blocked"
  ) {
    return true
  }

  if (status === "active") {
    return isDateWithinNextDays(assinatura.proximo_vencimento, 10)
  }

  return false
}

function hasChargeForReferenceMonth(
  cobrancas: CobrancaRow[],
  businessId: string,
  referenceMonth: string | null,
) {
  if (!referenceMonth) return false

  return cobrancas.some((cobranca) => {
    if (cobranca.business_id !== businessId) return false

    const competencia =
      cobranca.competencia ||
      getCompetenciaFromDate(cobranca.vencimento) ||
      getCompetenciaFromDate(cobranca.created_at)

    return competencia === referenceMonth
  })
}

function getPendingEmissionTipo(assinatura: AssinaturaRow) {
  const status = normalizeStatus(assinatura.status)

  if (status === "awaiting_payment" && !assinatura.trial_converted_at) {
    return {
      code: "ativacao" as const,
      label: "Ativação",
    }
  }

  return {
    code: "renovacao" as const,
    label: "Renovação",
  }
}

function getSummary(items: FinanceiroItem[]) {
  return items.reduce(
    (summary, item) => {
      const valor = Number(item.valor ?? 0)

      summary.totalCobrancas += 1

      if (item.situacao_code !== "cancelado") {
        summary.totalPrevisto += valor
      }

      if (item.situacao_code === "a_receber") {
        summary.aReceber += valor
        summary.aReceberCount += 1
      }

      if (item.situacao_code === "recebido") {
        summary.recebido += valor
        summary.recebidoCount += 1
      }

      if (item.situacao_code === "vencido") {
        summary.vencido += valor
        summary.vencidoCount += 1
      }

      if (item.situacao_code === "cancelado") {
        summary.cancelado += valor
        summary.canceladoCount += 1
      }

      if (item.situacao_code === "pendente_emissao") {
        summary.pendenteEmissao += valor
        summary.pendenteEmissaoCount += 1
      }

      if (item.situacao_code === "erro") {
        summary.erros += valor
        summary.errosCount += 1
      }

      if (item.needs_action) {
        summary.acaoManual += 1
      }

      return summary
    },
    {
      totalCobrancas: 0,
      totalPrevisto: 0,
      aReceber: 0,
      aReceberCount: 0,
      recebido: 0,
      recebidoCount: 0,
      vencido: 0,
      vencidoCount: 0,
      cancelado: 0,
      canceladoCount: 0,
      pendenteEmissao: 0,
      pendenteEmissaoCount: 0,
      erros: 0,
      errosCount: 0,
      acaoManual: 0,
    },
  )
}

function getStatusFilter(request: NextRequest): StatusFilter {
  const value = normalizeStatus(request.nextUrl.searchParams.get("status"))

  if (
    value === "a_receber" ||
    value === "paid" ||
    value === "vencido" ||
    value === "pending_emission" ||
    value === "canceled" ||
    value === "error" ||
    value === "needs_action"
  ) {
    return value
  }

  return "todos"
}

function getLimit(request: NextRequest) {
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? 2000)

  if (!Number.isFinite(limitRaw)) return 2000

  return Math.min(Math.max(Math.floor(limitRaw), 1), 3000)
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMasterApiUser()

    if (!auth.authorized) {
      return auth.response
    }

    const search = normalizeText(request.nextUrl.searchParams.get("search"))
    const statusFilter = getStatusFilter(request)
    const dateFrom = toDateInput(request.nextUrl.searchParams.get("dateFrom"))
    const dateTo = toDateInput(request.nextUrl.searchParams.get("dateTo"))
    const limit = getLimit(request)

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
          ultima_consulta_bling_em
        `,
      )
      .order("created_at", { ascending: false })
      .limit(limit)

    if (cobrancasError) {
      throw cobrancasError
    }

    const { data: assinaturas, error: assinaturasError } = await supabaseAdmin
      .from("ci_assinaturas")
      .select(
        "id, business_id, status, plano, valor, payment_method, proximo_vencimento, trial_converted_at, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(1500)

    if (assinaturasError) {
      throw assinaturasError
    }

    const cobrancasRows = (cobrancas ?? []) as CobrancaRow[]
    const assinaturaRows = (assinaturas ?? []) as AssinaturaRow[]
    const latestAssinaturaByBusiness =
      getLatestAssinaturaByBusiness(assinaturaRows)

    const businessIds = Array.from(
      new Set(
        [
          ...cobrancasRows.map((row) => row.business_id),
          ...assinaturaRows.map((row) => row.business_id),
        ].filter(Boolean),
      ),
    )

    const assinaturaIds = Array.from(
      new Set(
        cobrancasRows
          .map((row) => row.assinatura_id)
          .filter(Boolean),
      ),
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

    const { data: assinaturasByCharge, error: assinaturasByChargeError } =
      assinaturaIds.length > 0
        ? await supabaseAdmin
            .from("ci_assinaturas")
            .select(
              "id, business_id, status, plano, valor, payment_method, proximo_vencimento, trial_converted_at, created_at, updated_at",
            )
            .in("id", assinaturaIds)
        : { data: [], error: null }

    if (assinaturasByChargeError) {
      throw assinaturasByChargeError
    }

    const businessMap = new Map<string, BusinessRow>()
    const assinaturaByIdMap = new Map<string, AssinaturaRow>()

    ;((businesses ?? []) as BusinessRow[]).forEach((business) => {
      businessMap.set(business.id, business)
    })

    ;((assinaturasByCharge ?? []) as AssinaturaRow[]).forEach(
      (assinatura) => {
        assinaturaByIdMap.set(assinatura.id, assinatura)
      },
    )

    const cobrancaItems: FinanceiroItem[] = cobrancasRows.map((cobranca) => {
      const business = businessMap.get(cobranca.business_id) ?? null
      const assinatura = cobranca.assinatura_id
        ? assinaturaByIdMap.get(cobranca.assinatura_id) ??
          latestAssinaturaByBusiness.get(cobranca.business_id) ??
          null
        : latestAssinaturaByBusiness.get(cobranca.business_id) ?? null

      const situacao = getSituacaoFinanceira(cobranca)
      const tipoCode = getTipoCode(cobranca.ciclo_tipo)
      const dataReferencia = getReferenceDate({
        situacao_code: situacao.code,
        vencimento: cobranca.vencimento,
        pago_em: cobranca.pago_em,
        created_at: cobranca.created_at,
        gerada_em: cobranca.gerada_em,
      })

      return {
        id: cobranca.id,
        virtual: false,
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
        situacao_code: situacao.code,
        situacao_label: situacao.label,
        sync_status: cobranca.sync_status,
        sync_error: cobranca.sync_error,
        ciclo_tipo: cobranca.ciclo_tipo,
        tipo_code: tipoCode,
        tipo_label: getTipoLabel(tipoCode, cobranca.ciclo_tipo),
        competencia:
          cobranca.competencia ||
          getCompetenciaFromDate(cobranca.vencimento),
        created_at: cobranca.created_at,
        gerada_em: cobranca.gerada_em,
        pago_em: cobranca.pago_em,
        data_referencia: dataReferencia,
        bling_cobranca_id: cobranca.bling_cobranca_id,
        bling_numero_documento: cobranca.bling_numero_documento,
        bling_link_pagamento: cobranca.bling_link_pagamento,
        bling_status_raw: cobranca.bling_status_raw,
        ultima_consulta_bling_em: cobranca.ultima_consulta_bling_em,
        needs_action: isNeedsAction(cobranca),
      }
    })

    const pendingEmissionItems: FinanceiroItem[] = Array.from(
      latestAssinaturaByBusiness.values(),
    )
      .filter((assinatura) => shouldHaveCharge(assinatura))
      .filter((assinatura) => {
        const referenceMonth = getCompetenciaFromDate(
          assinatura.proximo_vencimento,
        )

        return !hasChargeForReferenceMonth(
          cobrancasRows,
          assinatura.business_id,
          referenceMonth,
        )
      })
      .map((assinatura) => {
        const business = businessMap.get(assinatura.business_id) ?? null
        const tipo = getPendingEmissionTipo(assinatura)

        return {
          id: `pending-emission-${assinatura.id}`,
          virtual: true,
          business_id: assinatura.business_id,
          assinatura_id: assinatura.id,
          cliente: business?.name ?? "Cliente sem nome",
          responsavel: business?.nome_responsavel ?? null,
          email_financeiro: business?.email_financeiro ?? null,
          whatsapp: business?.whatsapp ?? null,
          assinatura_status: assinatura.status,
          plano: assinatura.plano,
          forma_pagamento: assinatura.payment_method,
          valor: Number(assinatura.valor ?? 0),
          vencimento: assinatura.proximo_vencimento,
          status: "pending_emission",
          situacao_code: "pendente_emissao",
          situacao_label: "Pendente de Emissão",
          sync_status: null,
          sync_error: null,
          ciclo_tipo: tipo.code === "ativacao" ? "first_charge" : "recurring",
          tipo_code: tipo.code,
          tipo_label: tipo.label,
          competencia: getCompetenciaFromDate(assinatura.proximo_vencimento),
          created_at: assinatura.created_at,
          gerada_em: null,
          pago_em: null,
          data_referencia: assinatura.proximo_vencimento || assinatura.created_at,
          bling_cobranca_id: null,
          bling_numero_documento: null,
          bling_link_pagamento: null,
          bling_status_raw: null,
          ultima_consulta_bling_em: null,
          needs_action: true,
        }
      })

    const allItems = [...cobrancaItems, ...pendingEmissionItems]

    const filteredItems = allItems
      .filter((item) => matchesSearch(item, search))
      .filter((item) => matchesDateFilter(item, dateFrom, dateTo))
      .filter((item) => matchesStatus(item, statusFilter))
      .sort((a, b) => getDateTime(b.data_referencia) - getDateTime(a.data_referencia))

    return NextResponse.json({
      ok: true,
      filters: {
        dateFrom,
        dateTo,
      },
      summary: getSummary(filteredItems),
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