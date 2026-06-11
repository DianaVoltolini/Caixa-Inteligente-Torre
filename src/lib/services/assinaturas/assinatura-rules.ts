// src/lib/services/assinaturas/assinatura-rules.ts

import type {
  AssinaturaRow,
  CiAssinaturaStatus,
  CiDiaVencimento,
} from "@/lib/types/assinaturas";

const TRIAL_DIAS_PADRAO = 7;
const PRIMEIRA_COBRANCA_PRAZO_DIAS = 3;
const ANTECEDENCIA_COBRANCA_RECORRENTE_DIAS = 10;
const CICLO_MINIMO_PRIMEIRO_VENCIMENTO_DIAS = 20;

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

function clampDayToMonth(
  year: number,
  month1to12: number,
  desiredDay: number,
): number {
  return Math.min(desiredDay, daysInMonth(year, month1to12));
}

function buildDateWithClampedDay(
  year: number,
  month1to12: number,
  desiredDay: number,
): Date {
  const finalDay = clampDayToMonth(year, month1to12, desiredDay);
  return new Date(year, month1to12 - 1, finalDay);
}

function diffInCalendarDays(start: Date, end: Date): number {
  const startDate = startOfDay(start).getTime();
  const endDate = startOfDay(end).getTime();
  const diffMs = endDate - startDate;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function calcularFimTrial(date = new Date()): Date {
  return addDays(date, TRIAL_DIAS_PADRAO);
}

export function calcularVencimentoPrimeiraCobranca(date = new Date()): Date {
  return addDays(date, PRIMEIRA_COBRANCA_PRAZO_DIAS);
}

export function validarDiaVencimento(dia: number): dia is CiDiaVencimento {
  return dia === 8 || dia === 16 || dia === 25;
}

export function calcularPrimeiroProximoVencimentoRecorrente(
  diaVencimento: CiDiaVencimento,
  dataAssinatura = new Date(),
): Date {
  const referencia = startOfDay(dataAssinatura);

  const currentYear = referencia.getFullYear();
  const currentMonth = referencia.getMonth() + 1;

  let candidate = buildDateWithClampedDay(
    currentYear,
    currentMonth,
    diaVencimento,
  );

  if (candidate <= referencia) {
    const nextMonthDate = new Date(currentYear, currentMonth, 1);
    candidate = buildDateWithClampedDay(
      nextMonthDate.getFullYear(),
      nextMonthDate.getMonth() + 1,
      diaVencimento,
    );
  }

  const diasAtePrimeiroVencimento = diffInCalendarDays(referencia, candidate);

  if (diasAtePrimeiroVencimento < CICLO_MINIMO_PRIMEIRO_VENCIMENTO_DIAS) {
    const nextMonthDate = new Date(
      candidate.getFullYear(),
      candidate.getMonth() + 1,
      1,
    );

    candidate = buildDateWithClampedDay(
      nextMonthDate.getFullYear(),
      nextMonthDate.getMonth() + 1,
      diaVencimento,
    );
  }

  return candidate;
}

export function calcularDataGeracaoRecorrente(
  proximoVencimento: Date,
): Date {
  return addDays(proximoVencimento, -ANTECEDENCIA_COBRANCA_RECORRENTE_DIAS);
}

export function calcularCompetencia(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

export function calcularStatusOperacionalAssinatura(params: {
  assinatura: Pick<
    AssinaturaRow,
    | "status"
    | "bloqueio_manual"
    | "cancelada_em"
    | "trial_ends_at"
    | "proximo_vencimento"
    | "tolerancia_dias"
  >;
  cobrancaAtualStatus?: "pending" | "paid" | "overdue" | "canceled" | null;
  referencia?: Date;
}): CiAssinaturaStatus {
  const { assinatura, cobrancaAtualStatus } = params;
  const referencia = startOfDay(params.referencia ?? new Date());

  if (assinatura.cancelada_em) {
    return "canceled";
  }

  if (assinatura.bloqueio_manual) {
    return "blocked";
  }

  // 🔥 CORREÇÃO AQUI
  if (assinatura.status === "trialing") {
    if (!assinatura.trial_ends_at) {
      return "trialing";
    }

    const trialEndsAt = startOfDay(new Date(assinatura.trial_ends_at));

    // enquanto está no prazo → trial
    if (referencia <= trialEndsAt) {
      return "trialing";
    }

    // 🔥 terminou trial → aguardando pagamento
    return "awaiting_payment";
  }

  if (cobrancaAtualStatus === "paid") {
    return "active";
  }

  if (!assinatura.proximo_vencimento) {
    return "awaiting_payment";
  }

  const vencimento = startOfDay(new Date(assinatura.proximo_vencimento));

  if (referencia <= vencimento) {
    return "active";
  }

  const limiteTolerancia = addDays(vencimento, assinatura.tolerancia_dias);

  if (referencia <= limiteTolerancia) {
    return "grace_period";
  }

  return "overdue";
}

export function toDateOnly(date: Date): string {
  return toDateOnlyString(date);
}