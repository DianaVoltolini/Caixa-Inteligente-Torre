// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\lib\auth\require-master.ts

import { redirect } from "next/navigation"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"

type MasterUser = {
  id: string
  nome: string | null
  email: string
  status: string
}

export async function requireMasterUser(): Promise<MasterUser> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.email) {
    redirect("/login")
  }

  const email = user.email.toLowerCase().trim()

  const { data: masterUser, error: masterError } = await supabaseAdmin
    .from("ci_master_users")
    .select("id, nome, email, status")
    .eq("email", email)
    .eq("status", "ativo")
    .maybeSingle()

  if (masterError || !masterUser) {
    redirect("/login?error=unauthorized")
  }

  return {
    id: masterUser.id,
    nome: masterUser.nome,
    email: masterUser.email,
    status: masterUser.status,
  }
}