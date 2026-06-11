// src/app/api/bling/ping/route.ts

import { NextResponse } from "next/server"

import { requireMasterApiUser } from "@/lib/auth/require-master-api"

import { blingRequest } from "@/lib/bling/client"
import { getBlingPlatformAuthState } from "@/lib/bling/token-service"
import { registrarBlingSyncLog } from "@/lib/bling/logs"

export async function GET() {
  try {
    const auth = await requireMasterApiUser()

    if (!auth.authorized) {
      return auth.response
    }

    const authState =
      await getBlingPlatformAuthState()

    if (!authState.connected) {
      return NextResponse.json(
        {
          ok: false,
          stage: "not_connected",
          message:
            "Integração central do Bling ainda não conectada.",
        },
        { status: 400 },
      )
    }

    const response = await blingRequest(
      "/contatos",
      {
        method: "GET",
        query: {
          limite: 1,
        },
      },
    )

    await registrarBlingSyncLog({
      operacao: "bling_ping",
      status: "success",
      requestPayload: {
        path: "/contatos",
        method: "GET",
      },
      responsePayload: {
        success: true,
      },
    })

    return NextResponse.json({
      ok: true,
      stage: "connected",
      message:
        "Conexão central com o Bling validada com sucesso.",
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao validar conexão com o Bling."

    await registrarBlingSyncLog({
      operacao: "bling_ping",
      status: "error",
      erro: message,
      responsePayload: {
        message,
      },
    })

    return NextResponse.json(
      {
        ok: false,
        stage: "error",
        error: message,
      },
      { status: 500 },
    )
  }
}