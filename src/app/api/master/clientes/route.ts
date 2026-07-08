// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\api\master\clientes\route.ts

import { NextResponse } from "next/server"

import { requireMasterApiUser } from "@/lib/auth/require-master-api"
import { supabaseAdmin } from "@/lib/supabase/admin"

type BusinessRow = {
  id: string
  name?: string | null
  nome_responsavel?: string | null
  email_financeiro?: string | null
  whatsapp?: string | null
  created_at?: string | null
  [key: string]: unknown
}

type AssinaturaRow = {
  id: string
  business_id: string
  status?: string | null
  plano?: string | null
  valor?: number | string | null
  trial_started_at?: string | null
  trial_ends_at?: string | null
  trial_converted_at?: string | null
  assinada_em?: string | null
  data_ativacao?: string | null
  proximo_vencimento?: string | null
  dia_vencimento?: number | string | null
  forma_pagamento?: string | null
  payment_method?: string | null
  tolerancia_dias?: number | string | null
  created_at?: string | null
  updated_at?: string | null
  [key: string]: unknown
}

type CobrancaRow = {
  id: string
  business_id: string
  assinatura_id?: string | null
  valor?: number | string | null
  status?: string | null
  ciclo_tipo?: string | null
  vencimento?: string | null
  pago_em?: string | null
  created_at?: string | null
  gerada_em?: string | null
  bling_cobranca_id?: string | null
  bling_link_pagamento?: string | null
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

function pickFirstNumber(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const rawValue = row[key]

    if (rawValue === null || rawValue === undefined || rawValue === "") {
      continue
    }

    const numberValue = Number(rawValue)

    if (Number.isFinite(numberValue)) return numberValue
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
    "documento_fiscal",
    "documento_cliente",
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
      "business_name",
      "name",
    ]) ||
    business.name ||
    null
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
      "nome_cliente",
      "nome_responsavel",
      "responsavel",
    ]) ||
    business.nome_responsavel ||
    business.name ||
    null
  )
}

function getEmailCliente(business: BusinessRow) {
  return (
    pickFirstString(business, [
      "email_financeiro",
      "billing_email",
      "email",
      "owner_email",
      "responsavel_email",
    ]) || null
  )
}

function getWhatsappCliente(business: BusinessRow) {
  return (
    pickFirstString(business, [
      "whatsapp",
      "telefone",
      "phone",
      "celular",
      "billing_phone",
      "billing_whatsapp",
    ]) || null
  )
}

function getEnderecoRua(business: BusinessRow) {
  return pickFirstString(business, [
    "endereco_rua",
    "rua",
    "logradouro",
    "street",
    "address_street",
    "address_line1",
    "address_line_1",
    "billing_rua",
    "billing_logradouro",
    "billing_street",
    "billing_address_street",
    "billing_address_line1",
    "billing_address_line_1",
  ])
}

function getEnderecoNumero(business: BusinessRow) {
  return pickFirstString(business, [
    "endereco_numero",
    "numero",
    "number",
    "address_number",
    "billing_numero",
    "billing_number",
    "billing_address_number",
  ])
}

function getEnderecoComplemento(business: BusinessRow) {
  return pickFirstString(business, [
    "endereco_complemento",
    "complemento",
    "address_complement",
    "complement",
    "billing_complemento",
    "billing_complement",
    "billing_address_complement",
  ])
}

function getEnderecoCep(business: BusinessRow) {
  return pickFirstString(business, [
    "endereco_cep",
    "cep",
    "postal_code",
    "zipcode",
    "zip_code",
    "billing_cep",
    "billing_postal_code",
    "billing_zipcode",
    "billing_zip_code",
  ])
}

function getEnderecoBairro(business: BusinessRow) {
  return pickFirstString(business, [
    "endereco_bairro",
    "bairro",
    "neighborhood",
    "district",
    "billing_bairro",
    "billing_neighborhood",
    "billing_district",
  ])
}

function getEnderecoMunicipio(business: BusinessRow) {
  return pickFirstString(business, [
    "endereco_municipio",
    "municipio",
    "cidade",
    "city",
    "localidade",
    "billing_municipio",
    "billing_cidade",
    "billing_city",
    "billing_localidade",
  ])
}

function getEnderecoUf(business: BusinessRow) {
  return pickFirstString(business, [
    "endereco_uf",
    "uf",
    "estado",
    "state",
    "billing_uf",
    "billing_estado",
    "billing_state",
  ])
}

function getEnderecoCompleto(business: BusinessRow) {
  const rua = getEnderecoRua(business)
  const numero = getEnderecoNumero(business)
  const complemento = getEnderecoComplemento(business)
  const cep = getEnderecoCep(business)
  const bairro = getEnderecoBairro(business)
  const municipio = getEnderecoMunicipio(business)
  const uf = getEnderecoUf(business)

  const partes = [
    rua,
    numero ? `nº ${numero}` : null,
    complemento,
    cep ? `CEP ${cep}` : null,
    bairro,
    municipio,
    uf,
  ]
    .map((parte) => String(parte ?? "").trim())
    .filter(Boolean)

  if (partes.length > 0) return partes.join(" · ")

  return (
    pickFirstString(business, [
      "endereco_completo",
      "address",
      "full_address",
      "billing_endereco_completo",
      "billing_address",
      "billing_full_address",
    ]) || null
  )
}

function getNumber(value: unknown) {
  const numberValue = Number(value ?? 0)

  return Number.isFinite(numberValue) ? numberValue : 0
}

function getDateTime(value: string | null | undefined) {
  if (!value) return 0

  const date = new Date(value)

  return Number.isFinite(date.getTime()) ? date.getTime() : 0
}

function addDays(value: string | null | undefined, days: number) {
  if (!value) return null

  const date = new Date(`${String(value).substring(0, 10)}T00:00:00`)

  if (!Number.isFinite(date.getTime())) return null

  date.setDate(date.getDate() + days)

  return date
}

function isAfterToday(date: Date | null) {
  if (!date) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return date >= today
}

function getLatestByBusiness<T extends { business_id: string; created_at?: string | null; updated_at?: string | null }>(
  rows: T[],
) {
  const map = new Map<string, T>()

  rows.forEach((row) => {
    const current = map.get(row.business_id)

    if (!current) {
      map.set(row.business_id, row)
      return
    }

    const currentDate = getDateTime(current.updated_at || current.created_at)
    const newDate = getDateTime(row.updated_at || row.created_at)

    if (newDate >= currentDate) {
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

    const currentDate = getDateTime(current.created_at || current.gerada_em || current.vencimento)
    const newDate = getDateTime(row.created_at || row.gerada_em || row.vencimento)

    if (newDate >= currentDate) {
      map.set(row.business_id, row)
    }
  })

  return map
}

function getFirstPaidChargeByBusiness(rows: CobrancaRow[]) {
  const map = new Map<string, CobrancaRow>()

  rows
    .filter((row) => normalizeText(row.status) === "paid")
    .forEach((row) => {
      const current = map.get(row.business_id)

      if (!current) {
        map.set(row.business_id, row)
        return
      }

      const currentDate = getDateTime(current.pago_em || current.created_at || current.gerada_em)
      const newDate = getDateTime(row.pago_em || row.created_at || row.gerada_em)

      if (newDate <= currentDate) {
        map.set(row.business_id, row)
      }
    })

  return map
}

function getPlanoLabel(assinatura: AssinaturaRow | undefined) {
  if (!assinatura) return "—"

  const status = normalizeText(assinatura.status)
  const plano = getStringValue(assinatura.plano)

  if (status === "trialing" || status === "trial") {
    return "Trial"
  }

  if (plano) return plano

  return "Plano Lucro Real"
}

function getFormaPagamento(assinatura: AssinaturaRow | undefined) {
  if (!assinatura) return null

  const raw =
    getStringValue(assinatura.forma_pagamento) ||
    getStringValue(assinatura.payment_method)

  const normalized = normalizeText(raw)

  if (normalized === "pix") return "Pix"
  if (normalized === "boleto") return "Boleto"

  return raw
}

function getAssinaturaValor(
  assinatura: AssinaturaRow | undefined,
  ultimaCobranca: CobrancaRow | undefined,
) {
  const assinaturaValor = assinatura
    ? pickFirstNumber(assinatura, ["valor", "price", "amount"])
    : null

  if (assinaturaValor !== null) return assinaturaValor

  if (ultimaCobranca?.valor !== undefined && ultimaCobranca?.valor !== null) {
    return getNumber(ultimaCobranca.valor)
  }

  return null
}

function getDataAtivacao(
  assinatura: AssinaturaRow | undefined,
  primeiraCobrancaPaga: CobrancaRow | undefined,
) {
  if (!assinatura) return primeiraCobrancaPaga?.pago_em || null

  return (
    assinatura.trial_converted_at ||
    assinatura.assinada_em ||
    assinatura.data_ativacao ||
    getStringValue(assinatura.activated_at) ||
    primeiraCobrancaPaga?.pago_em ||
    null
  )
}

function getAssinaturaStatusCode(assinatura: AssinaturaRow | undefined) {
  if (!assinatura) return "sem_assinatura"

  const status = normalizeText(assinatura.status)

  if (status === "trialing" || status === "trial") {
    const trialEndsAt = assinatura.trial_ends_at
    const toleranciaDias = Number(assinatura.tolerancia_dias ?? 3)

    if (!trialEndsAt) return "trial_ativo"

    if (isAfterToday(addDays(trialEndsAt, 0))) {
      return "trial_ativo"
    }

    if (isAfterToday(addDays(trialEndsAt, toleranciaDias))) {
      return "trial_congelado"
    }

    return "trial_encerrado"
  }

  if (status === "active") return "assinante_ativo"

  if (
    status === "awaiting_payment" ||
    status === "grace_period" ||
    status === "overdue" ||
    status === "blocked"
  ) {
    return "assinante_bloqueado"
  }

  if (status === "canceled" || status === "cancelled") {
    return "assinante_encerrado"
  }

  return "assinante_bloqueado"
}

function getAssinaturaStatusLabel(assinatura: AssinaturaRow | undefined) {
  const code = getAssinaturaStatusCode(assinatura)

  if (code === "trial_ativo") return "Trial ativo"
  if (code === "trial_congelado") return "Trial congelado"
  if (code === "trial_encerrado") return "Trial encerrado"
  if (code === "assinante_ativo") return "Ativo"
  if (code === "assinante_bloqueado") return "Bloqueado"
  if (code === "assinante_encerrado") return "Encerrado"

  return "Sem assinatura"
}

export async function GET() {
  try {
    const auth = await requireMasterApiUser()

    if (!auth.authorized) {
      return auth.response
    }

    const { data: businessesData, error: businessesError } =
      await supabaseAdmin
        .from("ci_business")
        .select("*")
        .order("created_at", { ascending: false })

    if (businessesError) {
      throw businessesError
    }

    const { data: assinaturasData, error: assinaturasError } =
      await supabaseAdmin
        .from("ci_assinaturas")
        .select("*")
        .order("created_at", { ascending: false })

    if (assinaturasError) {
      throw assinaturasError
    }

    const { data: cobrancasData, error: cobrancasError } =
      await supabaseAdmin
        .from("ci_cobrancas")
        .select("*")
        .order("created_at", { ascending: false })

    if (cobrancasError) {
      throw cobrancasError
    }

    const businesses = (businessesData ?? []) as BusinessRow[]
    const assinaturas = (assinaturasData ?? []) as AssinaturaRow[]
    const cobrancas = (cobrancasData ?? []) as CobrancaRow[]

    const assinaturaMap = getLatestByBusiness(assinaturas)
    const ultimaCobrancaMap = getLatestChargeByBusiness(cobrancas)
    const primeiraCobrancaPagaMap = getFirstPaidChargeByBusiness(cobrancas)

    const clientes = businesses.map((business) => {
      const assinatura = assinaturaMap.get(business.id)
      const ultimaCobranca = ultimaCobrancaMap.get(business.id)
      const primeiraCobrancaPaga = primeiraCobrancaPagaMap.get(business.id)

      const valor = getAssinaturaValor(assinatura, ultimaCobranca)

      return {
        business_id: business.id,

        documento_cliente: getDocumentoCliente(business),
        cpf_cnpj: getDocumentoCliente(business),
        documento: getDocumentoCliente(business),

        razao_social: getRazaoSocial(business),
        nome_cliente: getNomeCliente(business),
        negocio: business.name || null,
        name: business.name || null,
        nome_responsavel: business.nome_responsavel || null,

        email_financeiro: getEmailCliente(business),
        whatsapp: getWhatsappCliente(business),

        cliente_criado_em: business.created_at || null,

        endereco_rua: getEnderecoRua(business),
        endereco_numero: getEnderecoNumero(business),
        endereco_complemento: getEnderecoComplemento(business),
        endereco_cep: getEnderecoCep(business),
        endereco_bairro: getEnderecoBairro(business),
        endereco_municipio: getEnderecoMunicipio(business),
        endereco_uf: getEnderecoUf(business),
        endereco_completo: getEnderecoCompleto(business),

        assinatura_id: assinatura?.id || null,
        assinatura_status: assinatura?.status || null,
        assinatura_status_code: getAssinaturaStatusCode(assinatura),
        assinatura_status_label: getAssinaturaStatusLabel(assinatura),

        plano: assinatura?.plano || null,
        plano_label: getPlanoLabel(assinatura),
        assinatura_valor: valor,

        trial_started_at: assinatura?.trial_started_at || null,
        trial_ends_at: assinatura?.trial_ends_at || null,
        trial_converted_at: assinatura?.trial_converted_at || null,
        data_ativacao: getDataAtivacao(assinatura, primeiraCobrancaPaga),

        proximo_vencimento: assinatura?.proximo_vencimento || null,
        dia_vencimento: assinatura?.dia_vencimento || null,

        forma_pagamento: getFormaPagamento(assinatura),
        forma_pagamento_label: getFormaPagamento(assinatura),

        cobranca_id: ultimaCobranca?.id || null,
        cobranca_status: ultimaCobranca?.status || null,
        cobranca_valor: ultimaCobranca?.valor ?? null,
        cobranca_vencimento: ultimaCobranca?.vencimento || null,
        cobranca_bling_id: ultimaCobranca?.bling_cobranca_id || null,
        cobranca_link_pagamento: ultimaCobranca?.bling_link_pagamento || null,
      }
    })

    return NextResponse.json({
      ok: true,
      success: true,
      data: clientes,
      clientes,
      items: clientes,
    })
  } catch (error) {
    console.error("Erro ao carregar clientes da Torre:", error)

    return NextResponse.json(
      {
        ok: false,
        success: false,
        message: "Não foi possível carregar os clientes.",
      },
      { status: 500 },
    )
  }
}