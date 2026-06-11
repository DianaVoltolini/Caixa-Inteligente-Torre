// src/features/subscription/services/subscription.service.ts

import { createClient } from "@/lib/supabase/client"

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]

export interface JsonObject {
  [key: string]: JsonValue
}

export type SubscriptionPaymentMethod = "pix" | "boleto"

export type SubscriptionStatus =
  | "trialing"
  | "awaiting_payment"
  | "active"
  | "grace_period"
  | "overdue"
  | "blocked"
  | "canceled"
  | string

export type BillingChargeStatus =
  | "draft"
  | "pending"
  | "paid"
  | "overdue"
  | "canceled"
  | "error"
  | string

export interface CreateSubscriptionChargePayload {
  businessId: string
  subscriptionId?: string | null
  paymentMethod: SubscriptionPaymentMethod
}

export interface SubscriptionChargeRow {
  id: string
  business_id: string
  assinatura_id: string | null
  subscription_id: string | null
  status: BillingChargeStatus
  sync_status?: string | null
  valor?: number | null
  amount?: number | null
  vencimento?: string | null
  due_date?: string | null
  payment_method?: SubscriptionPaymentMethod | null
  provider?: string | null
  bling_cobranca_id?: string | null
  bling_charge_id?: string | null
  bling_link_pagamento?: string | null
  payment_link?: string | null
  boleto_link?: string | null
  pix_code?: string | null
  pix_qr_code?: string | null
  pix_qr_code_link?: string | null
  bling_status_raw?: string | null
  external_status?: string | null
  metadata?: JsonObject | null
  payload?: JsonObject | null
  raw_payload?: JsonObject | null
  raw_response?: JsonObject | null
  created_at: string
  updated_at?: string | null
  paid_at?: string | null
  pago_em?: string | null
}

export interface CreateSubscriptionChargeResponse {
  success: boolean
  source?: "existing_pending_charge" | "new_local_charge"
  assinaturaId?: string
  subscriptionStatus?: SubscriptionStatus | null
  localCharge?: SubscriptionChargeRow | null
  blingContactId?: string | null
  blingChargeId?: string | null
  paymentMethod?: SubscriptionPaymentMethod
  status?: BillingChargeStatus | null
  paymentLink?: string | null
  boletoLink?: string | null
  pixCode?: string | null
  pixQrCode?: string | null
  error?: string
}

export interface SubscriptionRow {
  id: string
  business_id: string
  status: SubscriptionStatus
  plano: string | null
  valor: number | null
  trial_started_at: string | null
  trial_ends_at: string | null
  trial_converted_at: string | null
  dia_vencimento: number | null
  proximo_vencimento: string | null
  tolerancia_dias: number | null
  assinada_em: string | null
  cancelada_em: string | null
  bloqueada_em: string | null
  bloqueio_manual: boolean | null
  bling_cliente_id: string | null
  observacoes_internas: string | null
  metadata: JsonObject | null
  created_at: string
  updated_at: string
  payment_method: SubscriptionPaymentMethod | null
  max_transactions: number
  grace_ends_at: string | null
}

export interface SubscriptionSnapshot {
  subscription: SubscriptionRow | null
  transactionCount: number
}

export interface CurrentSubscriptionChargeResponse {
  success: boolean
  charge?: SubscriptionChargeRow | null
  error?: string
}

export interface SyncCurrentChargePayload {
  businessId: string
  subscriptionId?: string | null
}

export interface SyncCurrentChargeResponse {
  success: boolean
  action?:
    | "synced"
    | "no_subscription"
    | "no_pending_charge"
    | "charge_canceled"
    | "charge_paid"
    | "charge_overdue"
    | "charge_pending"
  charge?: SubscriptionChargeRow | null
  error?: string
}

export interface CancelSubscriptionPayload {
  businessId: string
}

export interface CancelSubscriptionResponse {
  success: boolean
  subscription?: SubscriptionRow | null
  canceledCharge?: SubscriptionChargeRow | null
  message?: string
  error?: string
}

interface AssinaturaRow {
  id: string
  business_id: string
  status: SubscriptionStatus
  plano: string | null
  valor: number | null
  trial_started_at: string | null
  trial_ends_at: string | null
  trial_converted_at: string | null
  dia_vencimento: number | null
  proximo_vencimento: string | null
  tolerancia_dias: number | null
  assinada_em: string | null
  cancelada_em: string | null
  bloqueada_em: string | null
  bloqueio_manual: boolean | null
  bling_cliente_id: string | null
  observacoes_internas: string | null
  metadata: JsonObject | null
  created_at: string
  updated_at: string
  payment_method: SubscriptionPaymentMethod | null
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function parseJson<T>(value: string): T | null {
  if (!value.trim()) return null

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

async function readJsonResponse<T>(response: Response): Promise<T | null> {
  const rawText = await response.text()
  return parseJson<T>(rawText)
}

function normalizeSubscriptionRow(
  row: AssinaturaRow | null,
): SubscriptionRow | null {
  if (!row) return null

  const graceEndsAt =
    row.proximo_vencimento && row.tolerancia_dias != null
      ? addDays(
          new Date(`${row.proximo_vencimento}T00:00:00`),
          row.tolerancia_dias,
        ).toISOString()
      : null

  return {
    ...row,
    max_transactions: 30,
    grace_ends_at: graceEndsAt,
  }
}

async function getLatestSubscriptionFromDatabase(
  businessId: string,
): Promise<SubscriptionRow | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("ci_assinaturas")
    .select(`
      id,
      business_id,
      status,
      plano,
      valor,
      trial_started_at,
      trial_ends_at,
      trial_converted_at,
      dia_vencimento,
      proximo_vencimento,
      tolerancia_dias,
      assinada_em,
      cancelada_em,
      bloqueada_em,
      bloqueio_manual,
      bling_cliente_id,
      observacoes_internas,
      metadata,
      created_at,
      updated_at,
      payment_method
    `)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Erro ao buscar assinatura: ${error.message}`)
  }

  return normalizeSubscriptionRow((data as AssinaturaRow | null) ?? null)
}

async function getTransactionCountFromDatabase(
  businessId: string,
): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from("ci_transactions")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .is("deleted_at", null)

  if (error) {
    throw new Error(`Erro ao contar lançamentos: ${error.message}`)
  }

  return count ?? 0
}

export async function getLatestSubscriptionSnapshot(
  businessId: string,
): Promise<SubscriptionSnapshot> {
  if (!businessId) {
    return {
      subscription: null,
      transactionCount: 0,
    }
  }

  const [subscriptionResult, transactionCountResult] =
    await Promise.allSettled([
      getLatestSubscriptionFromDatabase(businessId),
      getTransactionCountFromDatabase(businessId),
    ])

  const subscription =
    subscriptionResult.status === "fulfilled"
      ? subscriptionResult.value
      : null

  const transactionCount =
    transactionCountResult.status === "fulfilled"
      ? transactionCountResult.value
      : 0

  if (subscriptionResult.status === "rejected") {
    console.error("[subscription.service] erro ao buscar assinatura:", {
      businessId,
      error:
        subscriptionResult.reason instanceof Error
          ? subscriptionResult.reason.message
          : String(subscriptionResult.reason),
    })
  }

  if (transactionCountResult.status === "rejected") {
    console.error("[subscription.service] erro ao contar lançamentos:", {
      businessId,
      error:
        transactionCountResult.reason instanceof Error
          ? transactionCountResult.reason.message
          : String(transactionCountResult.reason),
    })
  }

  return {
    subscription,
    transactionCount,
  }
}

export async function createSubscriptionCharge(
  payload: CreateSubscriptionChargePayload,
): Promise<CreateSubscriptionChargeResponse> {
  let response: Response

  try {
    response = await fetch("/api/subscription/create-charge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error(
      "[subscription.service] falha ao criar cobrança:",
      error,
    )

    throw new Error(
      "Não consegui falar com o servidor para gerar a cobrança.",
    )
  }

  const data =
    await readJsonResponse<CreateSubscriptionChargeResponse>(
      response,
    )

  if (!response.ok) {
    throw new Error(
      data?.error || "Não consegui gerar a cobrança agora.",
    )
  }

  if (!data?.success) {
    throw new Error(
      data?.error || "Não consegui gerar a cobrança agora.",
    )
  }

  return data
}

export async function getCurrentSubscriptionCharge(
  businessId: string,
): Promise<SubscriptionChargeRow | null> {
  const response = await fetch(
    `/api/subscription/current-charge?businessId=${encodeURIComponent(
      businessId,
    )}`,
    {
      method: "GET",
      cache: "no-store",
    },
  )

  const data =
    await readJsonResponse<CurrentSubscriptionChargeResponse>(
      response,
    )

  if (!response.ok) {
    throw new Error(
      data?.error || "Não consegui carregar a cobrança atual.",
    )
  }

  if (!data?.success) {
    throw new Error(
      data?.error || "Não consegui carregar a cobrança atual.",
    )
  }

  return data.charge ?? null
}

export async function syncCurrentSubscriptionCharge(
  payload: SyncCurrentChargePayload,
): Promise<SyncCurrentChargeResponse> {
  const response = await fetch(
    "/api/subscription/sync-current-charge",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  )

  const data =
    await readJsonResponse<SyncCurrentChargeResponse>(
      response,
    )

  if (!response.ok) {
    throw new Error(
      data?.error || "Não consegui sincronizar a cobrança agora.",
    )
  }

  if (!data?.success) {
    throw new Error(
      data?.error || "Não consegui sincronizar a cobrança agora.",
    )
  }

  return data
}

export async function cancelSubscription(
  payload: CancelSubscriptionPayload,
): Promise<CancelSubscriptionResponse> {
  const response = await fetch("/api/subscription/cancel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const data =
    await readJsonResponse<CancelSubscriptionResponse>(
      response,
    )

  if (!response.ok) {
    throw new Error(
      data?.error || "Não consegui cancelar sua assinatura agora.",
    )
  }

  if (!data?.success) {
    throw new Error(
      data?.error || "Não consegui cancelar sua assinatura agora.",
    )
  }

  return data
}