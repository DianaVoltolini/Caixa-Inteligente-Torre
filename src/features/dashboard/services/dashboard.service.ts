// src/features/dashboard/services/dashboard.service.ts

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

/* =========================
   TRANSACTIONS
========================= */

export async function fetchDashboardTransactions(
  businessId: string,
  startMonth: string,
) {
  const { data, error } = await supabase
    .from("ci_transactions")
    .select("amount, type")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .gte("transaction_date", startMonth)
    .order("transaction_date", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

/* =========================
   GOAL
========================= */

export async function fetchDashboardGoal(businessId: string) {
  const { data, error } = await supabase
    .from("ci_goals")
    .select("target_amount")
    .eq("business_id", businessId)
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/* =========================
   SAVE GOAL
========================= */

export async function saveDashboardGoal(
  businessId: string,
  goalCents: number,
) {
  const { error } = await supabase
    .from("ci_goals")
    .upsert(
      {
        business_id: businessId,
        target_amount: goalCents / 100,
      },
      { onConflict: "business_id" },
    )

  if (error) {
    throw new Error(error.message)
  }
}