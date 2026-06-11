// src/app/api/bling/callback/route.ts

import { cookies } from "next/headers"
import {
  NextRequest,
  NextResponse,
} from "next/server"

import {
  exchangeAuthorizationCodeForToken,
} from "@/lib/bling/auth"

import {
  upsertBlingPlatformIntegrationFromToken,
} from "@/lib/bling/platform-integration.repository"

const BLING_OAUTH_COOKIE =
  "ci_bling_oauth_state"

export async function GET(
  request: NextRequest,
) {
  try {
    const code =
      request.nextUrl.searchParams.get(
        "code",
      )

    const state =
      request.nextUrl.searchParams.get(
        "state",
      )

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Code não encontrado no retorno do Bling.",
        },
        { status: 400 },
      )
    }

    if (!state) {
      return NextResponse.json(
        {
          success: false,
          error:
            "State OAuth não encontrado.",
        },
        { status: 400 },
      )
    }

    const cookieStore =
      await cookies()

    const expectedState =
      cookieStore.get(
        BLING_OAUTH_COOKIE,
      )?.value

    if (
      !expectedState ||
      expectedState !== state
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "State OAuth inválido.",
        },
        { status: 403 },
      )
    }

    const tokenResponse =
      await exchangeAuthorizationCodeForToken(
        code,
      )

    await upsertBlingPlatformIntegrationFromToken(
      tokenResponse,
    )

    cookieStore.delete(
      BLING_OAUTH_COOKIE,
    )

    return NextResponse.redirect(
      new URL(
        "/torre-controle/integracoes/bling?success=true",
        request.url,
      ),
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido.",
      },
      { status: 500 },
    )
  }
}