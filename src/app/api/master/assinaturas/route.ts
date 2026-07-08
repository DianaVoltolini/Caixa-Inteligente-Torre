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
  [key: string]: unknown
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
  [key: string]: unknown
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

type PlanoTipo = "Trial" | "Plano"

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
  documento_cliente: string | null
  cliente: string
  razao_social: string | null
  nome_cliente: string | null
  responsavel: string | null
  email: string | null
  whatsapp: string | null
  endereco_cobranca: string | null
  plano_tipo: PlanoTipo
  plano_label: string
  plano_valor: number | null
  forma_pagamento: string | null
  forma_pagamento_label: string | null
  dia_vencimento: number | null
  dia_vencimento_label: string | null
  data_cadastro: string | null
  data_ativacao: string | null
  data_referencia: string | null
  data_referencia_label: "Cadastro" | "Ativação"
  status_code: StatusCode
  status_label: string
  status_raw: string | null
  trial_started_at: string | null
  trial_ends_at: string | null
  tolerancia_dias: number
  proximo_vencimento: string | null
  cobranca_id: string | null
  cobranca_status: string | null
  cobranca_label: string
  cobranca_emitida: boolean
  cobranca_emissao_label: "Emitida" | "Pendente de Emissão"
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

function getLatestByBusiness<
  T extends { business_id: string; created_at: string | null },
>(rows: T[]) {
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

function getStringValue(value: unknown) {
  if (value === null || value === undefined) return null

  const text = String(value).trim()

  return text || null
}

function pickFirstString(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = getStringValue(row[key])

    if (value) return value
  }

  return null
}

function formatCpfCnpj(value: string | null) {
  if (!value) return null

  const digits = value.replace(/\D/g, "")

  if (digits.length === 11) {
    return `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${digits.substring(9)}`
  }

  if (digits.length === 14) {
    return `${digits.substring(0, 2)}.${digits.substring(2, 5)}.${digits.substring(5, 8)}/${digits.substring(8, 12)}-${digits.substring(12)}`
  }

  return value
}

function getDocumentoCliente(business: BusinessRow) {
  const rawDocument = pickFirstString(business, [
    "cnpj",
    "cpf",
    "cpf_cnpj",
    "documento",
    "document",
    "tax_id",
    "taxId",
    "billing_documento",
    "billing_cpf_cnpj",
    "billing_cnpj",
    "billing_cpf",
  ])

  return formatCpfCnpj(rawDocument)
}

function getRazaoSocial(business: BusinessRow) {
  return (
    pickFirstString(business, [
      "razao_social",
      "razaoSocial",
      "legal_name",
      "legalName",
      "nome_empresa",
      "company_name",
      "name",
    ]) || business.name
  )
}

function getNomeCliente(business: BusinessRow) {
  return (
    pickFirstString(business, [
      "nome_fantasia",
      "nomeFantasia",
      "fantasy_name",
      "trade_name",
      "nome",
      "nome_responsavel",
    ]) || business.nome_responsavel
  )
}

function formatCep(value: string | null) {
  if (!value) return null

  const digits = value.replace(/\D/g, "")

  if (digits.length !== 8) return value

  return `${digits.substring(0, 5)}-${digits.substring(5)}`
}

function getBillingAddress(business: BusinessRow) {
  const logradouro = pickFirstString(business, [
    "billing_logradouro",
    "billing_street",
    "billing_address",
    "billing_endereco",
    "endereco_cobranca_logradouro",
    "endereco_logradouro",
    "logradouro",
    "rua",
    "street",
    "address_street",
  ])

  const numero = pickFirstString(business, [
    "billing_numero",
    "billing_number",
    "endereco_cobranca_numero",
    "endereco_numero",
    "numero",
    "number",
    "address_number",
  ])

  const complemento = pickFirstString(business, [
    "billing_complemento",
    "billing_complement",
    "endereco_cobranca_complemento",
    "endereco_complemento",
    "complemento",
    "complement",
    "address_complement",
  ])

  const bairro = pickFirstString(business, [
    "billing_bairro",
    "billing_neighborhood",
    "endereco_cobranca_bairro",
    "endereco_bairro",
    "bairro",
    "neighborhood",
    "address_neighborhood",
  ])

  const cidade = pickFirstString(business, [
    "billing_cidade",
    "billing_city",
    "endereco_cobranca_cidade",
    "endereco_cidade",
    "cidade",
    "city",
    "address_city",
  ])

  const estado = pickFirstString(business, [
    "billing_estado",
    "billing_state",
    "billing_uf",
    "endereco_cobranca_estado",
    "endereco_estado",
    "estado",
    "uf",
    "state",
    "address_state",
  ])

  const cep = formatCep(
    pickFirstString(business, [
      "billing_cep",
      "billing_zipcode",
      "billing_zip_code",
      "endereco_cobranca_cep",
      "endereco_cep",
      "cep",
      "zipcode",
      "zip_code",
      "address_zipcode",
    ]),
  )

  const primeiraLinha = [logradouro, numero ? `nº ${numero}` : null]
    .filter(Boolean)
    .join(", ")

  const cidadeEstado = [cidade, estado].filter(Boolean).join(" - ")

  const partes = [
    primeiraLinha,
    complemento,
    bairro,
    cidadeEstado,
    cep ? `CEP ${cep}` : null,
  ].filter(Boolean)

  return partes.length > 0 ? partes.join(" · ") : null
}

function getPaymentMethodValue(assinatura: AssinaturaRow | null) {
  if (!assinatura) return null

  return pickFirstString(assinatura, [
    "payment_method",
    "forma_pagamento",
    "metodo_pagamento",
    "billing_payment_method",
    "paymentMethod",
  ])
}

function getPaymentMethodLabel(value: string | null) {
  const normalized = normalizeText(value)

  if (!normalized) return null
  if (normalized === "pix") return "Pix"
  if (normalized === "boleto") return "Boleto"
  if (normalized === "credit_card") return "Cartão"
  if (normalized === "cartao") return "Cartão"

  return value
}

function getDiaVencimentoValue(assinatura: AssinaturaRow | null) {
  if (!assinatura) return null

  const rawValue = pickFirstString(assinatura, [
    "dia_vencimento",
    "billing_due_day",
    "due_day",
    "vencimento_dia",
    "diaVencimento",
  ])

  if (rawValue) {
    const number = Number(rawValue)

    if (Number.isFinite(number) && number > 0) {
      return Math.floor(number)
    }
  }

  if (assinatura.proximo_vencimento) {
    const day = Number(String(assinatura.proximo_vencimento).substring(8, 10))

    if (Number.isFinite(day) && day > 0) {
      return day
    }
  }

  return null
}

function getDiaVencimentoLabel(value: number | null) {
  if (!value) return null

  return `Dia ${value}`
}

function resolveStatus(
  assinatura: AssinaturaRow | null,
  dataAtivacao: string | null,
): {
  statusCode: StatusCode
  statusLabel: string
  precisaAtencao: boolean
} {
  const rawStatus = normalizeStatus(assinatura?.status)
  const isAssinante = Boolean(dataAtivacao)

  if (isAssinante) {
    if (rawStatus === "canceled") {
      return {
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
        statusCode: "assinante_bloqueado",
        statusLabel: "Bloqueado",
        precisaAtencao: true,
      }
    }

    return {
      statusCode: "assinante_ativo",
      statusLabel: "Ativo",
      precisaAtencao: false,
    }
  }

  if (rawStatus === "canceled" || rawStatus === "blocked") {
    return {
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
        statusCode: "trial_ativo",
        statusLabel: "Trial ativo",
        precisaAtencao: false,
      }
    }

    const totalEnd = addDays(trialEnd, toleranciaDias)

    if (now <= totalEnd) {
      return {
        statusCode: "trial_congelado",
        statusLabel: "Trial congelado",
        precisaAtencao: true,
      }
    }

    return {
      statusCode: "trial_encerrado",
      statusLabel: "Trial encerrado",
      precisaAtencao: true,
    }
  }

  if (rawStatus === "trialing") {
    return {
      statusCode: "trial_ativo",
      statusLabel: "Trial ativo",
      precisaAtencao: false,
    }
  }

  if (rawStatus === "awaiting_payment") {
    return {
      statusCode: "trial_congelado",
      statusLabel: "Trial congelado",
      precisaAtencao: true,
    }
  }

  return {
    statusCode: "trial_encerrado",
    statusLabel: "Trial encerrado",
    precisaAtencao: true,
  }
}

function getDataAtivacao(
  assinatura: AssinaturaRow | null,
  firstPaidCharge: CobrancaRow | null,
) {
  if (assinatura?.trial_converted_at) return assinatura.trial_converted_at
  if (firstPaidCharge?.pago_em) return firstPaidCharge.pago_em

  const rawStatus = normalizeStatus(assinatura?.status)

  if (rawStatus === "active") {
    return assinatura?.updated_at || assinatura?.created_at || null
  }

  return null
}

function getPlanoLabel(assinatura: AssinaturaRow | null, dataAtivacao: string | null) {
  if (!dataAtivacao) return "Trial"

  const plano = String(assinatura?.plano ?? "").trim()

  if (!plano) return "Plano Lucro Real"
  if (normalizeText(plano) === "lucro_real") return "Plano Lucro Real"

  return plano
}

function getPlanoTipo(dataAtivacao: string | null): PlanoTipo {
  return dataAtivacao ? "Plano" : "Trial"
}

function getDataReferencia(
  dataCadastro: string | null,
  dataAtivacao: string | null,
) {
  if (dataAtivacao) {
    return {
      data: dataAtivacao,
      label: "Ativação" as const,
    }
  }

  return {
    data: dataCadastro,
    label: "Cadastro" as const,
  }
}

function matchesSearch(item: AssinaturaItem, search: string) {
  if (!search) return true

  const content = normalizeText(
    [
      item.documento_cliente,
      item.cliente,
      item.razao_social,
      item.nome_cliente,
      item.responsavel,
      item.email,
      item.whatsapp,
      item.endereco_cobranca,
      item.plano_label,
      item.plano_valor,
      item.forma_pagamento_label,
      item.dia_vencimento_label,
      item.status_label,
      item.cobranca_label,
      item.cobranca_emissao_label,
      item.cobranca_bling_id,
      item.cobranca_documento,
    ].join(" "),
  )

  return content.includes(search)
}

function matchesPlano(item: AssinaturaItem, plano: string) {
  if (!plano || plano === "todos") return true
  if (plano === "trial") return item.plano_tipo === "Trial"

  const readablePlano = plano.replace(/_/g, " ")

  return normalizeText(item.plano_label).includes(readablePlano)
}

function matchesStatus(item: AssinaturaItem, status: string) {
  if (!status || status === "todos") return true
  if (status === "atencao") return item.precisa_atencao

  return item.status_code === status
}

function matchesDate(item: AssinaturaItem, dateFrom: string | null, dateTo: string | null) {
  if (!dateFrom && !dateTo) return true

  const referenceDate = toDateOnly(item.data_referencia)

  if (!referenceDate) return false

  if (dateFrom && referenceDate < dateFrom) return false
  if (dateTo && referenceDate > dateTo) return false

  return true
}

function getSummary(items: AssinaturaItem[]) {
  return items.reduce(
    (summary, item) => {
      summary.total += 1

      if (item.plano_tipo === "Trial") summary.trial += 1
      if (item.plano_tipo === "Plano") summary.planos += 1
      if (item.status_code === "trial_ativo") summary.trialAtivo += 1
      if (item.status_code === "trial_congelado") summary.trialCongelado += 1
      if (item.status_code === "trial_encerrado") summary.trialEncerrado += 1
      if (item.status_code === "assinante_ativo") summary.ativos += 1
      if (item.status_code === "assinante_bloqueado") summary.bloqueados += 1
      if (item.status_code === "assinante_encerrado") summary.encerrados += 1
      if (item.precisa_atencao) summary.atencao += 1

      return summary
    },
    {
      total: 0,
      trial: 0,
      planos: 0,
      trialAtivo: 0,
      trialCongelado: 0,
      trialEncerrado: 0,
      ativos: 0,
      bloqueados: 0,
      encerrados: 0,
      atencao: 0,
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
    const plano = normalizeText(request.nextUrl.searchParams.get("plano") || "todos")
    const status = normalizeStatus(
      request.nextUrl.searchParams.get("status") || "todos",
    )
    const dateFrom = toDateInput(request.nextUrl.searchParams.get("dateFrom"))
    const dateTo = toDateInput(request.nextUrl.searchParams.get("dateTo"))

    const { data: businesses, error: businessesError } = await supabaseAdmin
      .from("ci_business")
      .select("*")
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
            .select("*")
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

      const dataAtivacao = getDataAtivacao(assinatura, firstPaidCharge)
      const resolved = resolveStatus(assinatura, dataAtivacao)
      const reference = getDataReferencia(business.created_at, dataAtivacao)
      const cobrancaEmitida = Boolean(latestCharge?.id)
      const paymentMethod = getPaymentMethodValue(assinatura)
      const diaVencimento = getDiaVencimentoValue(assinatura)
      const razaoSocial = getRazaoSocial(business)
      const nomeCliente = getNomeCliente(business)

      return {
        id: assinatura?.id || business.id,
        business_id: business.id,
        documento_cliente: getDocumentoCliente(business),
        cliente: business.name || razaoSocial || "Cliente sem nome",
        razao_social: razaoSocial,
        nome_cliente: nomeCliente,
        responsavel: business.nome_responsavel,
        email: business.email_financeiro,
        whatsapp: business.whatsapp,
        endereco_cobranca: getBillingAddress(business),
        plano_tipo: getPlanoTipo(dataAtivacao),
        plano_label: getPlanoLabel(assinatura, dataAtivacao),
        plano_valor: dataAtivacao
          ? assinatura?.valor ?? latestCharge?.valor ?? null
          : null,
        forma_pagamento: paymentMethod,
        forma_pagamento_label: getPaymentMethodLabel(paymentMethod),
        dia_vencimento: diaVencimento,
        dia_vencimento_label: getDiaVencimentoLabel(diaVencimento),
        data_cadastro: business.created_at,
        data_ativacao: dataAtivacao,
        data_referencia: reference.data,
        data_referencia_label: reference.label,
        status_code: resolved.statusCode,
        status_label: resolved.statusLabel,
        status_raw: assinatura?.status ?? null,
        trial_started_at: assinatura?.trial_started_at ?? null,
        trial_ends_at: assinatura?.trial_ends_at ?? null,
        tolerancia_dias: Number(assinatura?.tolerancia_dias ?? 3),
        proximo_vencimento: assinatura?.proximo_vencimento ?? null,
        cobranca_id: latestCharge?.id ?? null,
        cobranca_status: latestCharge?.status ?? null,
        cobranca_label: getChargeStatusLabel(latestCharge?.status ?? null),
        cobranca_emitida: cobrancaEmitida,
        cobranca_emissao_label: cobrancaEmitida
          ? "Emitida"
          : "Pendente de Emissão",
        cobranca_valor: latestCharge?.valor ?? null,
        cobranca_vencimento:
          assinatura?.proximo_vencimento ||
          latestCharge?.vencimento ||
          null,
        cobranca_link: latestCharge?.bling_link_pagamento ?? null,
        cobranca_bling_id: latestCharge?.bling_cobranca_id ?? null,
        cobranca_documento: latestCharge?.bling_numero_documento ?? null,
        precisa_atencao: resolved.precisaAtencao || !cobrancaEmitida,
      }
    })

    const filteredItems = items
      .filter((item) => matchesSearch(item, search))
      .filter((item) => matchesPlano(item, plano))
      .filter((item) => matchesStatus(item, status))
      .filter((item) => matchesDate(item, dateFrom, dateTo))

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