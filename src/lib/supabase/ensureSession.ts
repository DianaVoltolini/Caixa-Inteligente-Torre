// src/lib/supabase/ensureSession.ts

import { createClient } from "@/lib/supabase/client"

export async function ensureSession() {

  const supabase = createClient()

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    console.warn("Sessão inválida. Limpando...")

    await supabase.auth.signOut()
    return null
  }

  return data.session
}