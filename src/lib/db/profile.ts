// src/lib/db/profile.ts

import { createClient } from "@/lib/supabase/client"

export async function updateProfileName(full_name: string) {

  const supabase = createClient()

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError) throw userError

  if (!user) {
    throw new Error("Usuário não autenticado")
  }

  const { error } = await supabase
    .from("ci_profiles")
    .update({
      full_name
    })
    .eq("id", user.id)

  if (error) {
    console.error("Erro ao atualizar nome:", error.message)
    throw error
  }

}