// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\api\master\cobrancas\processar-recorrencia\route.ts

import { NextRequest, NextResponse } from "next/server"

import { requireMasterApiUser } from "@/lib/auth/require-master-api"

function getBillingCronSecret() {
  return (
    process.env.BILLING_CRON_SECRET ||
    process.env.CRON_SECRET ||
    ""
  ).trim()
}

function getBillingProcessUrl() {
  const baseUrl = (
    process.env.APP_BILLING_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://app.meucaixainteligente.com.br"
  ).trim()

  return `${baseUrl.replace(/\/$/, "")}/api/cron/billing/process`
}

function normalizeLimit(value: unknown) {
  const numeric = Number(value)

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 20
  }

  return Math.min(100, Math.floor(numeric))
}

function normalizeDryRun(value: unknown) {
  return value === true || value === "true"
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireMasterApiUser()

    if (!auth.authorized) {
      return auth.response
    }

    const secret = getBillingCronSecret()

    if (!secret) {
      return NextResponse.json(
        {
          success: false,
          error:
            "CRON_SECRET não foi configurado na Torre. Configure a mesma chave usada no app.",
        },
        { status: 500 },
      )
    }

    const body = (await request.json().catch(() => ({}))) as {
      dryRun?: boolean | string
      limit?: number | string
    }

    const dryRun = normalizeDryRun(body.dryRun)
    const limit = normalizeLimit(body.limit)

    const url = new URL(getBillingProcessUrl())
    url.searchParams.set("dryRun", String(dryRun))
    url.searchParams.set("limit", String(limit))

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secret}`,
      },
      cache: "no-store",
    })

    const text = await response.text()

    let payload: unknown = null

    try {
      payload = JSON.parse(text)
    } catch {
      payload = {
        raw: text,
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "O app não aceitou o processamento da recorrência.",
          status: response.status,
          payload,
        },
        { status: response.status },
      )
    }

    return NextResponse.json({
      success: true,
      dryRun,
      limit,
      payload,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao processar recorrência.",
      },
      { status: 500 },
    )
  }
}