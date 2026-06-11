// src/lib/db/business.ts

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export type BusinessUpdateData = {
  name?: string
  tipo_pessoa?: string

  nome_responsavel?: string
  cpf?: string
  data_nascimento?: string | null
  whatsapp?: string
  email_financeiro?: string
  receber_informativos?: boolean

  cnpj?: string
  razao_social?: string
  nome_fantasia?: string
  inscricao_estadual?: string

  cep?: string
  rua?: string
  numero?: string
  complemento?: string
  bairro?: string
  municipio?: string
  uf?: string

  billing_cep?: string
  billing_rua?: string
  billing_numero?: string
  billing_complemento?: string
  billing_bairro?: string
  billing_municipio?: string
  billing_uf?: string

  endereco_origem?: string
  endereco_receita_diferente?: boolean
  onboarding_completed?: boolean
}

export async function getBusiness(businessId: string) {
  const { data, error } = await supabase
    .from("ci_business")
    .select("*")
    .eq("id", businessId)
    .single()

  if (error) {
    console.error("Erro ao buscar empresa:", error)
    throw error
  }

  return data
}

export async function getBusinessByOwnerUserId(ownerUserId: string) {
  const { data, error } = await supabase
    .from("ci_business")
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .maybeSingle()

  if (error) {
    console.error("Erro ao buscar empresa por owner_user_id:", error)
    throw error
  }

  return data
}

export async function updateBusiness(
  businessId: string,
  data: BusinessUpdateData,
) {
  const { error } = await supabase
    .from("ci_business")
    .update(data)
    .eq("id", businessId)

  if (error) {
    console.error("Erro ao atualizar empresa:", error)
    throw error
  }

  return { success: true }
}