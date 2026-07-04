// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\api\master\auth\login\route.ts

import { NextRequest, NextResponse } from "next/server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"

type LoginBody = {
  email?: string
  password?: string
}

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as LoginBody

    const email = normalizeEmail(body.email)
    const password = String(body.password ?? "")

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          authorized: false,
          error: "Informe e-mail e senha.",
        },
        { status: 400 },
      )
    }

    const supabase = await createServerSupabaseClient()

    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (loginError || !loginData.user?.email) {
      return NextResponse.json(
        {
          success: false,
          authorized: false,
          error: "E-mail ou senha inválidos.",
        },
        { status: 401 },
      )
    }

    const authenticatedEmail = normalizeEmail(loginData.user.email)

    const { data: masterUser, error: masterError } = await supabaseAdmin
      .from("ci_master_users")
      .select("id, nome, email, status")
      .eq("email", authenticatedEmail)
      .eq("status", "ativo")
      .maybeSingle()

    if (masterError || !masterUser) {
      await supabase.auth.signOut()

      return NextResponse.json(
        {
          success: false,
          authorized: false,
          error: "Este login não possui acesso autorizado à Torre de Controle.",
        },
        { status: 403 },
      )
    }

    return NextResponse.json({
      success: true,
      authorized: true,
      masterUser: {
        id: masterUser.id,
        nome: masterUser.nome,
        email: masterUser.email,
        status: masterUser.status,
      },
    })
  } catch (error) {
    console.error("[torre-login] erro ao autenticar master:", error)

    return NextResponse.json(
      {
        success: false,
        authorized: false,
        error: "Não foi possível acessar a Torre agora.",
      },
      { status: 500 },
    )
  }
}