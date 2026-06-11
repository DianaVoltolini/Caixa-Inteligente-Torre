// src/lib/bling/token-manager.ts

import "server-only"

import { refreshBlingAccessToken } from "@/lib/bling/auth"
import {
  getBlingCredentialsByBusinessId,
  markBlingIntegrationError,
  saveBlingTokens,
} from "@/lib/bling/credentials"
import { registrarBlingSyncLog } from "@/lib/bling/logs"

function isExpiredOrNearExpiry(expiresAt: string | null): boolean {
  if (!expiresAt) return true

  const expiry = new Date(expiresAt).getTime()
  const now = Date.now()
  const bufferMs = 60 * 1000

  return now + bufferMs >= expiry
}

export async function getValidBlingAccessToken(
  businessId: string
): Promise<string> {
  const credentials = await getBlingCredentialsByBusinessId(businessId)

  if (!credentials?.access_token) {
    throw new Error(
      "Integração com Bling ainda não conectada para esta empresa."
    )
  }

  if (!isExpiredOrNearExpiry(credentials.expires_at)) {
    return credentials.access_token
  }

  if (!credentials.refresh_token) {
    throw new Error(
      "Refresh token do Bling não encontrado. Reconecte a integração."
    )
  }

  try {
    const refreshed = await refreshBlingAccessToken(credentials.refresh_token)

    const updated = await saveBlingTokens({
      businessId,
      token: refreshed,
    })

    await registrarBlingSyncLog({
      operacao: "bling_refresh_token",
      businessId,
      status: "success",
      requestPayload: {
        grant_type: "refresh_token",
      },
      responsePayload: {
        token_type: refreshed.token_type,
        expires_in: refreshed.expires_in ?? null,
        scope: refreshed.scope ?? null,
      },
    })

    if (!updated.access_token) {
      throw new Error("Refresh realizado, mas sem access token salvo.")
    }

    return updated.access_token
  } catch (error: any) {
    const message =
      error?.message || "Erro ao renovar token da integração com o Bling."

    await markBlingIntegrationError({
      businessId,
      errorMessage: message,
    })

    await registrarBlingSyncLog({
      operacao: "bling_refresh_token",
      businessId,
      status: "error",
      erro: message,
      requestPayload: {
        grant_type: "refresh_token",
      },
      responsePayload: {
        name: error?.name ?? null,
        message: error?.message ?? null,
        statusCode: error?.statusCode ?? null,
        payload: error?.payload ?? null,
      },
    })

    throw error
  }
}