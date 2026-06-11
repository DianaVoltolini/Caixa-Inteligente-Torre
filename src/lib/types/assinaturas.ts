// src/lib/types/assinaturas.ts

export type CiAssinaturaStatus =
  | "trialing"
  | "awaiting_payment"
  | "active"
  | "grace_period"
  | "overdue"
  | "blocked"
  | "canceled"

export type CiPaymentMethod = "pix" | "boleto"

export type CiCobrancaStatus =
  | "pending"
  | "paid"
  | "overdue"
  | "canceled"
  | "error"

export type CiSyncStatus = "pending" | "success" | "error"

export type CiCicloTipo = "first_charge" | "recurring"

export type CiOrigemEvento = "system" | "admin" | "cron" | "bling" | "user"

export type CiDiaVencimento = 8 | 16 | 25

export type CriarTrialAssinaturaInput = {
  businessId: string
  plano: string
  valor: number
  toleranciaDias?: number
  observacoesInternas?: string | null
  metadata?: Record<string, unknown>
}

export type ConverterTrialEmAssinaturaInput = {
  assinaturaId: string
  businessId: string
  usuarioEscolheuDiaVencimento?: CiDiaVencimento | null
  paymentMethod?: CiPaymentMethod | null
  origem?: CiOrigemEvento
}

export type CriarPrimeiraCobrancaInput = {
  assinaturaId: string
  businessId: string
  valor: number
}

export type CriarCobrancaRecorrenteInput = {
  assinaturaId: string
  businessId: string
  valor: number
  diaVencimento: CiDiaVencimento
  dataBase?: Date
}

export type RegistrarEventoInput = {
  assinaturaId: string
  businessId: string
  tipo: string
  descricao?: string | null
  cobrancaId?: string | null
  origem?: CiOrigemEvento
  metadata?: Record<string, unknown>
}

export type AssinaturaRow = {
  id: string
  business_id: string
  status: CiAssinaturaStatus
  plano: string
  valor: number
  trial_started_at: string | null
  trial_ends_at: string | null
  trial_converted_at: string | null
  dia_vencimento: CiDiaVencimento | null
  proximo_vencimento: string | null
  tolerancia_dias: number
  assinada_em: string | null
  cancelada_em: string | null
  bloqueada_em: string | null
  bloqueio_manual: boolean
  bling_cliente_id: string | null
  payment_method: CiPaymentMethod | null
  observacoes_internas: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type CobrancaRow = {
  id: string
  assinatura_id: string
  business_id: string
  competencia: string
  ciclo_tipo: CiCicloTipo
  valor: number
  gerada_em: string | null
  enviada_ao_bling_em: string | null
  vencimento: string
  status: CiCobrancaStatus
  sync_status: CiSyncStatus
  sync_error: string | null
  bling_cobranca_id: string | null
  bling_numero_documento: string | null
  bling_link_pagamento: string | null
  bling_status_raw: string | null
  pago_em: string | null
  ultima_consulta_bling_em: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}