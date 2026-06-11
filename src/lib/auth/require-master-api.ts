// src/lib/auth/require-master-api.ts

import { NextRequest, NextResponse } from "next/server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

import { createSecurityLog } from "@/lib/api/security-log"

export type MasterApiUser = {
  id: string
  nome: string | null
  email: string
  status: string
}

type MasterApiAuthSuccess = {
  authorized: true
  masterUser: MasterApiUser
  response: null
}

type MasterApiAuthFailure = {
  authorized: false
  masterUser: null
  response: NextResponse
}

export type MasterApiAuthResult =
  | MasterApiAuthSuccess
  | MasterApiAuthFailure

async function safeSecurityLog(
  request: NextRequest | undefined,
  input: {
    eventType: string
    severity: "info" | "warning" | "critical"
    userId?: string | null
    email?: string | null
    message: string
  },
) {
  if (!request) return

  await createSecurityLog({
    request,
    eventType: input.eventType,
    severity: input.severity,
    userId: input.userId ?? null,
    email: input.email ?? null,
    message: input.message,
  })
}

export async function requireMasterApiUser(
  request?: NextRequest,
): Promise<MasterApiAuthResult> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.email) {
    await safeSecurityLog(request, {
      eventType: "master_access_unauthenticated",
      severity: "warning",
      message: "Tentativa de acesso master sem autenticação.",
    })

    return {
      authorized: false,
      masterUser: null,
      response: NextResponse.json(
        {
          ok: false,
          authorized: false,
          message: "Usuária não autenticada.",
        },
        { status: 401 },
      ),
    }
  }

  const email = user.email.toLowerCase().trim()

  const { data: masterUser, error: masterError } =
    await supabaseAdmin
      .from("ci_master_users")
      .select("id, nome, email, status")
      .eq("email", email)
      .eq("status", "ativo")
      .maybeSingle()

  if (masterError || !masterUser) {
    await safeSecurityLog(request, {
      eventType: "master_access_denied",
      severity: "critical",
      email,
      message: "Tentativa de acesso não autorizado à Torre de Controle.",
    })

    return {
      authorized: false,
      masterUser: null,
      response: NextResponse.json(
        {
          ok: false,
          authorized: false,
          message: "Acesso não autorizado à Torre de Controle.",
        },
        { status: 403 },
      ),
    }
  }

  await safeSecurityLog(request, {
    eventType: "master_access_granted",
    severity: "info",
    userId: masterUser.id,
    email,
    message: "Acesso autorizado à Torre de Controle.",
  })

  return {
    authorized: true,
    masterUser,
    response: null,
  }
}