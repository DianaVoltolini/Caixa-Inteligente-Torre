// src/services/supabase/crudService.ts

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

const SOFT_DELETE_TABLES = new Set([
  "ci_contacts",
  "ci_categories",
  "ci_services",
  "ci_transactions",
  "ci_transaction_services",
])

// ===============================
// FETCH ALL
// ===============================

export async function fetchAll<T>(
  table: string,
  businessId: string,
  orderColumn: string = "created_at",
): Promise<T[]> {
  let query = supabase
    .from(table)
    .select("*")
    .eq("business_id", businessId)
    .order(orderColumn, { ascending: false })

  if (SOFT_DELETE_TABLES.has(table)) {
    query = query.is("deleted_at", null)
  }

  const { data, error } = await query

  if (error) {
    console.error(`Erro ao buscar dados da tabela ${table}`)

    console.error({
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })

    throw error
  }

  return (data as T[]) ?? []
}

// ===============================
// CREATE ITEM
// ===============================

export async function createItem(
  table: string,
  payload: Record<string, any>,
): Promise<void> {
  const safePayload = SOFT_DELETE_TABLES.has(table)
    ? {
        ...payload,
        deleted_at: null,
      }
    : payload

  const { error } = await supabase
    .from(table)
    .insert(safePayload)

  if (error) {
    console.error(`Erro ao criar item na tabela ${table}`)

    console.error({
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })

    throw error
  }
}

// ===============================
// UPDATE ITEM
// ===============================

export async function updateItem(
  table: string,
  id: string,
  payload: Record<string, any>,
): Promise<void> {
  let query = supabase
    .from(table)
    .update(payload)
    .eq("id", id)

  if (SOFT_DELETE_TABLES.has(table)) {
    query = query.is("deleted_at", null)
  }

  const { error } = await query

  if (error) {
    console.error(`Erro ao atualizar item na tabela ${table}`)

    console.error({
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })

    throw error
  }
}

// ===============================
// DELETE ITEM
// ===============================

export async function deleteItem(
  table: string,
  id: string,
): Promise<void> {
  let query

  if (SOFT_DELETE_TABLES.has(table)) {
    query = supabase
      .from(table)
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .is("deleted_at", null)
  } else {
    query = supabase
      .from(table)
      .delete()
      .eq("id", id)
  }

  const { error } = await query

  if (error) {
    console.error(`Erro ao deletar item na tabela ${table}`)

    console.error({
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })

    throw error
  }
}