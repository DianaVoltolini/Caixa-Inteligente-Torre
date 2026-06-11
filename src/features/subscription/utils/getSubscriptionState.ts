// src/features/subscription/utils/getSubscriptionState.ts

export type SubscriptionStatus =
  | "trialing"
  | "awaiting_payment"
  | "active"
  | "grace_period"
  | "overdue"
  | "blocked"
  | "canceled"
  | string

export type ChargeStatus =
  | "draft"
  | "pending"
  | "paid"
  | "overdue"
  | "canceled"
  | "error"
  | string

export type SubscriptionUnifiedState =
  | "no_subscription"
  | "trial_active"
  | "awaiting_payment"
  | "active"
  | "grace_period"
  | "payment_overdue"
  | "charge_canceled"
  | "blocked_manual"
  | "blocked_automatic"
  | "canceled"

interface GetSubscriptionStateParams {
  hasSubscription?: boolean
  subscriptionStatus?: SubscriptionStatus | null
  chargeStatus?: ChargeStatus | null
  canceledChargeDetected?: boolean
  bloqueioManual?: boolean | null
  bloqueadaEm?: string | null
  canceladaEm?: string | null
  trialEndsAt?: string | null
  graceEndsAt?: string | null
  now?: Date
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function isPast(value?: string | null, now = new Date()): boolean {
  const date = parseDate(value)
  return !!date && date.getTime() <= now.getTime()
}

function isFuture(value?: string | null, now = new Date()): boolean {
  const date = parseDate(value)
  return !!date && date.getTime() > now.getTime()
}

export function getSubscriptionState({
  hasSubscription = true,
  subscriptionStatus,
  chargeStatus,
  canceledChargeDetected = false,
  bloqueioManual = false,
  bloqueadaEm = null,
  canceladaEm = null,
  trialEndsAt = null,
  graceEndsAt = null,
  now = new Date(),
}: GetSubscriptionStateParams): SubscriptionUnifiedState {
  const status = String(subscriptionStatus ?? "").trim().toLowerCase()
  const charge = String(chargeStatus ?? "").trim().toLowerCase()

  // ❌ sem assinatura
  if (!hasSubscription || !status) {
    return "no_subscription"
  }

  // 🔒 bloqueios
  if (bloqueioManual) {
    return "blocked_manual"
  }

  if (bloqueadaEm || status === "blocked") {
    return "blocked_automatic"
  }

  // ❌ cancelada
  if (canceladaEm || status === "canceled") {
    return "canceled"
  }

  // ✅ ativa
  if (status === "active" || charge === "paid") {
    return "active"
  }

  // 🧪 trial
  if (status === "trialing") {
    // 👉 acabou o trial → vira awaiting_payment direto
    if (isPast(trialEndsAt, now)) {
      return "awaiting_payment"
    }

    return "trial_active"
  }

  // 💰 cobrança vencida dentro da tolerância
  if (
    status === "grace_period" ||
    (charge === "overdue" && isFuture(graceEndsAt, now))
  ) {
    return "grace_period"
  }

  // ⚠️ vencido fora da tolerância
  if (status === "overdue" || charge === "overdue") {
    return "payment_overdue"
  }

  // ❌ cobrança cancelada
  if (
    canceledChargeDetected ||
    (charge === "canceled" && status !== "active" && status !== "canceled")
  ) {
    return "charge_canceled"
  }

  // ⏳ aguardando pagamento
  if (status === "awaiting_payment" || charge === "pending" || charge === "draft") {
    return "awaiting_payment"
  }

  return "no_subscription"
}