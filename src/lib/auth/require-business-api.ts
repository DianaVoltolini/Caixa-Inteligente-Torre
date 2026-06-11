// src/lib/auth/require-business-api.ts

import { NextResponse } from "next/server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export type BusinessApiAuthResult =
  | {
      authorized: true
      userId: string
      email: string | null
      businessId: string
      role: string
      response: null
    }
  | {
      authorized: false
      userId: null
      email: null
      businessId: null
      role: null
      response: NextResponse
    }

function unauthorizedResponse(
  status: number,
  error: string,
): BusinessApiAuthResult {
  return {
    authorized: false,
    userId: null,
    email: null,
    businessId: null,
    role: null,
    response: NextResponse.json(
      {
        success: false,
        error,
      },
      { status },
    ),
  }
}

export async function requireBusinessApiUser(
  businessId: string,
): Promise<BusinessApiAuthResult> {
  const supabase =
    await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return unauthorizedResponse(
      401,
      "Usuária não autenticada.",
    )
  }

  const normalizedBusinessId =
    businessId.trim()

  if (!normalizedBusinessId) {
    return unauthorizedResponse(
      400,
      "businessId é obrigatório.",
    )
  }

  const {
    data: business,
    error: businessError,
  } = await supabaseAdmin
    .from("ci_business")
    .select(`
      id,
      owner_user_id,
      is_deleted,
      access_blocked
    `)
    .eq("id", normalizedBusinessId)
    .maybeSingle()

  if (businessError) {
    return unauthorizedResponse(
      500,
      "Erro ao validar empresa.",
    )
  }

  if (!business) {
    return unauthorizedResponse(
      404,
      "Empresa não encontrada.",
    )
  }

  if (business.is_deleted) {
    return unauthorizedResponse(
      403,
      "Esta conta foi encerrada.",
    )
  }

  if (business.access_blocked) {
    return unauthorizedResponse(
      403,
      "O acesso desta empresa está bloqueado.",
    )
  }

  const {
    data: membership,
    error: membershipError,
  } = await supabaseAdmin
    .from("ci_user_businesses")
    .select(`
      business_id,
      role
    `)
    .eq("user_id", user.id)
    .eq(
      "business_id",
      normalizedBusinessId,
    )
    .maybeSingle()

  if (membershipError) {
    return unauthorizedResponse(
      500,
      "Erro ao validar vínculo da usuária com a empresa.",
    )
  }

  if (!membership) {
    const isOwner =
      business.owner_user_id ===
      user.id

    if (!isOwner) {
      return unauthorizedResponse(
        403,
        "Acesso não autorizado para esta empresa.",
      )
    }

    return {
      authorized: true,
      userId: user.id,
      email: user.email ?? null,
      businessId:
        normalizedBusinessId,
      role: "owner",
      response: null,
    }
  }

  return {
    authorized: true,
    userId: user.id,
    email: user.email ?? null,
    businessId:
      normalizedBusinessId,
    role: membership.role,
    response: null,
  }
}