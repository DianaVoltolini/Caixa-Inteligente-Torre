// src/lib/auth/require-business-owner.ts

import { cookies } from "next/headers"

import { createServerClient } from "@supabase/ssr"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { ApiError } from "@/lib/api/secure-api"

export async function requireBusinessOwner(businessId: string) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },

        setAll() {
          // Server route: cookies are read-only here for validation.
        },
      },
    },
  )

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new ApiError(
      "Usuário não autenticado.",
      401,
      "unauthorized",
    )
  }

  const { data: business, error } = await supabaseAdmin
    .from("ci_business")
    .select("id, owner_user_id, is_deleted, access_blocked")
    .eq("id", businessId)
    .single()

  if (error || !business) {
    throw new ApiError(
      "Empresa não encontrada.",
      404,
      "business_not_found",
    )
  }

  if (business.owner_user_id !== user.id) {
    throw new ApiError(
      "Você não tem permissão para acessar esta empresa.",
      403,
      "forbidden_business",
    )
  }

  if (business.is_deleted) {
    throw new ApiError(
      "Esta empresa foi encerrada.",
      403,
      "business_deleted",
    )
  }

  if (business.access_blocked) {
    throw new ApiError(
      "O acesso desta empresa está bloqueado.",
      403,
      "business_blocked",
    )
  }

  return {
    user,
    business,
  }
}