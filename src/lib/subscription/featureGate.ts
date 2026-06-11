// src/lib/subscription/featureGate.ts

import { Subscription } from "./getSubscription"

export type FeatureAccess = {
  canCreateTransaction: boolean
  canEditTransaction: boolean
  canDeleteTransaction: boolean
  trialExpired: boolean
  graceExpired: boolean
  daysRemaining: number
  remainingTransactions: number
  canAccessSystem: boolean
}

type SubscriptionLike = Subscription & {
  max_transactions?: number | null
  grace_ends_at?: string | null
  bloqueio_manual?: boolean
  bloqueada_em?: string | null
}

function normalizeStatus(status?: string | null) {
  return String(status ?? "").trim().toLowerCase()
}

export function evaluateFeatures(
  subscription: SubscriptionLike | null,
  transactionCount: number,
): FeatureAccess {
  if (!subscription) {
    return {
      canCreateTransaction: false,
      canEditTransaction: false,
      canDeleteTransaction: false,
      trialExpired: true,
      graceExpired: true,
      daysRemaining: 0,
      remainingTransactions: 0,
      canAccessSystem: false,
    }
  }

  const now = new Date()

  const status = normalizeStatus(subscription.status)

  const trialEnd = subscription.trial_ends_at
    ? new Date(subscription.trial_ends_at)
    : null

  const graceEnd = subscription.grace_ends_at
    ? new Date(subscription.grace_ends_at)
    : null

  let trialExpiredByDays = false
  let graceExpired = false
  let daysRemaining = 0

  if (trialEnd) {
    const diff = trialEnd.getTime() - now.getTime()

    daysRemaining = Math.max(
      0,
      Math.floor(diff / (1000 * 60 * 60 * 24)),
    )

    trialExpiredByDays = diff <= 0
  }

  if (graceEnd) {
    graceExpired = graceEnd.getTime() <= now.getTime()
  }

  const maxTransactions = subscription.max_transactions ?? 30

  const remainingTransactions = Math.max(
    0,
    maxTransactions - transactionCount,
  )

  const reachedLimit = transactionCount >= maxTransactions

  const isTrialStatus =
    status === "trialing" ||
    status === "trial"

  const isAwaitingPayment =
    status === "awaiting_payment"

  const hasTrialWindow =
    Boolean(subscription.trial_started_at) &&
    Boolean(subscription.trial_ends_at)

  const trialExpired =
    isAwaitingPayment ||
    (
      isTrialStatus &&
      (
        trialExpiredByDays ||
        reachedLimit
      )
    )

  const isTrialWindowActive =
    isTrialStatus &&
    hasTrialWindow &&
    !trialExpiredByDays &&
    !reachedLimit

  const isPaidActive =
    status === "active" ||
    status === "paid" ||
    status === "current"

  const isViewOnlySubscription =
    status === "awaiting_payment" ||
    status === "grace_period" ||
    status === "overdue" ||
    status === "paused" ||
    status === "canceled"

  const isBlockedManually =
    Boolean(subscription.bloqueio_manual) ||
    Boolean(subscription.bloqueada_em) ||
    status === "blocked"

  const canCreateTransaction =
    !isBlockedManually &&
    (
      isTrialWindowActive ||
      isPaidActive
    )

  const canEditTransaction =
    !isBlockedManually &&
    (
      isTrialWindowActive ||
      isPaidActive
    )

  const canDeleteTransaction =
    !isBlockedManually &&
    (
      isTrialWindowActive ||
      isPaidActive
    )

  const canAccessSystem =
    !isBlockedManually &&
    (
      isTrialWindowActive ||
      isPaidActive ||
      isViewOnlySubscription
    )

  return {
    canCreateTransaction,
    canEditTransaction,
    canDeleteTransaction,
    trialExpired,
    graceExpired,
    daysRemaining,
    remainingTransactions,
    canAccessSystem,
  }
}