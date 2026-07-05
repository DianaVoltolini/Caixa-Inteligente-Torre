// src/app/api/cnpj/[cnpj]/route.ts

import { NextResponse } from "next/server"

const API_BASE_URL = "https://publica.cnpj.ws/cnpj"

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "")
}

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      cnpj: string
    }>
  }
) {
  try {
    const params = await context.params

    const cnpj = onlyNumbers(params.cnpj || "")

    if (cnpj.length !== 14) {
      return NextResponse.json(
        {
          ok: false,
          message: "CNPJ inválido.",
        },
        {
          status: 400,
        }
      )
    }

    const response = await fetch(`${API_BASE_URL}/${cnpj}`, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()

      console.error("Erro API CNPJ:", errorText)

      return NextResponse.json(
        {
          ok: false,
          message:
            "Não foi possível consultar este CNPJ no momento.",
        },
        {
          status: response.status,
        }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      ok: true,
      data,
    })
  } catch (error) {
    console.error("Erro consulta CNPJ:", error)

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro interno ao consultar o CNPJ.",
      },
      {
        status: 500,
      }
    )
  }
}