// src/features/billing/services/bling-payment-sync.service.ts

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { getBlingChargeDetails } from "@/lib/bling/charge.service"
import { atualizarStatusOperacionalAssinatura } from "@/lib/services/assinaturas/assinatura-service"
import {
  marcarCobrancaComoPaga,
  marcarCobrancaComoVencida,
} from "@/lib/services/cobrancas/cobranca-service"
import type {
  AssinaturaRow,
  CobrancaRow,
  CiCobrancaStatus,
} from "@/lib/types/assinaturas"

type DbClient = SupabaseClient<any, "public", any>

export type SincronizarCobrancaAtualInput = {
  businessId: string
  subscriptionId?: string | null
}

export type SincronizarCobrancaAtualResult = {
  success: true
  businessId: string
  assinaturaId: string
  localCharge: CobrancaRow | null
  subscriptionStatus: AssinaturaRow["status"] | null
  billingStatus: CiCobrancaStatus | null
  blingStatusRaw: string | null
  action:
    | "no_subscription"
    | "no_pending_charge"
    | "kept_pending"
    | "marked_paid"
    | "marked_overdue"
    | "marked_canceled"
}

function getEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não encontrada: ${name}`)
  }

  return value
}

function getAdminClient(): DbClient {
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL")
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY")

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeSearchText(value: unknown): string {
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).toLowerCase()
  }

  if (typeof value !== "string") {
    return ""
  }

  return value.toLowerCase()
}

function toIsoStringIfValid(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

function parseDateOnly(value?: string | null): Date | null {
  if (!value) return null

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function isCobrancaForaDaTolerancia(params: {
  cobranca: CobrancaRow
  toleranciaDias: number
  now?: Date
}) {
  const vencimento = parseDateOnly(params.cobranca.vencimento)

  if (!vencimento) return false

  const limitePagamento = addDays(vencimento, params.toleranciaDias)
  const referencia = params.now ?? new Date()

  return referencia.getTime() > limitePagamento.getTime()
}

function isBlingMissingChargeError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : typeof error === "string"
        ? error.toLowerCase()
        : ""

  return (
    message.includes("404") ||
    message.includes("não encontrado") ||
    message.includes("nao encontrado") ||
    message.includes("not found") ||
    message.includes("registro não encontrado") ||
    message.includes("registro nao encontrado") ||
    message.includes("inexistente")
  )
}

async function registrarEvento(
  supabase: DbClient,
  params: {
    assinaturaId: string
    businessId: string
    cobrancaId?: string | null
    tipo: string
    descricao: string
    origem?: "system" | "admin" | "cron" | "bling" | "user"
    metadata?: Record<string, unknown>
  },
): Promise<void> {
  const { error } = await supabase.from("ci_assinatura_eventos").insert({
    assinatura_id: params.assinaturaId,
    business_id: params.businessId,
    cobranca_id: params.cobrancaId ?? null,
    tipo: params.tipo,
    descricao: params.descricao,
    origem: params.origem ?? "system",
    metadata: params.metadata ?? {},
  })

  if (error) {
    throw new Error(`Erro ao registrar evento: ${error.message}`)
  }
}

async function buscarAssinatura(
  supabase: DbClient,
  businessId: string,
  subscriptionId?: string | null,
): Promise<AssinaturaRow | null> {
  let query = supabase
    .from("ci_assinaturas")
    .select("*")
    .eq("business_id", businessId)
    .is("cancelada_em", null)
    .order("created_at", { ascending: false })
    .limit(1)

  if (subscriptionId?.trim()) {
    query = query.eq("id", subscriptionId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    throw new Error(`Erro ao buscar assinatura para sincronização: ${error.message}`)
  }

  return (data as AssinaturaRow | null) ?? null
}

async function buscarCobrancaSincronizavel(
  supabase: DbClient,
  assinaturaId: string,
  businessId: string,
): Promise<CobrancaRow | null> {
  const { data, error } = await supabase
    .from("ci_cobrancas")
    .select("*")
    .eq("assinatura_id", assinaturaId)
    .eq("business_id", businessId)
    .in("status", ["pending", "overdue", "error"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Erro ao buscar cobrança para sincronização: ${error.message}`)
  }

  return (data as CobrancaRow | null) ?? null
}

function inferirStatusInternoBling(rawDetails: Record<string, unknown>): {
  billingStatus: CiCobrancaStatus | null
  paidAt: string | null
  rawStatus: string | null
} {
  const rawStatus = normalizeOptionalString(rawDetails.situacao)
  const rawStatusNormalized = normalizeSearchText(rawDetails.situacao)
  const historicoNormalized = normalizeSearchText(rawDetails.historico)
  const origemNormalized = normalizeSearchText(
    typeof rawDetails.origem === "object" && rawDetails.origem !== null
      ? JSON.stringify(rawDetails.origem)
      : rawDetails.origem,
  )

  const situacaoNumber =
    typeof rawDetails.situacao === "number"
      ? rawDetails.situacao
      : typeof rawDetails.situacao === "string"
        ? Number(rawDetails.situacao)
        : null

  const paidAt =
    toIsoStringIfValid(rawDetails.dataPagamento) ||
    toIsoStringIfValid(rawDetails.dataRecebimento) ||
    toIsoStringIfValid(rawDetails.dataBaixa)

  const valorRecebido =
    typeof rawDetails.valorRecebido === "number"
      ? rawDetails.valorRecebido
      : typeof rawDetails.valorRecebido === "string"
        ? Number(rawDetails.valorRecebido)
        : null

  const saldo =
    typeof rawDetails.saldo === "number"
      ? rawDetails.saldo
      : typeof rawDetails.saldo === "string"
        ? Number(rawDetails.saldo)
        : null

  const hasPaidSignal =
    !!paidAt ||
    (typeof valorRecebido === "number" &&
      Number.isFinite(valorRecebido) &&
      valorRecebido > 0) ||
    rawStatusNormalized.includes("recebid") ||
    rawStatusNormalized.includes("pago") ||
    rawStatusNormalized.includes("baixad") ||
    rawStatusNormalized.includes("liquid")

  if (hasPaidSignal) {
    return {
      billingStatus: "paid",
      paidAt,
      rawStatus,
    }
  }

  const hasCanceledSignal =
    situacaoNumber === 5 ||
    rawStatusNormalized.includes("cancel") ||
    rawStatusNormalized.includes("exclu") ||
    rawStatusNormalized.includes("anulad") ||
    rawStatusNormalized.includes("baixado cancel") ||
    rawStatusNormalized.includes("cancelad") ||
    rawStatusNormalized.includes("removid") ||
    rawStatusNormalized.includes("inativ") ||
    historicoNormalized.includes("cancelamento") ||
    historicoNormalized.includes("cancelad") ||
    historicoNormalized.includes("informações cancelamento") ||
    historicoNormalized.includes("informacoes cancelamento") ||
    origemNormalized.includes("cancelamento") ||
    origemNormalized.includes("cancelad")

  if (hasCanceledSignal) {
    return {
      billingStatus: "canceled",
      paidAt: null,
      rawStatus,
    }
  }

  const hasOverdueSignal =
    rawStatusNormalized.includes("vencid") ||
    rawStatusNormalized.includes("atras") ||
    rawStatusNormalized.includes("overdue") ||
    rawStatusNormalized.includes("inadimpl")

  if (hasOverdueSignal) {
    return {
      billingStatus: "overdue",
      paidAt: null,
      rawStatus,
    }
  }

  const hasOpenSignal =
    situacaoNumber === 1 ||
    situacaoNumber === 2 ||
    situacaoNumber === 3 ||
    situacaoNumber === 4 ||
    (typeof saldo === "number" && Number.isFinite(saldo) && saldo > 0)

  if (hasOpenSignal) {
    return {
      billingStatus: null,
      paidAt: null,
      rawStatus,
    }
  }

  return {
    billingStatus: null,
    paidAt: null,
    rawStatus,
  }
}

async function atualizarMetadadosConsulta(
  supabase: DbClient,
  cobranca: CobrancaRow,
  businessId: string,
  params: {
    rawStatus: string | null
    rawDetails: Record<string, unknown>
  },
): Promise<CobrancaRow> {
  const metadataAtual = (cobranca.metadata ?? {}) as Record<string, unknown>

  const { data, error } = await supabase
    .from("ci_cobrancas")
    .update({
      ultima_consulta_bling_em: new Date().toISOString(),
      bling_status_raw: params.rawStatus,
      metadata: {
        ...metadataAtual,
        bling_last_sync: {
          consulted_at: new Date().toISOString(),
          status_raw: params.rawStatus,
          details: params.rawDetails,
        },
      },
    })
    .eq("id", cobranca.id)
    .eq("business_id", businessId)
    .select("*")
    .single()

  if (error || !data) {
    throw new Error(
      `Erro ao atualizar metadados da consulta Bling: ${error?.message ?? "erro desconhecido"}`,
    )
  }

  return data as CobrancaRow
}

async function marcarCobrancaComoCancelada(
  supabase: DbClient,
  params: {
    cobrancaId: string
    businessId: string
    blingStatusRaw: string | null
    metadataExtra?: Record<string, unknown>
  },
): Promise<CobrancaRow> {
  const { data: atual, error: atualError } = await supabase
    .from("ci_cobrancas")
    .select("metadata")
    .eq("id", params.cobrancaId)
    .eq("business_id", params.businessId)
    .single()

  if (atualError) {
    throw new Error(`Erro ao ler cobrança antes de cancelar: ${atualError.message}`)
  }

  const metadataAtual = ((atual?.metadata ?? {}) as Record<string, unknown>) ?? {}

  const { data, error } = await supabase
    .from("ci_cobrancas")
    .update({
      status: "canceled",
      bling_status_raw: params.blingStatusRaw,
      ultima_consulta_bling_em: new Date().toISOString(),
      metadata: {
        ...metadataAtual,
        ...(params.metadataExtra ?? {}),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.cobrancaId)
    .eq("business_id", params.businessId)
    .select("*")
    .single()

  if (error || !data) {
    throw new Error(
      `Erro ao marcar cobrança como cancelada: ${error?.message ?? "erro desconhecido"}`,
    )
  }

  return data as CobrancaRow
}

async function marcarCobrancaParaBaixaManualNaTorre(
  supabase: DbClient,
  params: {
    assinatura: AssinaturaRow
    cobranca: CobrancaRow
    rawStatus: string | null
    rawDetails: Record<string, unknown>
  },
): Promise<CobrancaRow> {
  const metadataAtual = (params.cobranca.metadata ?? {}) as Record<string, unknown>

  const { data, error } = await supabase
    .from("ci_cobrancas")
    .update({
      status: "overdue",
      bling_status_raw: params.rawStatus,
      ultima_consulta_bling_em: new Date().toISOString(),
      metadata: {
        ...metadataAtual,
        torre_controle: {
          tipo: "cobranca_expirada_requer_baixa_manual_bling",
          status: "pendente",
          gerado_em: new Date().toISOString(),
          mensagem:
            "Cobrança passou da tolerância de pagamento. Fundadora deve fazer baixa/cancelamento manual no Bling.",
        },
        bling_last_sync: {
          consulted_at: new Date().toISOString(),
          status_raw: params.rawStatus,
          details: params.rawDetails,
          action: "requires_manual_bling_cancel",
        },
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.cobranca.id)
    .eq("business_id", params.assinatura.business_id)
    .select("*")
    .single()

  if (error || !data) {
    throw new Error(
      `Erro ao marcar cobrança para baixa manual: ${error?.message ?? "erro desconhecido"}`,
    )
  }

  await registrarEvento(supabase, {
    assinaturaId: params.assinatura.id,
    businessId: params.assinatura.business_id,
    cobrancaId: params.cobranca.id,
    tipo: "charge_expired_requires_manual_bling_cancel",
    descricao:
      "Cobrança passou da tolerância de pagamento. Fundadora deve fazer baixa/cancelamento manual no Bling.",
    origem: "system",
    metadata: {
      cobranca_id: params.cobranca.id,
      bling_cobranca_id: params.cobranca.bling_cobranca_id,
      vencimento: params.cobranca.vencimento,
      tolerancia_dias: params.assinatura.tolerancia_dias,
      bling_status_raw: params.rawStatus,
    },
  })

  return data as CobrancaRow
}

export async function sincronizarCobrancaAtualComBling(
  input: SincronizarCobrancaAtualInput,
): Promise<SincronizarCobrancaAtualResult> {
  const supabase = getAdminClient()

  console.log("[BLING SYNC] iniciando sincronização", {
    businessId: input.businessId,
    subscriptionId: input.subscriptionId ?? null,
  })

  const assinatura = await buscarAssinatura(
    supabase,
    input.businessId,
    input.subscriptionId ?? null,
  )

  if (!assinatura) {
    console.log("[BLING SYNC] nenhuma assinatura encontrada")

    return {
      success: true,
      businessId: input.businessId,
      assinaturaId: "",
      localCharge: null,
      subscriptionStatus: null,
      billingStatus: null,
      blingStatusRaw: null,
      action: "no_subscription",
    }
  }

  const cobranca = await buscarCobrancaSincronizavel(
    supabase,
    assinatura.id,
    input.businessId,
  )

  if (!cobranca) {
    console.log("[BLING SYNC] nenhuma cobrança sincronizável encontrada")

    return {
      success: true,
      businessId: input.businessId,
      assinaturaId: assinatura.id,
      localCharge: null,
      subscriptionStatus: assinatura.status,
      billingStatus: null,
      blingStatusRaw: null,
      action: "no_pending_charge",
    }
  }

  console.log("[BLING SYNC] cobrança local encontrada", {
    cobrancaId: cobranca.id,
    statusLocal: cobranca.status,
    blingCobrancaId: cobranca.bling_cobranca_id,
    vencimento: cobranca.vencimento,
  })

  if (!normalizeOptionalString(cobranca.bling_cobranca_id)) {
    throw new Error("A cobrança ainda não possui bling_cobranca_id.")
  }

  let rawDetails: Record<string, unknown> | null = null

  try {
    rawDetails = await getBlingChargeDetails(cobranca.bling_cobranca_id as string)

    console.log(
      "[BLING SYNC] detalhes cobrança:",
      JSON.stringify(rawDetails, null, 2),
    )
  } catch (error) {
    if (!isBlingMissingChargeError(error)) {
      console.error("[BLING SYNC] erro ao consultar Bling:", error)
      throw error
    }

    console.warn("[BLING SYNC] cobrança não encontrada no Bling. Marcando como cancelada.")

    const cobrancaCancelada = await marcarCobrancaComoCancelada(supabase, {
      cobrancaId: cobranca.id,
      businessId: input.businessId,
      blingStatusRaw: "not_found",
      metadataExtra: {
        bling_last_sync: {
          consulted_at: new Date().toISOString(),
          status_raw: "not_found",
          details: null,
          reason: "charge_not_found_in_bling",
        },
      },
    })

    const assinaturaAtualizada = await atualizarStatusOperacionalAssinatura(
      supabase,
      {
        assinaturaId: assinatura.id,
        businessId: input.businessId,
        cobrancaAtualStatus: "canceled",
      },
    )

    await registrarEvento(supabase, {
      assinaturaId: assinatura.id,
      businessId: input.businessId,
      cobrancaId: cobranca.id,
      tipo: "bling_payment_sync_canceled",
      descricao:
        "Sincronização com Bling identificou que a cobrança não existe mais no Bling.",
      origem: "bling",
      metadata: {
        bling_status_raw: "not_found",
        charge_id: cobranca.bling_cobranca_id,
      },
    })

    return {
      success: true,
      businessId: input.businessId,
      assinaturaId: assinatura.id,
      localCharge: cobrancaCancelada,
      subscriptionStatus: assinaturaAtualizada.status,
      billingStatus: cobrancaCancelada.status,
      blingStatusRaw: "not_found",
      action: "marked_canceled",
    }
  }

  const inferencia = inferirStatusInternoBling(rawDetails)

  console.log("[BLING SYNC] inferência:", inferencia)

  let cobrancaAtualizada = await atualizarMetadadosConsulta(
    supabase,
    cobranca,
    input.businessId,
    {
      rawStatus: inferencia.rawStatus,
      rawDetails,
    },
  )

  if (inferencia.billingStatus === "paid") {
    cobrancaAtualizada = await marcarCobrancaComoPaga(supabase, {
      cobrancaId: cobranca.id,
      businessId: input.businessId,
      pagoEm: inferencia.paidAt ? new Date(inferencia.paidAt) : new Date(),
      blingStatusRaw: inferencia.rawStatus,
    })

    const assinaturaAtualizada = await atualizarStatusOperacionalAssinatura(
      supabase,
      {
        assinaturaId: assinatura.id,
        businessId: input.businessId,
        cobrancaAtualStatus: "paid",
      },
    )

    await registrarEvento(supabase, {
      assinaturaId: assinatura.id,
      businessId: input.businessId,
      cobrancaId: cobranca.id,
      tipo: "bling_payment_sync_paid",
      descricao: "Sincronização com Bling identificou cobrança paga.",
      origem: "bling",
      metadata: {
        bling_status_raw: inferencia.rawStatus,
        pago_em: inferencia.paidAt,
      },
    })

    return {
      success: true,
      businessId: input.businessId,
      assinaturaId: assinatura.id,
      localCharge: cobrancaAtualizada,
      subscriptionStatus: assinaturaAtualizada.status,
      billingStatus: cobrancaAtualizada.status,
      blingStatusRaw: inferencia.rawStatus,
      action: "marked_paid",
    }
  }

  if (inferencia.billingStatus === "canceled") {
    cobrancaAtualizada = await marcarCobrancaComoCancelada(supabase, {
      cobrancaId: cobranca.id,
      businessId: input.businessId,
      blingStatusRaw: inferencia.rawStatus,
      metadataExtra: {
        bling_last_sync: {
          consulted_at: new Date().toISOString(),
          status_raw: inferencia.rawStatus,
          details: rawDetails,
        },
      },
    })

    const assinaturaAtualizada = await atualizarStatusOperacionalAssinatura(
      supabase,
      {
        assinaturaId: assinatura.id,
        businessId: input.businessId,
        cobrancaAtualStatus: "canceled",
      },
    )

    await registrarEvento(supabase, {
      assinaturaId: assinatura.id,
      businessId: input.businessId,
      cobrancaId: cobranca.id,
      tipo: "bling_payment_sync_canceled",
      descricao: "Sincronização com Bling identificou cobrança cancelada.",
      origem: "bling",
      metadata: {
        bling_status_raw: inferencia.rawStatus,
      },
    })

    return {
      success: true,
      businessId: input.businessId,
      assinaturaId: assinatura.id,
      localCharge: cobrancaAtualizada,
      subscriptionStatus: assinaturaAtualizada.status,
      billingStatus: cobrancaAtualizada.status,
      blingStatusRaw: inferencia.rawStatus,
      action: "marked_canceled",
    }
  }

  const foraDaTolerancia = isCobrancaForaDaTolerancia({
    cobranca,
    toleranciaDias: assinatura.tolerancia_dias ?? 3,
  })

  if (inferencia.billingStatus === "overdue" || foraDaTolerancia) {
    cobrancaAtualizada = await marcarCobrancaComoVencida(supabase, {
      cobrancaId: cobranca.id,
      businessId: input.businessId,
      blingStatusRaw: inferencia.rawStatus,
    })

    if (foraDaTolerancia) {
      cobrancaAtualizada = await marcarCobrancaParaBaixaManualNaTorre(
        supabase,
        {
          assinatura,
          cobranca: cobrancaAtualizada,
          rawStatus: inferencia.rawStatus,
          rawDetails,
        },
      )
    }

    const assinaturaAtualizada = await atualizarStatusOperacionalAssinatura(
      supabase,
      {
        assinaturaId: assinatura.id,
        businessId: input.businessId,
        cobrancaAtualStatus: "overdue",
      },
    )

    await registrarEvento(supabase, {
      assinaturaId: assinatura.id,
      businessId: input.businessId,
      cobrancaId: cobranca.id,
      tipo: foraDaTolerancia
        ? "bling_payment_sync_overdue_outside_tolerance"
        : "bling_payment_sync_overdue",
      descricao: foraDaTolerancia
        ? "Cobrança vencida passou da tolerância e foi enviada para baixa manual na Torre de Controle."
        : "Sincronização com Bling identificou cobrança vencida.",
      origem: "bling",
      metadata: {
        bling_status_raw: inferencia.rawStatus,
        fora_da_tolerancia: foraDaTolerancia,
        tolerancia_dias: assinatura.tolerancia_dias ?? 3,
      },
    })

    return {
      success: true,
      businessId: input.businessId,
      assinaturaId: assinatura.id,
      localCharge: cobrancaAtualizada,
      subscriptionStatus: assinaturaAtualizada.status,
      billingStatus: cobrancaAtualizada.status,
      blingStatusRaw: inferencia.rawStatus,
      action: "marked_overdue",
    }
  }

  const assinaturaAtualizada = await atualizarStatusOperacionalAssinatura(
    supabase,
    {
      assinaturaId: assinatura.id,
      businessId: input.businessId,
      cobrancaAtualStatus: "pending",
    },
  )

  await registrarEvento(supabase, {
    assinaturaId: assinatura.id,
    businessId: input.businessId,
    cobrancaId: cobranca.id,
    tipo: "bling_payment_sync_pending",
    descricao: "Sincronização com Bling manteve a cobrança como pendente.",
    origem: "bling",
    metadata: {
      bling_status_raw: inferencia.rawStatus,
    },
  })

  return {
    success: true,
    businessId: input.businessId,
    assinaturaId: assinatura.id,
    localCharge: cobrancaAtualizada,
    subscriptionStatus: assinaturaAtualizada.status,
    billingStatus: cobrancaAtualizada.status,
    blingStatusRaw: inferencia.rawStatus,
    action: "kept_pending",
  }
}