// src/features/cadastros/services/cadastros.service.ts

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

/* =========================
   HELPERS
========================= */

function nowIso() {
  return new Date().toISOString()
}

/* =========================
   CATEGORIAS
========================= */

export async function getCategorias(businessId: string) {
  const { data, error } = await supabase
    .from("ci_categories")
    .select("*")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .order("name")

  if (error) {
    console.error("Erro getCategorias:", error)
    throw error
  }

  return data ?? []
}

export async function createCategoria(payload: any) {
  const { data, error } = await supabase
    .from("ci_categories")
    .insert({
      ...payload,
      deleted_at: null
    })
    .select()
    .single()

  if (error) {
    console.error("Erro createCategoria:", error)
    throw error
  }

  return { data }
}

export async function updateCategoria(
  id: string,
  payload: any,
  businessId?: string
) {
  let query = supabase
    .from("ci_categories")
    .update({
      name: payload.name,
      is_fixed: payload.is_fixed
    })
    .eq("id", id)
    .is("deleted_at", null)

  if (businessId) {
    query = query.eq("business_id", businessId)
  }

  const { error } = await query

  if (error) {
    console.error("Erro updateCategoria:", error)
    throw error
  }

  return { success: true }
}

export async function deleteCategoria(id: string, businessId?: string) {
  try {
    let checkQuery = supabase
      .from("ci_transactions")
      .select("id")
      .eq("category_id", id)
      .is("deleted_at", null)
      .limit(1)

    if (businessId) {
      checkQuery = checkQuery.eq("business_id", businessId)
    }

    const { data: vinculados, error: checkError } = await checkQuery

    if (checkError) {
      console.error("Erro ao verificar vínculo da categoria:", checkError)

      return {
        success: false,
        error: "Não conseguimos verificar se esse cadastro está em uso agora."
      }
    }

    if (vinculados && vinculados.length > 0) {
      return {
        success: false,
        error:
          "Este cadastro não pode ser excluído porque já existe um lançamento vinculado."
      }
    }

    let deleteQuery = supabase
      .from("ci_categories")
      .update({
        deleted_at: nowIso()
      })
      .eq("id", id)
      .is("deleted_at", null)

    if (businessId) {
      deleteQuery = deleteQuery.eq("business_id", businessId)
    }

    const { error } = await deleteQuery

    if (error) {
      console.error("Erro deleteCategoria:", error)

      return {
        success: false,
        error: "Não foi possível excluir esse cadastro agora."
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Erro deleteCategoria:", error)

    return {
      success: false,
      error: error?.message || "Não foi possível excluir esse cadastro agora."
    }
  }
}

/* =========================
   CONTATOS
========================= */

export async function getClientes(businessId: string) {
  const { data, error } = await supabase
    .from("ci_contacts")
    .select("*")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .order("name")

  if (error) {
    console.error("Erro getClientes:", error)
    throw error
  }

  return data ?? []
}

export async function createContato(payload: any) {
  const { data, error } = await supabase
    .from("ci_contacts")
    .insert({
      ...payload,
      deleted_at: null
    })
    .select()
    .single()

  if (error) {
    console.error("Erro createContato:", error)
    throw error
  }

  return { data }
}

export async function updateContato(
  id: string,
  businessId: string,
  payload: any
) {
  const { error } = await supabase
    .from("ci_contacts")
    .update({
      name: payload.name,
      phone: payload.phone || null,
      email: payload.email || null,
      type: payload.type
    })
    .eq("id", id)
    .eq("business_id", businessId)
    .is("deleted_at", null)

  if (error) {
    console.error("Erro updateContato:", error)
    throw error
  }

  return { success: true }
}

export async function deleteContato(id: string, businessId: string) {
  try {
    const { data: vinculados, error: checkError } = await supabase
      .from("ci_transactions")
      .select("id")
      .eq("business_id", businessId)
      .eq("contact_id", id)
      .is("deleted_at", null)
      .limit(1)

    if (checkError) {
      console.error("Erro ao verificar vínculo:", checkError)

      return {
        success: false,
        error: "Não conseguimos verificar se esse cadastro está em uso agora."
      }
    }

    if (vinculados && vinculados.length > 0) {
      return {
        success: false,
        error:
          "Este cadastro não pode ser excluído porque já existe um lançamento vinculado."
      }
    }

    const { error } = await supabase
      .from("ci_contacts")
      .update({
        deleted_at: nowIso()
      })
      .eq("id", id)
      .eq("business_id", businessId)
      .is("deleted_at", null)

    if (error) {
      console.error("Erro deleteContato:", error)

      return {
        success: false,
        error: "Não foi possível excluir esse cadastro agora."
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Erro deleteContato:", error)

    return {
      success: false,
      error: error?.message || "Não foi possível excluir esse cadastro agora."
    }
  }
}

/* =========================
   SERVIÇOS
========================= */

export async function getServicos(businessId: string) {
  const { data, error } = await supabase
    .from("ci_services")
    .select("*")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .order("name")

  if (error) {
    console.error("Erro getServicos:", error)
    throw error
  }

  return data ?? []
}

export async function createServico(payload: any) {
  const { data, error } = await supabase
    .from("ci_services")
    .insert({
      ...payload,
      deleted_at: null
    })
    .select()
    .single()

  if (error) {
    console.error("Erro createServico:", error)
    throw error
  }

  return { data }
}

export async function updateServico(
  id: string,
  payload: any,
  businessId?: string
) {
  let query = supabase
    .from("ci_services")
    .update({
      name: payload.name,
      price: payload.price
    })
    .eq("id", id)
    .is("deleted_at", null)

  if (businessId) {
    query = query.eq("business_id", businessId)
  }

  const { error } = await query

  if (error) {
    console.error("Erro updateServico:", error)
    throw error
  }

  return { success: true }
}

export async function deleteServico(id: string, businessId?: string) {
  try {
    let checkQuery = supabase
      .from("ci_transaction_services")
      .select("transaction_id")
      .eq("service_id", id)
      .is("deleted_at", null)
      .limit(1)

    if (businessId) {
      checkQuery = checkQuery.eq("business_id", businessId)
    }

    const { data: vinculados, error: checkError } = await checkQuery

    if (checkError) {
      console.error("Erro ao verificar vínculo do serviço:", checkError)

      return {
        success: false,
        error: "Não conseguimos verificar se esse cadastro está em uso agora."
      }
    }

    if (vinculados && vinculados.length > 0) {
      return {
        success: false,
        error:
          "Este cadastro não pode ser excluído porque já existe um lançamento vinculado."
      }
    }

    let deleteQuery = supabase
      .from("ci_services")
      .update({
        deleted_at: nowIso()
      })
      .eq("id", id)
      .is("deleted_at", null)

    if (businessId) {
      deleteQuery = deleteQuery.eq("business_id", businessId)
    }

    const { error } = await deleteQuery

    if (error) {
      console.error("Erro deleteServico:", error)

      return {
        success: false,
        error: "Não foi possível excluir esse cadastro agora."
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Erro deleteServico:", error)

    return {
      success: false,
      error: error?.message || "Não foi possível excluir esse cadastro agora."
    }
  }
}