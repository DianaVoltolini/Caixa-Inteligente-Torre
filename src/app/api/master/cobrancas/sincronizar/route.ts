// src/app/api/master/cobrancas/sincronizar/route.ts

import { NextRequest, NextResponse } from "next/server"

import { sincronizarCobrancaAtualComBling } from "@/features/billing/services/bling-payment-sync.service"
import { requireMasterApiUser } from "@/lib/auth/require-master-api"
import { supabaseAdmin } from "@/lib/supabase/admin"

function shouldMarkAsDeleted(errorMessage: string) {
  const message = errorMessage.toLowerCase()

  return (
    message.includes("não encontrada") ||
    message.includes("nao encontrada") ||
    message.includes("not found") ||
    message.includes("404") ||
    message.includes("excluída") ||
    message.includes("excluida") ||
    message.includes("removida") ||
    message.includes("situacao 5") ||
    message.includes("situação 5") ||
    message.includes("cancelamento")
  )
}

function hasDeletedSignal(payload: unknown) {
  const serialized = JSON.stringify(payload || {}).toLowerCase()

  return (
    serialized.includes('"situacao":5') ||
    serialized.includes('"situação":5') ||
    serialized.includes("informações cancelamento") ||
    serialized.includes("informacoes cancelamento") ||
    serialized.includes("cancelamento")
  )
}

async function markChargeAsDeleted(params: {
  cobrancaId: string
  businessId: string
  reason: string
}) {
  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from("ci_cobrancas")
    .update({
      status: "canceled",
      sync_status: "success",
      sync_error: null,
      bling_status_raw: "cobranca_excluida",
      ultima_consulta_bling_em: now,
      updated_at: now,
      metadata: {
        origem: "torre_controle",
        motivo: params.reason,
        atualizado_em: now,
      },
    })
    .eq("id", params.cobrancaId)
    .eq("business_id", params.businessId)

  if (error) {
    throw new Error("Não foi possível registrar a cobrança como excluída.")
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireMasterApiUser()

    if (!auth.authorized) {
      return auth.response
    }

    const body = (await request.json()) as {
      businessId?: string
      subscriptionId?: string | null
      cobrancaId?: string | null
    }

    const businessId = body.businessId?.trim()
    const cobrancaId = body.cobrancaId?.trim()

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: "businessId é obrigatório.",
        },
        { status: 400 }
      )
    }

    if (!cobrancaId) {
      return NextResponse.json(
        {
          success: false,
          error: "cobrancaId é obrigatório.",
        },
        { status: 400 }
      )
    }

    const { data: cobranca, error: cobrancaError } = await supabaseAdmin
      .from("ci_cobrancas")
      .select(
        `
          id,
          business_id,
          assinatura_id,
          status,
          bling_cobranca_id,
          bling_numero_documento
        `
      )
      .eq("id", cobrancaId)
      .eq("business_id", businessId)
      .single()

    if (cobrancaError || !cobranca) {
      return NextResponse.json(
        {
          success: false,
          error: "Cobrança não encontrada.",
        },
        { status: 404 }
      )
    }

    if (!cobranca.bling_cobranca_id) {
      await markChargeAsDeleted({
        cobrancaId: cobranca.id,
        businessId: cobranca.business_id,
        reason: "Cobrança sem vínculo com o Bling.",
      })

      return NextResponse.json({
        success: true,
        mode: "local_deleted",
        message: "Cobrança excluída registrada com sucesso.",
      })
    }

    try {
      const result = await sincronizarCobrancaAtualComBling({
        businessId,
        subscriptionId:
          body.subscriptionId ?? cobranca.assinatura_id ?? null,
      })

      const syncResult = result as {
        success?: boolean
        error?: string
      }

      if (hasDeletedSignal(result)) {
        await markChargeAsDeleted({
          cobrancaId: cobranca.id,
          businessId: cobranca.business_id,
          reason: "Bling retornou cobrança em situação de cancelamento.",
        })

        return NextResponse.json({
          success: true,
          mode: "bling_deleted",
          message: "Cobrança excluída registrada com sucesso.",
        })
      }

      if (syncResult.success === false) {
        const errorMessage =
          typeof syncResult.error === "string"
            ? syncResult.error
            : "Cobrança não sincronizada."

        if (shouldMarkAsDeleted(errorMessage)) {
          await markChargeAsDeleted({
            cobrancaId: cobranca.id,
            businessId: cobranca.business_id,
            reason: errorMessage,
          })

          return NextResponse.json({
            success: true,
            mode: "bling_deleted",
            message: "Cobrança excluída registrada com sucesso.",
          })
        }

        return NextResponse.json(syncResult)
      }

      return NextResponse.json(result)
    } catch (syncError) {
      const errorMessage =
        syncError instanceof Error
          ? syncError.message
          : "Erro ao sincronizar cobrança."

      if (shouldMarkAsDeleted(errorMessage)) {
        await markChargeAsDeleted({
          cobrancaId: cobranca.id,
          businessId: cobranca.business_id,
          reason: errorMessage,
        })

        return NextResponse.json({
          success: true,
          mode: "bling_deleted",
          message: "Cobrança excluída registrada com sucesso.",
        })
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido.",
      },
      { status: 500 }
    )
  }
}