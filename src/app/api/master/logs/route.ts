// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\api\master\logs\route.ts

import { NextRequest, NextResponse } from "next/server"

import { requireMasterApiUser } from "@/lib/auth/require-master-api"
import { supabaseAdmin } from "@/lib/supabase/admin"

type AnyRow = Record<string, unknown>

type BusinessRow = {
  id: string
  name: string | null
  nome_responsavel: string | null
  email_financeiro: string | null
}

type LogItem = {
  id: string
  created_at: string | null
  modulo: "assinatura" | "cobranca" | "bling" | "cliente" | "sistema"
  tipo: string
  status: "sucesso" | "erro" | "alerta" | "info"
  cliente: string
  email: string | null
  descricao: string
  detalhes: string | null
  business_id: string | null
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function getLimit(request: NextRequest) {
  const raw = Number(request.nextUrl.searchParams.get("limit") ?? 200)

  if (!Number.isFinite(raw) || raw <= 0) return 200

  return Math.min(500, Math.floor(raw))
}

function getString(row: AnyRow, key: string) {
  const value = row[key]

  if (value === null || value === undefined) return null

  return String(value)
}

function getNumber(row: AnyRow, key: string) {
  const value = row[key]

  if (value === null || value === undefined) return null

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}

function getDateValue(row: AnyRow) {
  return (
    getString(row, "created_at") ||
    getString(row, "gerada_em") ||
    getString(row, "enviada_ao_bling_em") ||
    getString(row, "ultima_consulta_bling_em") ||
    getString(row, "updated_at") ||
    null
  )
}

function getBusinessId(row: AnyRow) {
  return (
    getString(row, "business_id") ||
    getString(row, "businessId") ||
    getString(row, "empresa_id") ||
    null
  )
}

function getSummaryKey(item: LogItem) {
  return (
    item.business_id ||
    item.email ||
    item.cliente ||
    item.id
  )
}

function getBusinessName(
  businessMap: Map<string, BusinessRow>,
  businessId: string | null,
) {
  if (!businessId) return "Cliente não identificado"

  const business = businessMap.get(businessId)

  return (
    business?.name ||
    business?.nome_responsavel ||
    "Cliente não identificado"
  )
}

function getBusinessEmail(
  businessMap: Map<string, BusinessRow>,
  businessId: string | null,
) {
  if (!businessId) return null

  const business = businessMap.get(businessId)

  return business?.email_financeiro || null
}

function resolveLogStatus(value: unknown): LogItem["status"] {
  const status = normalizeText(value)

  if (
    status.includes("error") ||
    status.includes("erro") ||
    status.includes("failed") ||
    status.includes("fail")
  ) {
    return "erro"
  }

  if (
    status.includes("overdue") ||
    status.includes("vencid") ||
    status.includes("blocked") ||
    status.includes("bloque")
  ) {
    return "alerta"
  }

  if (
    status.includes("success") ||
    status.includes("sucesso") ||
    status.includes("paid") ||
    status.includes("pago")
  ) {
    return "sucesso"
  }

  return "info"
}

function getReadableChargeStatus(status: string | null) {
  const normalized = normalizeText(status)

  if (normalized === "pending") return "Cobrança aberta"
  if (normalized === "paid") return "Cobrança paga"
  if (normalized === "overdue") return "Cobrança vencida"
  if (normalized === "canceled") return "Cobrança cancelada"
  if (normalized === "error") return "Erro na cobrança"

  return status || "Cobrança registrada"
}

function getReadableSubscriptionStatus(status: string | null) {
  const normalized = normalizeText(status)

  if (normalized === "trialing") return "Cliente em teste"
  if (normalized === "active") return "Assinatura ativa"
  if (normalized === "awaiting_payment") return "Aguardando pagamento"
  if (normalized === "grace_period") return "Período de tolerância"
  if (normalized === "overdue") return "Assinatura vencida"
  if (normalized === "blocked") return "Assinatura bloqueada"
  if (normalized === "canceled") return "Assinatura cancelada"

  return status || "Assinatura registrada"
}

function extractDetails(row: AnyRow) {
  const rawParts = [
    getString(row, "sync_error"),
    getString(row, "erro"),
    getString(row, "error"),
    getString(row, "message"),
    getString(row, "mensagem"),
    getString(row, "origem"),
    getString(row, "source"),
  ].filter(Boolean)

  if (rawParts.length > 0) {
    return rawParts.join(" · ")
  }

  const metadata = row.metadata || row.payload || row.raw || row.bling_status_raw

  if (!metadata) return null

  if (typeof metadata === "string") {
    return metadata.length > 180 ? `${metadata.substring(0, 180)}...` : metadata
  }

  try {
    const stringified = JSON.stringify(metadata)

    return stringified.length > 180
      ? `${stringified.substring(0, 180)}...`
      : stringified
  } catch {
    return null
  }
}

async function safeSelect(tableName: string, limit: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.warn(`Logs: não foi possível consultar ${tableName}:`, error)
      return []
    }

    return (data ?? []) as AnyRow[]
  } catch (error) {
    console.warn(`Logs: erro inesperado ao consultar ${tableName}:`, error)
    return []
  }
}

function mapAssinaturaEventoToLog(
  row: AnyRow,
  businessMap: Map<string, BusinessRow>,
): LogItem {
  const businessId = getBusinessId(row)
  const tipo =
    getString(row, "tipo") ||
    getString(row, "event_type") ||
    getString(row, "evento") ||
    "Evento de assinatura"

  const status = resolveLogStatus(
    getString(row, "status") ||
      getString(row, "resultado") ||
      getString(row, "success"),
  )

  return {
    id:
      getString(row, "id") ||
      `assinatura-evento-${businessId || "sem-cliente"}-${getDateValue(row)}`,
    created_at: getDateValue(row),
    modulo: "assinatura",
    tipo,
    status,
    cliente: getBusinessName(businessMap, businessId),
    email: getBusinessEmail(businessMap, businessId),
    descricao:
      getString(row, "descricao") ||
      getString(row, "description") ||
      getString(row, "mensagem") ||
      tipo,
    detalhes: extractDetails(row),
    business_id: businessId,
  }
}

function mapCobrancaToLog(
  row: AnyRow,
  businessMap: Map<string, BusinessRow>,
): LogItem {
  const businessId = getBusinessId(row)
  const status = getString(row, "status")
  const syncStatus = getString(row, "sync_status")
  const valor = getNumber(row, "valor")
  const vencimento = getString(row, "vencimento")
  const blingId = getString(row, "bling_cobranca_id")

  const statusFinal =
    resolveLogStatus(syncStatus) === "erro"
      ? "erro"
      : resolveLogStatus(status)

  const detalhes = [
    valor !== null ? `Valor: R$ ${valor.toFixed(2).replace(".", ",")}` : null,
    vencimento ? `Vencimento: ${vencimento}` : null,
    blingId ? `Bling ID: ${blingId}` : null,
    extractDetails(row),
  ]
    .filter(Boolean)
    .join(" · ")

  return {
    id: getString(row, "id") || `cobranca-${businessId}-${getDateValue(row)}`,
    created_at: getDateValue(row),
    modulo: "cobranca",
    tipo: getReadableChargeStatus(status),
    status: statusFinal,
    cliente: getBusinessName(businessMap, businessId),
    email: getBusinessEmail(businessMap, businessId),
    descricao: getReadableChargeStatus(status),
    detalhes: detalhes || null,
    business_id: businessId,
  }
}

function mapAssinaturaToLog(
  row: AnyRow,
  businessMap: Map<string, BusinessRow>,
): LogItem {
  const businessId = getBusinessId(row)
  const status = getString(row, "status")
  const plano = getString(row, "plano")
  const proximoVencimento = getString(row, "proximo_vencimento")

  const detalhes = [
    plano ? `Plano: ${plano}` : null,
    proximoVencimento ? `Próximo vencimento: ${proximoVencimento}` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return {
    id: getString(row, "id") || `assinatura-${businessId}-${getDateValue(row)}`,
    created_at: getDateValue(row),
    modulo: "assinatura",
    tipo: getReadableSubscriptionStatus(status),
    status: resolveLogStatus(status),
    cliente: getBusinessName(businessMap, businessId),
    email: getBusinessEmail(businessMap, businessId),
    descricao: getReadableSubscriptionStatus(status),
    detalhes: detalhes || null,
    business_id: businessId,
  }
}

function mapBusinessToLog(row: AnyRow): LogItem {
  const businessId = getString(row, "id")
  const name =
    getString(row, "name") ||
    getString(row, "nome_responsavel") ||
    "Cliente sem nome"

  return {
    id: businessId || `cliente-${getDateValue(row)}`,
    created_at: getDateValue(row),
    modulo: "cliente",
    tipo: "Cliente cadastrado",
    status: "info",
    cliente: name,
    email: getString(row, "email_financeiro"),
    descricao: "Cliente cadastrado na base",
    detalhes: getString(row, "whatsapp")
      ? `WhatsApp: ${getString(row, "whatsapp")}`
      : null,
    business_id: businessId,
  }
}

function matchesSearch(item: LogItem, search: string) {
  if (!search) return true

  const content = normalizeText([
    item.modulo,
    item.tipo,
    item.status,
    item.cliente,
    item.email,
    item.descricao,
    item.detalhes,
    item.business_id,
  ].join(" "))

  return content.includes(search)
}

function matchesModulo(item: LogItem, modulo: string) {
  if (!modulo || modulo === "todos") return true

  return item.modulo === modulo
}

function matchesStatus(item: LogItem, status: string) {
  if (!status || status === "todos") return true

  return item.status === status
}

function getSummary(items: LogItem[]) {
  const total = new Set<string>()
  const sucesso = new Set<string>()
  const erro = new Set<string>()
  const alerta = new Set<string>()
  const cobranca = new Set<string>()
  const assinatura = new Set<string>()
  const cliente = new Set<string>()

  items.forEach((item) => {
    const key = getSummaryKey(item)

    total.add(key)

    if (item.status === "sucesso") sucesso.add(key)
    if (item.status === "erro") erro.add(key)
    if (item.status === "alerta") alerta.add(key)
    if (item.modulo === "cobranca") cobranca.add(key)
    if (item.modulo === "assinatura") assinatura.add(key)
    if (item.modulo === "cliente") cliente.add(key)
  })

  return {
    total: total.size,
    sucesso: sucesso.size,
    erro: erro.size,
    alerta: alerta.size,
    cobranca: cobranca.size,
    assinatura: assinatura.size,
    cliente: cliente.size,
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMasterApiUser()

    if (!auth.authorized) {
      return auth.response
    }

    const limit = getLimit(request)
    const search = normalizeText(request.nextUrl.searchParams.get("search"))
    const modulo = normalizeText(request.nextUrl.searchParams.get("modulo"))
    const status = normalizeText(request.nextUrl.searchParams.get("status"))

    const [
      businessesRows,
      assinaturaEventosRows,
      cobrancasRows,
      assinaturasRows,
    ] = await Promise.all([
      safeSelect("ci_business", 500),
      safeSelect("ci_assinatura_eventos", limit),
      safeSelect("ci_cobrancas", limit),
      safeSelect("ci_assinaturas", limit),
    ])

    const businessMap = new Map<string, BusinessRow>()

    businessesRows.forEach((row) => {
      const id = getString(row, "id")

      if (!id) return

      businessMap.set(id, {
        id,
        name: getString(row, "name"),
        nome_responsavel: getString(row, "nome_responsavel"),
        email_financeiro: getString(row, "email_financeiro"),
      })
    })

    const logs: LogItem[] = [
      ...assinaturaEventosRows.map((row) =>
        mapAssinaturaEventoToLog(row, businessMap),
      ),
      ...cobrancasRows.map((row) => mapCobrancaToLog(row, businessMap)),
      ...assinaturasRows.map((row) => mapAssinaturaToLog(row, businessMap)),
      ...businessesRows.slice(0, 80).map(mapBusinessToLog),
    ]

    const sortedLogs = logs
      .filter((item) => matchesSearch(item, search))
      .filter((item) => matchesModulo(item, modulo))
      .filter((item) => matchesStatus(item, status))
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()

        return dateB - dateA
      })
      .slice(0, limit)

    return NextResponse.json({
      ok: true,
      summary: getSummary(sortedLogs),
      data: sortedLogs,
    })
  } catch (error) {
    console.error("Erro ao carregar logs da Torre:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Não foi possível carregar os logs da Torre.",
      },
      { status: 500 },
    )
  }
}