// src/lib/bling/auth.ts

import "server-only"

import { randomUUID } from "crypto"
import {
  assertBlingOAuthConfigured,
} from "@/lib/bling/config"
import { BlingApiError, getBlingErrorMessage } from "@/lib/bling/errors"
import type { BlingTokenResponse } from "@/lib/bling/types"

function buildOAuthTokenUrl(): string {
  const config = assertBlingOAuthConfigured()
  return `${config.oauthBaseUrl}/token`
}

export function createBlingOAuthState(): string {
  return randomUUID()
}

export function buildBlingAuthorizationUrl(state: string): string {
  const config = assertBlingOAuthConfigured()

  const url = new URL(`${config.oauthBaseUrl}/authorize`)

  url.searchParams.set("response_type", "code")
  url.searchParams.set("client_id", config.clientId as string)
  url.searchParams.set("redirect_uri", config.redirectUri as string)
  url.searchParams.set("state", state)

  return url.toString()
}

function buildTokenHeaders(): Headers {
  const config = assertBlingOAuthConfigured()
  const credentials = `${config.clientId}:${config.clientSecret}`
  const encoded = Buffer.from(credentials).toString("base64")

  const headers = new Headers()

  headers.set("Authorization", `Basic ${encoded}`)
  headers.set("Content-Type", "application/x-www-form-urlencoded")
  headers.set("Accept", "application/json")

  if (config.enableJwt) {
    headers.set("enable-jwt", "1")
  }

  return headers
}

async function parseTokenResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    return response.json()
  }

  return {
    raw: await response.text(),
  }
}

export async function exchangeAuthorizationCodeForToken(
  code: string,
): Promise<BlingTokenResponse> {
  const config = assertBlingOAuthConfigured()

  const body = new URLSearchParams()

  body.set("grant_type", "authorization_code")
  body.set("code", code)
  body.set("redirect_uri", config.redirectUri as string)

  const response = await fetch(buildOAuthTokenUrl(), {
    method: "POST",
    headers: buildTokenHeaders(),
    body: body.toString(),
    cache: "no-store",
  })

  const payload = await parseTokenResponse(response)

  if (!response.ok) {
    throw new BlingApiError(
      getBlingErrorMessage(payload),
      response.status,
      payload,
    )
  }

  return payload as BlingTokenResponse
}

export async function refreshBlingAccessToken(
  refreshToken: string,
): Promise<BlingTokenResponse> {
  const body = new URLSearchParams()

  body.set("grant_type", "refresh_token")
  body.set("refresh_token", refreshToken)

  const response = await fetch(buildOAuthTokenUrl(), {
    method: "POST",
    headers: buildTokenHeaders(),
    body: body.toString(),
    cache: "no-store",
  })

  const payload = await parseTokenResponse(response)

  if (!response.ok) {
    throw new BlingApiError(
      getBlingErrorMessage(payload),
      response.status,
      payload,
    )
  }

  return payload as BlingTokenResponse
}