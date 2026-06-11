// src/services/supabase/queryHelpers.ts

type SupabaseError = {
  message?: string
  code?: string
  details?: string
  hint?: string
}

export function logSupabaseError(error: SupabaseError) {

  console.error("Supabase error:", {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint
  })

}

export function normalizeSupabaseArray<T>(data: T[] | null) {

  if (!Array.isArray(data)) return []
  return data

}