// src/app/api/bling/connect/route.ts

import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import {
  buildBlingAuthorizationUrl,
  createBlingOAuthState,
} from "@/lib/bling/auth"

const BLING_OAUTH_COOKIE =
  "ci_bling_oauth_state"

export async function GET() {
  const state =
    createBlingOAuthState()

  const authorizationUrl =
    buildBlingAuthorizationUrl(
      state,
    )

  const cookieStore =
    await cookies()

  cookieStore.set(
    BLING_OAUTH_COOKIE,
    state,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    },
  )

  return NextResponse.redirect(
    authorizationUrl,
  )
}