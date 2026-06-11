// src/lib/auth/require-active-subscription.ts

import { supabaseAdmin } from "@/lib/supabase/admin"
import { ApiError } from "@/lib/api/secure-api"

type RequireActiveSubscriptionOptions = {
  businessId: string
}

type AssinaturaRow = {
  id: string
  status: string | null
  trial_started_at: string | null
  trial_ends_at: string | null
}

const TRIAL_MAX_TRANSACTIONS = 30

export async function requireActiveSubscription({
  businessId,
}: RequireActiveSubscriptionOptions) {
  const { data: assinatura, error } = await supabaseAdmin
    .from("ci_assinaturas")
    .select(`
      id,
      status,
      trial_started_at,
      trial_ends_at
    `)
    .eq("business_id", businessId)
    .is("cancelada_em", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new ApiError(
      "Não foi possível validar a assinatura.",
      500,
      "subscription_validation_failed",
    )
  }

  if (!assinatura) {
    throw new ApiError(
      "Nenhuma assinatura encontrada para esta empresa.",
      403,
      "subscription_not_found",
    )
  }

  const subscription = assinatura as AssinaturaRow
  const status = String(subscription.status || "").toLowerCase()

  if (status === "active") {
    return {
      ok: true,
      mode: "active" as const,
      assinatura: subscription,
    }
  }

  if (status === "trialing" || status === "trial") {
    const trialEndsAt = subscription.trial_ends_at
      ? new Date(subscription.trial_ends_at)
      : null

    if (!trialEndsAt || Number.isNaN(trialEndsAt.getTime())) {
      throw new ApiError(
        "Trial inválido. Ative sua assinatura para continuar.",
        403,
        "trial_invalid",
      )
    }

    const now = new Date()

    if (trialEndsAt.getTime() <= now.getTime()) {
      throw new ApiError(
        "Seu período de teste terminou. Seus dados continuam visíveis, mas alterações estão bloqueadas até ativar sua assinatura.",
        403,
        "trial_expired",
      )
    }

    const { count, error: countError } = await supabaseAdmin
      .from("ci_transactions")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("business_id", businessId)
      .is("deleted_at", null)

    if (countError) {
      throw new ApiError(
        "Não foi possível validar o limite do trial.",
        500,
        "trial_limit_validation_failed",
      )
    }

    if ((count ?? 0) >= TRIAL_MAX_TRANSACTIONS) {
      throw new ApiError(
        "Você atingiu o limite de 30 lançamentos do teste gratuito. Seus dados continuam visíveis, mas alterações estão bloqueadas até ativar sua assinatura.",
        403,
        "trial_transaction_limit_reached",
      )
    }

    return {
      ok: true,
      mode: "trial" as const,
      assinatura: subscription,
    }
  }

  throw new ApiError(
    "Sua assinatura não está ativa. Seus dados continuam visíveis, mas alterações estão bloqueadas até regularizar o acesso.",
    403,
    "subscription_inactive",
  )
}