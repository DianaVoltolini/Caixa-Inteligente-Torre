// src/app/api/internal/bling/test-contact/route.ts

import {
  NextRequest,
  NextResponse,
} from "next/server"

import { upsertBlingContact } from "@/lib/bling/contact.service"

function blockProduction() {
  return (
    process.env.NODE_ENV ===
    "production"
  )
}

export async function POST(
  request: NextRequest,
) {
  try {
    if (blockProduction()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Endpoint indisponível em produção.",
        },
        { status: 403 },
      )
    }

    const body =
      await request.json()

    const result =
      await upsertBlingContact({
        name:
          body.name ??
          "Cliente Teste Caixa Inteligente",

        email:
          body.email ??
          "teste@caixainteligente.com",

        phone:
          body.phone ??
          "11999999999",

        document:
          body.document ??
          "12345678909",

        personType:
          body.personType ??
          "F",
      })

    return NextResponse.json(
      {
        success: true,
        contactId: result.id,
      },
      { status: 200 },
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro interno ao testar contato no Bling."

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    )
  }
}