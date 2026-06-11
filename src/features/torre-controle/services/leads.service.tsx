// src/features/torre-controle/services/leads.service.ts

import { createClient } from "@/lib/supabase/client"

export type LeadStatus =
  | "novo"
  | "contatado"
  | "no_grupo"
  | "engajado"
  | "nao_respondeu"
  | string

export type LeadRow = {
  id: string
  nome: string
  email: string
  whatsapp: string
  dificuldade: string | null
  origem: string | null
  status: LeadStatus
  created_at: string
}

export type LeadsListFilters = {
  search?: string
  status?: string
}

function normalizeSearch(value: string) {
  return value.trim()
}

export async function getLeadsList(
  filters: LeadsListFilters = {}
): Promise<LeadRow[]> {
  const supabase = createClient()

  const search = normalizeSearch(filters.search || "")
  const status = String(filters.status || "").trim()

  let query = supabase
    .from("ci_leads_desafio")
    .select(
      "id, nome, email, whatsapp, dificuldade, origem, status, created_at"
    )
    .order("created_at", { ascending: false })

  if (status && status !== "todos") {
    query = query.eq("status", status)
  }

  if (search) {
    query = query.or(
      `nome.ilike.%${search}%,email.ilike.%${search}%,whatsapp.ilike.%${search}%`
    )
  }

  const { data, error } = await query

  if (error) {
    console.error("Erro ao buscar leads:", error)
    throw new Error("Não consegui carregar a lista de leads.")
  }

  return (data as LeadRow[] | null) ?? []
}

/**
 * Atualiza o status de um lead
 */
export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from("ci_leads_desafio")
    .update({ status })
    .eq("id", leadId)

  if (error) {
    console.error("Erro ao atualizar status do lead:", error)
    return {
      success: false,
      error: "Não consegui atualizar o status do lead.",
    }
  }

  return { success: true }
}