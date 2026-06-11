// src/lib/db/contacts.ts

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export async function getContacts(businessId: string) {
  const { data, error } = await supabase
    .from("ci_contacts")
    .select("id,name")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .order("name")

  if (error) {
    console.error("Erro ao buscar contatos", error)
    throw error
  }

  return data ?? []
}

export async function deleteContact(id: string, businessId: string) {
  const { error } = await supabase
    .from("ci_contacts")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("business_id", businessId)
    .is("deleted_at", null)

  if (error) {
    console.error("Erro ao excluir contato", error)
    throw error
  }
}