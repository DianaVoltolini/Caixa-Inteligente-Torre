// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\api\bling\callback\route.ts

import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { exchangeAuthorizationCodeForToken } from "@/lib/bling/auth"
import { upsertBlingPlatformIntegrationFromToken } from "@/lib/bling/platform-integration.repository"

const BLING_OAUTH_COOKIE = "ci_bling_oauth_state"

function getTorreBaseUrl(request: NextRequest) {
  const configuredUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BASE_URL

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "")
  }

  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host")

  const protocol =
    request.headers.get("x-forwarded-proto") ||
    "https"

  if (host && !host.includes("0.0.0.0")) {
    return `${protocol}://${host}`.replace(/\/$/, "")
  }

  return "https://torre.meucaixainteligente.com.br"
}

function redirectToBlingPage(
  request: NextRequest,
  params: Record<string, string>,
) {
  const baseUrl = getTorreBaseUrl(request)
  const url = new URL("/integracoes/bling", baseUrl)

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code")
    const state = request.nextUrl.searchParams.get("state")

    if (!code) {
      return redirectToBlingPage(request, {
        error: "code_missing",
      })
    }

    if (!state) {
      return redirectToBlingPage(request, {
        error: "state_missing",
      })
    }

    const cookieStore = await cookies()
    const expectedState = cookieStore.get(BLING_OAUTH_COOKIE)?.value

    if (!expectedState || expectedState !== state) {
      return redirectToBlingPage(request, {
        error: "invalid_state",
      })
    }

    const tokenResponse = await exchangeAuthorizationCodeForToken(code)

    await upsertBlingPlatformIntegrationFromToken(tokenResponse)

    cookieStore.delete(BLING_OAUTH_COOKIE)

    return redirectToBlingPage(request, {
      success: "true",
    })
  } catch (error) {
    console.error("Erro no callback OAuth do Bling:", error)

    return redirectToBlingPage(request, {
      error: "callback_error",
    })
  }
}