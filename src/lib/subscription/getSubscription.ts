// src/lib/subscription/getSubscription.ts

import { createClient } from "@/lib/supabase/client"

export type Subscription = {
  id?: string
  business_id?: string
  plano: string
  status: string
  trial_started_at: string | null
  trial_ends_at: string | null
  trial_converted_at?: string | null
  proximo_vencimento: string | null
  tolerancia_dias: number
  valor: number
  payment_method: "pix" | "boleto" | null
  dia_vencimento: number | null
  bloqueada_em?: string | null
  bloqueio_manual?: boolean
  metadata?: Record<string, unknown>
  max_transactions?: number | null
  grace_ends_at?: string | null
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function normalizeSubscription(data: any): Subscription | null {
  if (!data) return null

  const graceEndsAt =
    data.proximo_vencimento && data.tolerancia_dias != null
      ? addDays(
          new Date(`${data.proximo_vencimento}T00:00:00`),
          Number(data.tolerancia_dias),
        ).toISOString()
      : null

  return {
    id: data.id,
    business_id: data.business_id,
    plano: data.plano,
    status: data.status,
    trial_started_at: data.trial_started_at,
    trial_ends_at: data.trial_ends_at,
    trial_converted_at: data.trial_converted_at ?? null,
    proximo_vencimento: data.proximo_vencimento,
    tolerancia_dias: Number(data.tolerancia_dias ?? 0),
    valor: Number(data.valor ?? 0),
    payment_method: data.payment_method ?? null,
    dia_vencimento: data.dia_vencimento ?? null,
    bloqueada_em: data.bloqueada_em ?? null,
    bloqueio_manual: Boolean(data.bloqueio_manual),
    metadata: data.metadata ?? {},
    max_transactions: 30,
    grace_ends_at: graceEndsAt,
  }
}

export async function getSubscription(
  businessId: string,
): Promise<Subscription | null> {
  if (!businessId) {
    throw new Error("businessId é obrigatório")
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from("ci_assinaturas")
    .select(`
      id,
      business_id,
      plano,
      status,
      trial_started_at,
      trial_ends_at,
      trial_converted_at,
      proximo_vencimento,
      tolerancia_dias,
      valor,
      payment_method,
      dia_vencimento,
      bloqueada_em,
      bloqueio_manual,
      metadata
    `)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeSubscription(data)
}