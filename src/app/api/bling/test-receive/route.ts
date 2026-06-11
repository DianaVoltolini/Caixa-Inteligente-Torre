// src/app/api/bling/test-receive/route.ts

import {
  NextRequest,
  NextResponse,
} from "next/server"

import { receiveBlingCharge } from "@/lib/bling/receive.service"
import { BillingPaymentMethod } from "@/lib/bling/types"

function parsePaymentMethod(
  value: string | null,
): BillingPaymentMethod {
  return value === "pix"
    ? "pix"
    : "boleto"
}

function blockProduction() {
  return (
    process.env.NODE_ENV ===
    "production"
  )
}

export async function GET(
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

    const chargeId =
      request.nextUrl.searchParams.get(
        "charge_id",
      )

    const amountParam =
      request.nextUrl.searchParams.get(
        "amount",
      )

    const paymentMethod =
      parsePaymentMethod(
        request.nextUrl.searchParams.get(
          "payment_method",
        ),
      )

    if (!chargeId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Informe charge_id na URL.",
        },
        { status: 400 },
      )
    }

    const amount = Number(
      amountParam ?? "49.9",
    )

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Informe um amount válido.",
        },
        { status: 400 },
      )
    }

    const result =
      await receiveBlingCharge({
        chargeId,
        amount,
        paymentMethod,
      })

    return NextResponse.json({
      success: true,
      chargeId,
      paymentMethod,
      borderoId:
        result.borderoId,
      pixCode:
        result.pixCode,
      boletoLink:
        result.boletoLink,
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