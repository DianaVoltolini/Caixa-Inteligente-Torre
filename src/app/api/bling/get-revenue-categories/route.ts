// src/app/api/bling/get-revenue-categories/route.ts

import { NextResponse } from "next/server"

import { requireMasterApiUser } from "@/lib/auth/require-master-api"
import { blingRequest } from "@/lib/bling/client"

export async function GET() {
  try {
    const auth = await requireMasterApiUser()

    if (!auth.authorized) {
      return auth.response
    }

    const response = await blingRequest(
      "/categorias/receitas-despesas",
      {
        method: "GET",
      },
    )

    return NextResponse.json({
      success: true,
      data: response,
    })
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