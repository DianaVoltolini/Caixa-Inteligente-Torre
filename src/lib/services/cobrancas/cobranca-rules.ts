// src/lib/services/cobrancas/cobranca-rules.ts

import { CobrancaRow } from "@/lib/types/assinaturas"

function parseDateOnly(value?: string | null): Date | null {
  if (!value) return null

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function startOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function calcularLimitePagamentoCobranca(params: {
  vencimento: string
  toleranciaDias: number
}): Date | null {
  const vencimento = parseDateOnly(params.vencimento)

  if (!vencimento) {
    return null
  }

  return addDays(vencimento, params.toleranciaDias)
}

export function isCobrancaAberta(cobranca: CobrancaRow): boolean {
  return cobranca.status === "pending" || cobranca.status === "overdue"
}

export function isCobrancaAindaPagavel(params: {
  cobranca: CobrancaRow
  toleranciaDias: number
  now?: Date
}): boolean {
  if (!isCobrancaAberta(params.cobranca)) {
    return false
  }

  if (!params.cobranca.vencimento) {
    return true
  }

  const limitePagamento = calcularLimitePagamentoCobranca({
    vencimento: params.cobranca.vencimento,
    toleranciaDias: params.toleranciaDias,
  })

  if (!limitePagamento) {
    return true
  }

  const referencia = startOfDay(params.now ?? new Date())

  return referencia.getTime() <= startOfDay(limitePagamento).getTime()
}

export function isCobrancaAbertaForaDaTolerancia(params: {
  cobranca: CobrancaRow
  toleranciaDias: number
  now?: Date
}): boolean {
  if (!isCobrancaAberta(params.cobranca)) {
    return false
  }

  if (!params.cobranca.vencimento) {
    return false
  }

  const limitePagamento = calcularLimitePagamentoCobranca({
    vencimento: params.cobranca.vencimento,
    toleranciaDias: params.toleranciaDias,
  })

  if (!limitePagamento) {
    return false
  }

  const referencia = startOfDay(params.now ?? new Date())

  return referencia.getTime() > startOfDay(limitePagamento).getTime()
}