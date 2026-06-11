// src/lib/bling/config.ts

import "server-only"

export type BlingConfig = {
  apiUrl: string
  oauthBaseUrl: string
  clientId: string | null
  clientSecret: string | null
  redirectUri: string | null
  accessToken: string | null
  refreshToken: string | null
  enableJwt: boolean
}

function getEnv(name: string): string | null {
  const value = process.env[name]

  if (!value) return null

  const normalized = value.trim()

  return normalized.length > 0 ? normalized : null
}

export function getBlingConfig(): BlingConfig {
  return {
    apiUrl: getEnv("BLING_API_URL") ?? "https://api.bling.com.br/Api/v3",
    oauthBaseUrl:
      getEnv("BLING_OAUTH_BASE_URL") ?? "https://www.bling.com.br/Api/v3/oauth",
    clientId: getEnv("BLING_CLIENT_ID"),
    clientSecret: getEnv("BLING_CLIENT_SECRET"),
    redirectUri: getEnv("BLING_REDIRECT_URI"),
    accessToken: getEnv("BLING_ACCESS_TOKEN"),
    refreshToken: getEnv("BLING_REFRESH_TOKEN"),
    enableJwt: (getEnv("BLING_ENABLE_JWT") ?? "1") === "1",
  }
}

export function assertBlingApiConfigured(): BlingConfig {
  const config = getBlingConfig()

  if (!config.apiUrl) {
    throw new Error("BLING_API_URL não configurada.")
  }

  if (!config.oauthBaseUrl) {
    throw new Error("BLING_OAUTH_BASE_URL não configurada.")
  }

  return config
}

export function assertBlingOAuthConfigured(): BlingConfig {
  const config = assertBlingApiConfigured()

  if (!config.clientId) {
    throw new Error("BLING_CLIENT_ID não configurado.")
  }

  if (!config.clientSecret) {
    throw new Error("BLING_CLIENT_SECRET não configurado.")
  }

  if (!config.redirectUri) {
    throw new Error("BLING_REDIRECT_URI não configurada.")
  }

  return config
}

export function assertBlingAccessTokenConfigured(): BlingConfig {
  const config = assertBlingApiConfigured()

  if (!config.accessToken) {
    throw new Error(
      "BLING_ACCESS_TOKEN não configurado. Conclua a autorização OAuth antes de chamar a API do Bling."
    )
  }

  return config
}