// src/lib/bling/logs.ts

import "server-only"

import { supabaseAdmin } from "@/lib/supabase/admin"
import type { BlingRequestLogInput } from "@/lib/bling/types"

export async function registrarBlingSyncLog(
  input: BlingRequestLogInput
): Promise<void> {
  const { error } = await supabaseAdmin.from("ci_bling_sync_logs").insert({
    business_id: input.businessId ?? null,
    assinatura_id: input.assinaturaId ?? null,
    cobranca_id: input.cobrancaId ?? null,
    operacao: input.operacao,
    status: input.status,
    request_payload: input.requestPayload ?? null,
    response_payload: input.responsePayload ?? null,
    erro: input.erro ?? null,
  })

  if (error) {
    console.error("Erro ao registrar ci_bling_sync_logs:", error)
  }
}