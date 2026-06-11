// src/lib/billing-charge.repository.ts

import { createClient, SupabaseClient } from "@supabase/supabase-js"

export type BillingChargePaymentMethod = "pix" | "boleto"
export type BillingChargeStatus = "pending" | "paid" | "overdue" | "canceled"

export interface BillingChargeRecord {
  id: string
  business_id: string
  assinatura_id: string | null
  valor: number
  vencimento: string | null
  status: BillingChargeStatus
  sync_status: "pending" | "success" | "error" | null
  bling_cobranca_id: string | null
  bling_link_pagamento: string | null
  bling_status_raw: string | null
  pago_em: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface SaveBillingChargeInput {
  businessId: string
  subscriptionId?: string | null
  paymentMethod: BillingChargePaymentMethod
  status: BillingChargeStatus
  blingContactId?: string | null
  blingChargeId?: string | null
  amount: number
  dueDate?: string | null
  paymentLink?: string | null
  boletoLink?: string | null
  pixQrCode?: string | null
  pixCode?: string | null
  rawPayload: Record<string, unknown>
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function getAdminClient(): SupabaseClient {
  if (!SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurada.")
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.")
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function findPendingBillingChargeByBusinessId(
  businessId: string,
): Promise<BillingChargeRecord | null> {
  const supabase = getAdminClient()

  const { data, error } = await supabase
    .from("ci_cobrancas")
    .select("*")
    .eq("business_id", businessId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Erro ao buscar cobrança pendente: ${error.message}`)
  }

  return (data as BillingChargeRecord | null) ?? null
}

export async function saveBillingCharge(
  input: SaveBillingChargeInput,
): Promise<BillingChargeRecord> {
  const supabase = getAdminClient()

  const metadata = {
    payment_method: input.paymentMethod,
    bling: {
      contact_id: input.blingContactId ?? null,
      charge_id: input.blingChargeId ?? null,
      payment_link: input.paymentLink ?? null,
      boleto_link: input.boletoLink ?? null,
      pix_qr_code: input.pixQrCode ?? null,
      pix_code: input.pixCode ?? null,
      raw: input.rawPayload,
    },
  }

  const payload = {
    assinatura_id: input.subscriptionId ?? null,
    business_id: input.businessId,
    competencia: input.dueDate ? input.dueDate.slice(0, 7) : new Date().toISOString().slice(0, 7),
    ciclo_tipo: "recurring",
    valor: input.amount,
    gerada_em: new Date().toISOString(),
    vencimento: input.dueDate ?? new Date().toISOString().slice(0, 10),
    status: input.status,
    sync_status: "success",
    sync_error: null,
    bling_cobranca_id: input.blingChargeId ?? null,
    bling_link_pagamento: input.paymentLink ?? input.boletoLink ?? input.pixQrCode ?? null,
    bling_status_raw: input.status,
    metadata,
  }

  const { data, error } = await supabase
    .from("ci_cobrancas")
    .insert(payload)
    .select("*")
    .single()

  if (error) {
    throw new Error(`Erro ao salvar cobrança: ${error.message}`)
  }

  return data as BillingChargeRecord
}

export async function updateSubscriptionStatusToPending(
  businessId: string,
): Promise<void> {
  const supabase = getAdminClient()

  const { error } = await supabase
    .from("ci_assinaturas")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", businessId)

  if (error) {
    throw new Error(`Erro ao atualizar assinatura: ${error.message}`)
  }
}