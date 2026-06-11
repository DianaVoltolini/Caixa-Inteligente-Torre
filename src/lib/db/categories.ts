// src/lib/db/categories.ts

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export async function getCategories(businessId: string) {
  const { data, error } = await supabase
    .from("ci_categories")
    .select("id,name")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .order("name")

  if (error) {
    console.error("Erro ao buscar categorias", error)
    throw error
  }

  return data ?? []
}