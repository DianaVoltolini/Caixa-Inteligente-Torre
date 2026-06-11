// src/lib/bling/token-service.ts

import {
  getBlingPlatformIntegration,
  updateBlingAccessToken,
} from "./platform-integration.repository"
import { BlingPlatformIntegration, BlingTokenPayload } from "./types"

const BLING_CLIENT_ID = process.env.BLING_CLIENT_ID
const BLING_CLIENT_SECRET = process.env.BLING_CLIENT_SECRET
const BLING_OAUTH_BASE_URL =
  process.env.BLING_OAUTH_BASE_URL || "https://www.bling.com.br/Api/v3/oauth"

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true

  const expiresAtMs = new Date(expiresAt).getTime()
  return expiresAtMs - Date.now() <= 60_000
}

async function refreshBlingToken(
  refreshToken: string,
): Promise<BlingTokenPayload> {
  if (!BLING_CLIENT_ID || !BLING_CLIENT_SECRET) {
    throw new Error("Credenciais do Bling não configuradas.")
  }

  const basicAuth = Buffer.from(
    `${BLING_CLIENT_ID}:${BLING_CLIENT_SECRET}`,
  ).toString("base64")

  const response = await fetch(`${BLING_OAUTH_BASE_URL}/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
    cache: "no-store",
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Erro ao renovar token do Bling: ${response.status} - ${errorText}`,
    )
  }

  return (await response.json()) as BlingTokenPayload
}

export async function getValidBlingAccessToken(): Promise<string> {
  const integration = await getBlingPlatformIntegration()

  if (!integration) {
    throw new Error(
      "Integração central do Bling não conectada. Faça o OAuth da fundadora.",
    )
  }

  if (!integration.refresh_token) {
    throw new Error("Refresh token do Bling não encontrado.")
  }

  if (!isExpired(integration.expires_at) && integration.access_token) {
    return integration.access_token
  }

  const refreshed = await refreshBlingToken(integration.refresh_token)
  const updated = await updateBlingAccessToken(refreshed)

  if (!updated.access_token) {
    throw new Error("Falha ao atualizar token do Bling.")
  }

  return updated.access_token
}

export async function getBlingPlatformAuthState(): Promise<{
  connected: boolean
  status: BlingPlatformIntegration["status"] | "inactive"
  expiresAt: string | null
}> {
  const integration = await getBlingPlatformIntegration()

  if (!integration) {
    return {
      connected: false,
      status: "inactive",
      expiresAt: null,
    }
  }

  return {
    connected: Boolean(integration.access_token && integration.refresh_token),
    status: integration.status,
    expiresAt: integration.expires_at,
  }
}