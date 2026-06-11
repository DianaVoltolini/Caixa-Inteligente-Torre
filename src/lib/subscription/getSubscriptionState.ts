// src/features/subscription/utils/getSubscriptionState.ts

type SubscriptionStatus =
  | "trialing"
  | "active"
  | "pending"
  | "canceled"
  | string

type ChargeStatus =
  | "pending"
  | "paid"
  | "overdue"
  | "canceled"
  | string

interface GetSubscriptionStateParams {
  subscriptionStatus: SubscriptionStatus | null | undefined
  chargeStatus?: ChargeStatus | null
}

export type SubscriptionUnifiedState =
  | "trial"
  | "pending"
  | "active"
  | "overdue"
  | "canceled"

export function getSubscriptionState({
  subscriptionStatus,
  chargeStatus,
}: GetSubscriptionStateParams): SubscriptionUnifiedState {
  const status = String(subscriptionStatus ?? "").toLowerCase()
  const charge = String(chargeStatus ?? "").toLowerCase()

  // 🔥 prioridade 1: cobrança
  if (charge === "overdue") return "overdue"
  if (charge === "pending") return "pending"
  if (charge === "canceled") return "canceled"

  // 🔥 prioridade 2: assinatura
  if (status === "active") return "active"

  // default
  return "trial"
}