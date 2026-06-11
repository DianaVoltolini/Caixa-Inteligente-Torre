// src/lib/auth/require-master.ts

import { redirect } from "next/navigation"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

type MasterUser = {
  id: string
  nome: string
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
    redirect("/torre-controle/login")
  }

  const email = user.email.toLowerCase().trim()

  const { data: masterUser, error: masterError } = await supabaseAdmin
    .from("ci_master_users")
    .select("id, nome, email, status")
    .eq("email", email)
    .eq("status", "ativo")
    .maybeSingle()

  if (masterError || !masterUser) {
    redirect("/torre-controle/login?error=unauthorized")
  }

  return masterUser
}