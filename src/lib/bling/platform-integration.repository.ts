// src/lib/bling/platform-integration.repository.ts

import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { BlingPlatformIntegration, BlingTokenPayload } from "./types"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const TABLE_NAME = "ci_platform_integrations"
const PROVIDER = "bling"

function getAdminClient(): SupabaseClient {
  if (!SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurada.")
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.")
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function calculateExpiresAt(token: BlingTokenPayload): string | null {
  if (typeof token.expires_in !== "number") {
    return null
  }

  return new Date(Date.now() + token.expires_in * 1000).toISOString()
}

export async function getBlingPlatformIntegration(): Promise<BlingPlatformIntegration | null> {
  const supabase = getAdminClient()

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("provider", PROVIDER)
    .maybeSingle()

  if (error) {
    throw new Error(`Erro ao buscar integração central do Bling: ${error.message}`)
  }

  return data as BlingPlatformIntegration | null
}

export async function upsertBlingPlatformIntegrationFromToken(
  token: BlingTokenPayload,
  metadata: Record<string, unknown> = {},
): Promise<BlingPlatformIntegration> {
  const supabase = getAdminClient()

  if (!token.access_token) {
    throw new Error("Access token do Bling não retornado.")
  }

  if (!token.refresh_token) {
    throw new Error("Refresh token do Bling não retornado.")
  }

  const expiresAt = calculateExpiresAt(token)
  const now = new Date().toISOString()

  const payload = {
    provider: PROVIDER,
    status: "active",
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    token_type: token.token_type ?? "Bearer",
    expires_at: expiresAt,
    scope: token.scope ?? null,
    last_auth_at: now,
    last_refresh_at: now,
    metadata,
    updated_at: now,
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .upsert(payload, { onConflict: "provider" })
    .select("*")
    .single()

  if (error) {
    throw new Error(`Erro ao salvar integração central do Bling: ${error.message}`)
  }

  return data as BlingPlatformIntegration
}

export async function updateBlingAccessToken(
  token: BlingTokenPayload,
): Promise<BlingPlatformIntegration> {
  const current = await getBlingPlatformIntegration()

  if (!current) {
    throw new Error("Integração central do Bling não encontrada.")
  }

  if (!token.access_token) {
    throw new Error("Access token do Bling não retornado na renovação.")
  }

  const supabase = getAdminClient()

  const expiresAt = calculateExpiresAt(token) ?? current.expires_at
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      access_token: token.access_token,
      refresh_token: token.refresh_token ?? current.refresh_token,
      token_type: token.token_type ?? current.token_type ?? "Bearer",
      expires_at: expiresAt,
      scope: token.scope ?? current.scope,
      status: "active",
      last_refresh_at: now,
      updated_at: now,
    })
    .eq("provider", PROVIDER)
    .select("*")
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar token central do Bling: ${error.message}`)
  }

  return data as BlingPlatformIntegration
}