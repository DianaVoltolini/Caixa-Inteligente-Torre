// src/lib/db/subscription.ts

import { createClient } from "@/lib/supabase/client"

export async function getSubscription(businessId: string) {
  if (!businessId) {
    throw new Error("businessId é obrigatório")
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from("ci_assinaturas")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error

  return data || null
}