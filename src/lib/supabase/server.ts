// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\lib\supabase\server.ts

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Em Server Components sem permissão de escrita, ignoramos.
            // Em Route Handlers, os cookies são gravados normalmente.
          }
        },
      },
    },
  )
}