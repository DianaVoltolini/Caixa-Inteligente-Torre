// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\api\master\cobrancas\route.ts

import { NextRequest, NextResponse } from "next/server"

import { requireMasterApiUser } from "@/lib/auth/require-master-api"
import { supabaseAdmin } from "@/lib/supabase/admin"

type CobrancaRow = {
  id: string
  business_id: string
  assinatura_id?: string | null
  competencia?: string | null
  ciclo_tipo?: string | null
  valor?: number | string | null
  gerada_em?: string | null
  created_at?: string | null
  vencimento?: string | null
  status?: string | null
  sync_status?: string | null
  sync_error?: string | null
  bling_cobranca_id?: string | null
  bling_numero_documento?: string | null
  bling_link_pagamento?: string | null
  pago_em?: string | null
  ultima_consulta_bling_em?: string | null
  [key: string]: unknown
}

type BusinessRow = {
  id: string
  name?: string | null
  nome_responsavel?: string | null
  email_financeiro?: string | null
  whatsapp?: string | null
  created_at?: string | null
  [key: string]: unknown
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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

function getDocumentoCliente(business: BusinessRow | undefined) {
  if (!business) return null

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
    "documento_fiscal",
    "documento_cliente",
  ])

  return formatCpfCnpj(rawDocument)
}

function getRazaoSocial(business: BusinessRow | undefined) {
  if (!business) return null

  return (
    pickFirstString(business, [
      "razao_social",
      "razaoSocial",
      "legal_name",
      "legalName",
      "nome_empresa",
      "company_name",
      "name",
    ]) ||
    business.name ||
    null
  )
}

function getNomeCliente(business: BusinessRow | undefined) {
  if (!business) return null

  return (
    pickFirstString(business, [
      "nome_fantasia",
      "nomeFantasia",
      "fantasy_name",
      "trade_name",
      "nome",
      "nome_responsavel",
    ]) ||
    business.nome_responsavel ||
    business.name ||
    null
  )
}

function getTipoLabel(cicloTipo: string | null | undefined) {
  const normalized = normalizeText(cicloTipo)

  if (
    normalized.includes("first") ||
    normalized.includes("ativacao") ||
    normalized.includes("activation") ||
    normalized === "first_charge"
  ) {
    return "Ativação"
  }

  if (
    normalized.includes("recurring") ||
    normalized.includes("recurr") ||
    normalized.includes("recorr") ||
    normalized.includes("renov") ||
    normalized.includes("renew") ||
    normalized === "recurring_charge"
  ) {
    return "Recorrência"
  }

  if (normalized.includes("cancel")) {
    return "Cancelamento"
  }

  return cicloTipo || "—"
}

function isPastDate(value: string | null | undefined) {
  if (!value) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const date = new Date(`${String(value).substring(0, 10)}T00:00:00`)
  date.setHours(0, 0, 0, 0)

  return Number.isFinite(date.getTime()) && date < today
}

function getStatusLabel(cobranca: CobrancaRow) {
  const status = normalizeText(cobranca.status)
  const syncStatus = normalizeText(cobranca.sync_status)

  if (status === "error" || syncStatus === "error") return "Com erro"

  if (status === "paid" || status === "paga" || status === "pago") {
    return "Pago"
  }

  if (
    status === "canceled" ||
    status === "cancelada" ||
    status === "cancelado" ||
    status === "cancelled"
  ) {
    return "Cancelado"
  }

  if (
    status === "overdue" ||
    status === "vencida" ||
    status === "vencido" ||
    isPastDate(cobranca.vencimento)
  ) {
    return "Vencido"
  }

  return "Aberto"
}

function getStatusCode(cobranca: CobrancaRow) {
  const label = getStatusLabel(cobranca)

  if (label === "Pago") return "pago"
  if (label === "Vencido") return "vencido"
  if (label === "Cancelado") return "cancelado"
  if (label === "Com erro") return "erro"

  return "aberto"
}

function getEmissaoLabel(cobranca: CobrancaRow) {
  const status = normalizeText(cobranca.status)
  const syncStatus = normalizeText(cobranca.sync_status)

  if (status === "error" || syncStatus === "error") {
    return "Com erro"
  }

  if (cobranca.bling_cobranca_id) {
    return "Emitida"
  }

  return "Pendente de emissão"
}

function getEmissaoCode(cobranca: CobrancaRow) {
  const label = getEmissaoLabel(cobranca)

  if (label === "Emitida") return "emitida"
  if (label === "Com erro") return "erro"

  return "pendente_emissao"
}

function getValor(value: unknown) {
  const numberValue = Number(value ?? 0)

  return Number.isFinite(numberValue) ? numberValue : 0
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMasterApiUser()

    if (!auth.authorized) {
      return auth.response
    }

    const searchParams = request.nextUrl.searchParams
    const statusFilter = searchParams.get("status") || "todos"

    const { data: cobrancasData, error: cobrancasError } = await supabaseAdmin
      .from("ci_cobrancas")
      .select("*")
      .order("created_at", { ascending: false })

    if (cobrancasError) {
      throw cobrancasError
    }

    const cobrancas = (cobrancasData ?? []) as CobrancaRow[]
    const businessIds = Array.from(
      new Set(
        cobrancas
          .map((cobranca) => cobranca.business_id)
          .filter(Boolean),
      ),
    )

    let businessMap = new Map<string, BusinessRow>()

    if (businessIds.length > 0) {
      const { data: businessesData, error: businessesError } =
        await supabaseAdmin
          .from("ci_business")
          .select("*")
          .in("id", businessIds)

      if (businessesError) {
        throw businessesError
      }

      businessMap = new Map(
        ((businessesData ?? []) as BusinessRow[]).map((business) => [
          business.id,
          business,
        ]),
      )
    }

    const items = cobrancas.map((cobranca) => {
      const business = businessMap.get(cobranca.business_id)
      const statusCode = getStatusCode(cobranca)
      const emissaoCode = getEmissaoCode(cobranca)

      return {
        id: cobranca.id,
        business_id: cobranca.business_id,
        assinatura_id: cobranca.assinatura_id || null,

        documento_cliente: getDocumentoCliente(business),
        cpf_cnpj: getDocumentoCliente(business),
        documento: getDocumentoCliente(business),

        razao_social: getRazaoSocial(business),
        nome_cliente: getNomeCliente(business),
        cliente_nome: getRazaoSocial(business),
        cliente: getRazaoSocial(business),
        business_name: business?.name || null,
        name: business?.name || null,
        nome_responsavel: business?.nome_responsavel || null,
        email_financeiro: business?.email_financeiro || null,
        whatsapp: business?.whatsapp || null,

        tipo: cobranca.ciclo_tipo || null,
        tipo_label: getTipoLabel(cobranca.ciclo_tipo),
        ciclo_tipo: cobranca.ciclo_tipo || null,

        status: cobranca.status || null,
        status_code: statusCode,
        status_label: getStatusLabel(cobranca),
        situacao: cobranca.status || null,
        cobranca_status: cobranca.status || null,

        emissao_status_code: emissaoCode,
        emissao_status_label: getEmissaoLabel(cobranca),

        sync_status: cobranca.sync_status || null,
        sync_error: cobranca.sync_error || null,

        valor: getValor(cobranca.valor),
        cobranca_valor: getValor(cobranca.valor),

        vencimento: cobranca.vencimento || null,
        pago_em: cobranca.pago_em || null,
        created_at: cobranca.created_at || cobranca.gerada_em || null,
        gerada_em: cobranca.gerada_em || cobranca.created_at || null,
        competencia: cobranca.competencia || null,

        bling_cobranca_id: cobranca.bling_cobranca_id || null,
        bling_numero_documento: cobranca.bling_numero_documento || null,
        bling_documento: cobranca.bling_numero_documento || null,
        bling_link_pagamento: cobranca.bling_link_pagamento || null,
        ultima_consulta_bling_em:
          cobranca.ultima_consulta_bling_em || null,
      }
    })

    const filteredItems =
      statusFilter === "todos"
        ? items
        : items.filter((item) => item.status_code === statusFilter)

    const summary = filteredItems.reduce(
      (acc, item) => {
        acc.total += 1

        if (item.tipo_label === "Ativação") acc.ativacao += 1
        if (item.tipo_label === "Recorrência") acc.recorrencia += 1
        if (item.tipo_label === "Cancelamento") acc.cancelamento += 1

        if (item.status_code === "aberto") acc.aberto += 1
        if (item.status_code === "pago") acc.pago += 1
        if (item.status_code === "vencido") acc.vencido += 1
        if (item.status_code === "erro") acc.comErro += 1

        if (
          item.status_code === "vencido" ||
          item.status_code === "erro" ||
          item.emissao_status_code === "pendente_emissao"
        ) {
          acc.acaoManual += 1
        }

        return acc
      },
      {
        total: 0,
        ativacao: 0,
        recorrencia: 0,
        cancelamento: 0,
        aberto: 0,
        pago: 0,
        vencido: 0,
        comErro: 0,
        acaoManual: 0,
      },
    )

    return NextResponse.json({
      ok: true,
      success: true,
      data: filteredItems,
      cobrancas: filteredItems,
      items: filteredItems,
      summary,
    })
  } catch (error) {
    console.error("Erro ao carregar cobranças da Torre:", error)

    return NextResponse.json(
      {
        ok: false,
        success: false,
        message: "Não foi possível carregar as cobranças.",
      },
      { status: 500 },
    )
  }
}