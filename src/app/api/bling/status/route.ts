// src/app/api/bling/status/route.ts

import { NextResponse } from "next/server"

import { requireMasterApiUser } from "@/lib/auth/require-master-api"
import { getBlingPlatformAuthState } from "@/lib/bling/token-service"

export async function GET() {
  try {
    const auth = await requireMasterApiUser()

    if (!auth.authorized) {
      return auth.response
    }

    const authState = await getBlingPlatformAuthState()

    return NextResponse.json({
      success: true,
      connected: authState.connected,
      status: authState.status,
      expiresAt: authState.expiresAt,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        connected: false,
        status: "inactive",
        expiresAt: null,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao consultar integração do Bling.",
      },
      { status: 500 },
    )
  }
}