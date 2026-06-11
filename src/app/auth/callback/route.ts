// src/app/auth/callback/route.ts

import { NextRequest, NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

const TRIAL_DAYS = 7
const FALLBACK_APP_URL = "https://app.meucaixainteligente.com.br"

function getAppUrl() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    FALLBACK_APP_URL

  return appUrl.replace(/\/$/, "")
}

function buildRedirect(pathname: string, message?: string) {
  const url = new URL(pathname, getAppUrl())

  if (message) {
    url.searchParams.set("message", message)
  }

  return url
}

function getOtpType(type: string | null): EmailOtpType {
  if (
    type === "signup" ||
    type === "magiclink" ||
    type === "recovery" ||
    type === "invite" ||
    type === "email" ||
    type === "email_change"
  ) {
    return type
  }

  return "signup"
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash")
  const type = getOtpType(request.nextUrl.searchParams.get("type"))

  if (!tokenHash) {
    return NextResponse.redirect(
      buildRedirect("/login", "Link de confirmação inválido."),
    )
  }

  const supabase = await createServerSupabaseClient()

  const {
    data: verifyData,
    error: verifyError,
  } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  })

  if (verifyError || !verifyData.user) {
    return NextResponse.redirect(
      buildRedirect("/login", "Não foi possível confirmar seu e-mail."),
    )
  }

  const user = verifyData.user

  const { data: existingMembership, error: membershipValidationError } =
    await supabaseAdmin
      .from("ci_user_businesses")
      .select("business_id")
      .eq("user_id", user.id)
      .maybeSingle()

  if (membershipValidationError) {
    return NextResponse.redirect(
      buildRedirect("/login", "Não foi possível validar sua conta."),
    )
  }

  if (existingMembership?.business_id) {
    return NextResponse.redirect(buildRedirect("/dashboard"))
  }

  const rawBusinessName = user.user_metadata?.business_name

  const businessName =
    typeof rawBusinessName === "string" && rawBusinessName.trim()
      ? rawBusinessName.trim()
      : "Minha empresa"

  const now = new Date()
  const trialEndsAt = new Date(now)

  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS)

  const { data: business, error: businessError } = await supabaseAdmin
    .from("ci_business")
    .insert({
      owner_user_id: user.id,
      name: businessName,
      access_blocked: false,
      is_deleted: false,
    })
    .select("id")
    .single()

  if (businessError || !business) {
    return NextResponse.redirect(
      buildRedirect("/login", "Não foi possível criar sua empresa."),
    )
  }

  const { error: membershipError } = await supabaseAdmin
    .from("ci_user_businesses")
    .insert({
      user_id: user.id,
      business_id: business.id,
      role: "owner",
    })

  if (membershipError) {
    await supabaseAdmin
      .from("ci_business")
      .update({
        is_deleted: true,
        access_blocked: true,
      })
      .eq("id", business.id)

    return NextResponse.redirect(
      buildRedirect("/login", "Não foi possível vincular sua empresa."),
    )
  }

  const { error: subscriptionError } = await supabaseAdmin
    .from("ci_assinaturas")
    .insert({
      business_id: business.id,
      status: "trialing",
      plano: "Plano Lucro Real",
      valor: 29.9,
      trial_started_at: now.toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
      tolerancia_dias: 3,
    })

  if (subscriptionError) {
    await supabaseAdmin
      .from("ci_user_businesses")
      .delete()
      .eq("user_id", user.id)
      .eq("business_id", business.id)

    await supabaseAdmin
      .from("ci_business")
      .update({
        is_deleted: true,
        access_blocked: true,
      })
      .eq("id", business.id)

    return NextResponse.redirect(
      buildRedirect("/login", "Não foi possível criar seu período de teste."),
    )
  }

  return NextResponse.redirect(buildRedirect("/dashboard"))
}