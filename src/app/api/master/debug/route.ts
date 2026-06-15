// src/app/api/master/debug/route.ts

import { NextRequest, NextResponse } from "next/server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    const authEmail = user?.email?.toLowerCase().trim() ?? null

    const { data: masters, error: mastersError } = await supabaseAdmin
      .from("ci_master_users")
      .select("id, nome, email, status")
      .order("created_at", { ascending: false })

    const matchedMaster = authEmail
      ? masters?.find(
          (master) =>
            String(master.email ?? "").toLowerCase().trim() === authEmail &&
            String(master.status ?? "").toLowerCase().trim() === "ativo",
        )
      : null

    return NextResponse.json({
      success: true,
      auth: {
        hasUser: !!user,
        email: authEmail,
        userError: userError?.message ?? null,
      },
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
      },
      masterUsers: {
        error: mastersError?.message ?? null,
        total: masters?.length ?? 0,
        items: masters ?? [],
        matched: matchedMaster ?? null,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido.",
      },
      { status: 500 },
    )
  }
}