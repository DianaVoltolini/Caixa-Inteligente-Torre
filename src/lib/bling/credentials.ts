// src/lib/bling/credentials.ts

import "server-only"

import { supabaseAdmin } from "@/lib/supabase/admin"
import type { BlingTokenResponse } from "@/lib/bling/types"

export type BlingCredentialRow = {
  id: string
  business_id: string
  access_token: string | null
  refresh_token: string | null
  token_type: string | null
  expires_in: number | null
  expires_at: string | null
  scope: string | null
  bling_user_id: string | null
  bling_tenant_id: string | null
  status: "disconnected" | "connected" | "error"
  last_error: string | null
  created_at: string
  updated_at: string
}

function calculateExpiresAt(expiresIn?: number): string | null {
  if (!expiresIn || expiresIn <= 0) return null

  const date = new Date()
  date.setSeconds(date.getSeconds() + expiresIn)

  return date.toISOString()
}

export async function getBlingCredentialsByBusinessId(
  businessId: string
): Promise<BlingCredentialRow | null> {
  const { data, error } = await supabaseAdmin
    .from("ci_integracoes_bling")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle()

  if (error) {
    throw new Error(`Erro ao buscar credenciais do Bling: ${error.message}`)
  }

  return (data as BlingCredentialRow | null) ?? null
}

export async function saveBlingTokens(params: {
  businessId: string
  token: BlingTokenResponse
}): Promise<BlingCredentialRow> {
  const expiresAt = calculateExpiresAt(params.token.expires_in)

  const payload = {
    business_id: params.businessId,
    access_token: params.token.access_token,
    refresh_token: params.token.refresh_token ?? null,
    token_type: params.token.token_type ?? "Bearer",
    expires_in: params.token.expires_in ?? null,
    expires_at: expiresAt,
    scope: params.token.scope ?? null,
    status: "connected" as const,
    last_error: null,
  }

  const { data, error } = await supabaseAdmin
    .from("ci_integracoes_bling")
    .upsert(payload, { onConflict: "business_id" })
    .select("*")
    .single()

  if (error || !data) {
    throw new Error(`Erro ao salvar tokens do Bling: ${error?.message ?? "erro desconhecido"}`)
  }

  return data as BlingCredentialRow
}

export async function markBlingIntegrationError(params: {
  businessId: string
  errorMessage: string
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("ci_integracoes_bling")
    .upsert(
      {
        business_id: params.businessId,
        status: "error",
        last_error: params.errorMessage,
      },
      { onConflict: "business_id" }
    )

  if (error) {
    console.error("Erro ao registrar falha na integração Bling:", error)
  }
}

export async function disconnectBlingIntegration(
  businessId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("ci_integracoes_bling")
    .upsert(
      {
        business_id: businessId,
        access_token: null,
        refresh_token: null,
        token_type: null,
        expires_in: null,
        expires_at: null,
        scope: null,
        status: "disconnected",
        last_error: null,
      },
      { onConflict: "business_id" }
    )

  if (error) {
    throw new Error(`Erro ao desconectar Bling: ${error.message}`)
  }
}