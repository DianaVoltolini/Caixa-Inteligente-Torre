// src/app/api/bling/sync-contact/route.ts

import { NextRequest, NextResponse } from "next/server"

import { requireBusinessApiUser } from "@/lib/auth/require-business-api"
import { ensureBlingContactForAssinatura } from "@/lib/services/bling/bling-contact-service"

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

async function executeSync(
  businessId: string,
  assinaturaId: string,
) {
  const auth = await requireBusinessApiUser(businessId)

  if (!auth.authorized) {
    return auth.response
  }

  const result = await ensureBlingContactForAssinatura({
    businessId: auth.businessId,
    assinaturaId,
  })

  return NextResponse.json({
    ok: true,
    message: "Contato sincronizado com sucesso.",
    business_id: auth.businessId,
    assinatura_id: assinaturaId,
    bling_cliente_id: result.contactId,
    mode: result.mode,
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const businessId = normalize(searchParams.get("business_id"))
    const assinaturaId = normalize(searchParams.get("assinatura_id"))

    if (!businessId) {
      return NextResponse.json(
        {
          ok: false,
          error: "business_id é obrigatório.",
        },
        { status: 400 },
      )
    }

    if (!assinaturaId) {
      return NextResponse.json(
        {
          ok: false,
          error: "assinatura_id é obrigatório.",
        },
        { status: 400 },
      )
    }

    return executeSync(businessId, assinaturaId)
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao sincronizar contato.",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)

    const businessId = normalize(body?.business_id)
    const assinaturaId = normalize(body?.assinatura_id)

    if (!businessId) {
      return NextResponse.json(
        {
          ok: false,
          error: "business_id é obrigatório.",
        },
        { status: 400 },
      )
    }

    if (!assinaturaId) {
      return NextResponse.json(
        {
          ok: false,
          error: "assinatura_id é obrigatório.",
        },
        { status: 400 },
      )
    }

    return executeSync(businessId, assinaturaId)
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao sincronizar contato.",
      },
      { status: 500 },
    )
  }
}