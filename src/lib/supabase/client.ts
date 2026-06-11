// src/lib/supabase/client.ts

"use client"

import { createBrowserClient } from "@supabase/ssr"

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {

  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  supabaseClient = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )

  /* ===============================
     TRATAMENTO DE SESSÃO INVÁLIDA
  =============================== */

  supabaseClient.auth.onAuthStateChange((event) => {

    if (event === "TOKEN_REFRESH_FAILED") {

      console.warn(
        "Supabase sessão inválida. Limpando sessão e redirecionando para login."
      )

      supabaseClient?.auth.signOut()

      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }

    }

  })

  return supabaseClient

}