// src/lib/db/services.ts

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export async function getServices(businessId: string) {
  const { data, error } = await supabase
    .from("ci_services")
    .select("id,name,price")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .order("name")

  if (error) {
    console.error("Erro ao buscar serviços", error)
    throw error
  }

  return data ?? []
}