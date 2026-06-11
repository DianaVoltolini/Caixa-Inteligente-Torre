// src/lib/db/dashboard.ts

import { createClient } from "@/lib/supabase/client"

export async function getDashboardData(
  businessId: string,
) {
  if (!businessId) {
    throw new Error(
      "businessId é obrigatório",
    )
  }

  const supabase =
    createClient()

  const startOfMonth =
    new Date()

  startOfMonth.setDate(1)

  startOfMonth.setHours(
    0,
    0,
    0,
    0,
  )

  const {
    data: transactions,
    error: txError,
  } = await supabase
    .from("ci_transactions")
    .select("amount, type")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .gte(
      "transaction_date",
      startOfMonth.toISOString(),
    )

  if (txError) {
    throw txError
  }

  const {
    data: goalData,
    error: goalError,
  } = await supabase
    .from("ci_goals")
    .select("target_amount")
    .eq("business_id", businessId)
    .maybeSingle()

  if (goalError) {
    throw goalError
  }

  return {
    transactions:
      transactions || [],
    goal:
      goalData?.target_amount || 0,
  }
}