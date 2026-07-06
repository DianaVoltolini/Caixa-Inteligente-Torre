// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\api\master\assinaturas\route.ts

import { NextRequest, NextResponse } from "next/server"

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
  trial_converted_at: string | null
  proximo_vencimento: string | null
  tolerancia_dias: number | null
  created_at: string | null
  updated_at: string | null
}

type CobrancaRow = {
  id: string
  assinatura_id: string | null
  business_id: string
  valor: number | null
  vencimento: string | null
  status: string | null
  ciclo_tipo: string | null
  competencia: string | null
  bling_cobranca_id: string | null
  bling_numero_documento: string | null
  bling_link_pagamento: string | null
  pago_em: string | null
  created_at: string | null
}

type AssinaturaTipo = "Trial" | "Assinante"

type StatusCode =
  | "trial_ativo"
  | "trial_congelado"
  | "trial_encerrado"
  | "assinante_ativo"
  | "assinante_bloqueado"
  | "assinante_encerrado"

type AssinaturaItem = {
  id: string
  business_id: string
  data_cadastro: string | null
  cliente: string
  responsavel: string | null
  email: string | null
  whatsapp: string | null
  assinatura_tipo: AssinaturaTipo
  data_ativacao: string | null
  status_code: StatusCode
  status_label: string
  status_raw: string | null
  plano: string | null
  valor: number | null
  trial_started_at: string | null
  trial_ends_at: string | null
  tolerancia_dias: number
  proximo_vencimento: string | null
  cobranca_id: string | null
  cobranca_status: string | null
  cobranca_label: string
  cobranca_valor: number | null
  cobranca_vencimento: string | null
  cobranca_link: string | null
  cobranca_bling_id: string | null
  cobranca_documento: string | null
  precisa_atencao: boolean
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
  if (status === "trial") return "trialing"

  return status
}

function getDateTime(value: string | null) {
  if (!value) return 0

  const date = new Date(value)

  return Number.isFinite(date.getTime()) ? date.getTime() : 0
}

function getEndOfDay(value: string | null) {
  if (!value) return null

  const date = new Date(`${String(value).substring(0, 10)}T23:59:59`)

  if (!Number.isFinite(date.getTime())) return null

  return date
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)

  return copy
}

function getChargeStatusLabel(value: string | null) {
  const status = normalizeStatus(value)

  if (status === "pending") return "Aberta"
  if (status === "paid") return "Paga"
  if (status === "overdue") return "Vencida"
  if (status === "canceled") return "Cancelada"
  if (status === "error") return "Erro"

  return "Sem cobrança"
}

function getLatestByBusiness<T extends { business_id: string; created_at: string | null }>(
  rows: T[],
) {
  const map = new Map<string, T>()

  rows.forEach((row) => {
    const current = map.get(row.business_id)

    if (!current) {
      map.set(row.business_id, row)
      return
    }

    if (getDateTime(row.created_at) > getDateTime(current.created_at)) {
      map.set(row.business_id, row)
    }
  })

  return map
}

function getLatestChargeByBusiness(rows: CobrancaRow[]) {
  const map = new Map<string, CobrancaRow>()

  rows.forEach((row) => {
    const current = map.get(row.business_id)

    if (!current) {
      map.set(row.business_id, row)
      return
    }

    const currentDate =
      getDateTime(current.created_at) || getDateTime(current.vencimento)
    const rowDate = getDateTime(row.created_at) || getDateTime(row.vencimento)

    if (rowDate > currentDate) {
      map.set(row.business_id, row)
    }
  })

  return map
}

function getFirstPaidChargeByBusiness(rows: CobrancaRow[]) {
  const map = new Map<string, CobrancaRow>()

  rows.forEach((row) => {
    if (normalizeStatus(row.status) !== "paid" || !row.pago_em) return

    const current = map.get(row.business_id)

    if (!current) {
      map.set(row.business_id, row)
      return
    }

    if (getDateTime(row.pago_em) < getDateTime(current.pago_em)) {
      map.set(row.business_id, row)
    }
  })

  return map
}

function resolveStatus(
  assinatura: AssinaturaRow | null,
  dataAtivacao: string | null,
): {
  assinaturaTipo: AssinaturaTipo
  statusCode: StatusCode
  statusLabel: string
  precisaAtencao: boolean
} {
  const rawStatus = normalizeStatus(assinatura?.status)
  const isAssinante = Boolean(dataAtivacao)

  if (isAssinante) {
    if (rawStatus === "canceled") {
      return {
        assinaturaTipo: "Assinante",
        statusCode: "assinante_encerrado",
        statusLabel: "Encerrado",
        precisaAtencao: false,
      }
    }

    if (
      rawStatus === "blocked" ||
      rawStatus === "overdue" ||
      rawStatus === "grace_period" ||
      rawStatus === "awaiting_payment"
    ) {
      return {
        assinaturaTipo: "Assinante",
        statusCode: "assinante_bloqueado",
        statusLabel: "Bloqueado",
        precisaAtencao: true,
      }
    }

    return {
      assinaturaTipo: "Assinante",
      statusCode: "assinante_ativo",
      statusLabel: "Ativo",
      precisaAtencao: false,
    }
  }

  if (rawStatus === "canceled" || rawStatus === "blocked") {
    return {
      assinaturaTipo: "Trial",
      statusCode: "trial_encerrado",
      statusLabel: "Trial encerrado",
      precisaAtencao: true,
    }
  }

  const trialEnd = getEndOfDay(assinatura?.trial_ends_at ?? null)
  const toleranciaDias = Number(assinatura?.tolerancia_dias ?? 3)
  const now = new Date()

  if (trialEnd) {
    if (now <= trialEnd) {
      return {
        assinaturaTipo: "Trial",
        statusCode: "trial_ativo",
        statusLabel: "Trial ativo",
        precisaAtencao: false,
      }
    }

    const totalEnd = addDays(trialEnd, toleranciaDias)

    if (now <= totalEnd) {
      return {
        assinaturaTipo: "Trial",
        statusCode: "trial_congelado",
        statusLabel: "Trial congelado",
        precisaAtencao: true,
      }
    }

    return {
      assinaturaTipo: "Trial",
      statusCode: "trial_encerrado",
      statusLabel: "Trial encerrado",
      precisaAtencao: true,
    }
  }

  if (rawStatus === "trialing") {
    return {
      assinaturaTipo: "Trial",
      statusCode: "trial_ativo",
      statusLabel: "Trial ativo",
      precisaAtencao: false,
    }
  }

  if (rawStatus === "awaiting_payment") {
    return {
      assinaturaTipo: "Trial",
      statusCode: "trial_congelado",
      statusLabel: "Trial congelado",
      precisaAtencao: true,
    }
  }

  return {
    assinaturaTipo: "Trial",
    statusCode: "trial_encerrado",
    statusLabel: "Trial encerrado",
    precisaAtencao: true,
  }
}

function getSummary(items: AssinaturaItem[]) {
  return items.reduce(
    (summary, item) => {
      summary.total += 1

      if (item.status_code === "trial_ativo") summary.trialAtivo += 1
      if (item.status_code === "trial_congelado") summary.trialCongelado += 1
      if (item.status_code === "trial_encerrado") summary.trialEncerrado += 1
      if (item.status_code === "assinante_ativo") summary.assinanteAtivo += 1
      if (item.status_code === "assinante_bloqueado") summary.assinanteBloqueado += 1
      if (item.status_code === "assinante_encerrado") summary.assinanteEncerrado += 1

      if (item.precisa_atencao) summary.atencao += 1

      return summary
    },
    {
      total: 0,
      trialAtivo: 0,
      trialCongelado: 0,
      trialEncerrado: 0,
      assinanteAtivo: 0,
      assinanteBloqueado: 0,
      assinanteEncerrado: 0,
      atencao: 0,
    },
  )
}

function matchesSearch(item: AssinaturaItem, search: string) {
  if (!search) return true

  const content = normalizeText(
    [
      item.cliente,
      item.responsavel,
      item.email,
      item.whatsapp,
      item.assinatura_tipo,
      item.status_label,
      item.plano,
      item.cobranca_label,
      item.cobranca_bling_id,
      item.cobranca_documento,
    ].join(" "),
  )

  return content.includes(search)
}

function matchesStatus(item: AssinaturaItem, status: string) {
  if (!status || status === "todos") return true
  if (status === "atencao") return item.precisa_atencao

  return item.status_code === status
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMasterApiUser()

    if (!auth.authorized) {
      return auth.response
    }

    const search = normalizeText(request.nextUrl.searchParams.get("search"))
    const status = normalizeStatus(
      request.nextUrl.searchParams.get("status") || "todos",
    )

    const { data: businesses, error: businessesError } = await supabaseAdmin
      .from("ci_business")
      .select("id, name, nome_responsavel, email_financeiro, whatsapp, created_at")
      .order("created_at", { ascending: false })
      .limit(1000)

    if (businessesError) {
      throw businessesError
    }

    const businessRows = (businesses ?? []) as BusinessRow[]
    const businessIds = businessRows.map((business) => business.id)

    const { data: assinaturas, error: assinaturasError } =
      businessIds.length > 0
        ? await supabaseAdmin
            .from("ci_assinaturas")
            .select(
              "id, business_id, status, plano, valor, trial_started_at, trial_ends_at, trial_converted_at, proximo_vencimento, tolerancia_dias, created_at, updated_at",
            )
            .in("business_id", businessIds)
            .order("created_at", { ascending: false })
        : { data: [], error: null }

    if (assinaturasError) {
      throw assinaturasError
    }

    const { data: cobrancas, error: cobrancasError } =
      businessIds.length > 0
        ? await supabaseAdmin
            .from("ci_cobrancas")
            .select(
              "id, assinatura_id, business_id, valor, vencimento, status, ciclo_tipo, competencia, bling_cobranca_id, bling_numero_documento, bling_link_pagamento, pago_em, created_at",
            )
            .in("business_id", businessIds)
            .order("created_at", { ascending: false })
            .limit(2000)
        : { data: [], error: null }

    if (cobrancasError) {
      throw cobrancasError
    }

    const assinaturaRows = (assinaturas ?? []) as AssinaturaRow[]
    const cobrancaRows = (cobrancas ?? []) as CobrancaRow[]

    const assinaturaMap = getLatestByBusiness(assinaturaRows)
    const latestChargeMap = getLatestChargeByBusiness(cobrancaRows)
    const firstPaidChargeMap = getFirstPaidChargeByBusiness(cobrancaRows)

    const items: AssinaturaItem[] = businessRows.map((business) => {
      const assinatura = assinaturaMap.get(business.id) ?? null
      const latestCharge = latestChargeMap.get(business.id) ?? null
      const firstPaidCharge = firstPaidChargeMap.get(business.id) ?? null

      const dataAtivacao =
        assinatura?.trial_converted_at ||
        firstPaidCharge?.pago_em ||
        null

      const resolved = resolveStatus(assinatura, dataAtivacao)

      return {
        id: assinatura?.id || business.id,
        business_id: business.id,
        data_cadastro: business.created_at,
        cliente: business.name || "Cliente sem nome",
        responsavel: business.nome_responsavel,
        email: business.email_financeiro,
        whatsapp: business.whatsapp,
        assinatura_tipo: resolved.assinaturaTipo,
        data_ativacao: dataAtivacao,
        status_code: resolved.statusCode,
        status_label: resolved.statusLabel,
        status_raw: assinatura?.status ?? null,
        plano: assinatura?.plano ?? "Plano Lucro Real",
        valor: assinatura?.valor ?? null,
        trial_started_at: assinatura?.trial_started_at ?? null,
        trial_ends_at: assinatura?.trial_ends_at ?? null,
        tolerancia_dias: Number(assinatura?.tolerancia_dias ?? 3),
        proximo_vencimento: assinatura?.proximo_vencimento ?? null,
        cobranca_id: latestCharge?.id ?? null,
        cobranca_status: latestCharge?.status ?? null,
        cobranca_label: getChargeStatusLabel(latestCharge?.status ?? null),
        cobranca_valor: latestCharge?.valor ?? null,
        cobranca_vencimento: latestCharge?.vencimento ?? null,
        cobranca_link: latestCharge?.bling_link_pagamento ?? null,
        cobranca_bling_id: latestCharge?.bling_cobranca_id ?? null,
        cobranca_documento: latestCharge?.bling_numero_documento ?? null,
        precisa_atencao: resolved.precisaAtencao,
      }
    })

    const filteredItems = items
      .filter((item) => matchesSearch(item, search))
      .filter((item) => matchesStatus(item, status))

    return NextResponse.json({
      ok: true,
      summary: getSummary(filteredItems),
      data: filteredItems,
    })
  } catch (error) {
    console.error("Erro ao carregar assinaturas da Torre:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Não foi possível carregar as assinaturas da Torre.",
      },
      { status: 500 },
    )
  }
}