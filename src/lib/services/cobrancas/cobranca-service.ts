// src/lib/services/cobrancas/cobranca-service.ts

import type { SupabaseClient } from "@supabase/supabase-js"
import {
  calcularCompetencia,
  calcularDataGeracaoRecorrente,
  calcularVencimentoPrimeiraCobranca,
  toDateOnly,
} from "@/lib/services/assinaturas/assinatura-rules"
import {
  isCobrancaAbertaForaDaTolerancia,
  isCobrancaAindaPagavel,
} from "@/lib/services/cobrancas/cobranca-rules"
import type {
  AssinaturaRow,
  CobrancaRow,
  CriarCobrancaRecorrenteInput,
  CriarPrimeiraCobrancaInput,
} from "@/lib/types/assinaturas"

type DbClient = SupabaseClient<any, "public", any>

const DEFAULT_TOLERANCIA_DIAS = 3

type CobrancaComNumeroDocumento = CobrancaRow & {
  bling_numero_documento?: string | null
}

async function registrarEvento(
  supabase: DbClient,
  params: {
    assinaturaId: string
    businessId: string
    cobrancaId?: string | null
    tipo: string
    descricao: string
    origem?: "system" | "admin" | "cron" | "bling" | "user"
    metadata?: Record<string, unknown>
  },
): Promise<void> {
  const { error } = await supabase.from("ci_assinatura_eventos").insert({
    assinatura_id: params.assinaturaId,
    business_id: params.businessId,
    cobranca_id: params.cobrancaId ?? null,
    tipo: params.tipo,
    descricao: params.descricao,
    origem: params.origem ?? "system",
    metadata: params.metadata ?? {},
  })

  if (error) {
    throw new Error(`Erro ao registrar evento da cobrança: ${error.message}`)
  }
}

async function buscarAssinatura(
  supabase: DbClient,
  assinaturaId: string,
  businessId: string,
): Promise<AssinaturaRow> {
  const { data, error } = await supabase
    .from("ci_assinaturas")
    .select("*")
    .eq("id", assinaturaId)
    .eq("business_id", businessId)
    .single()

  if (error || !data) {
    throw new Error("Assinatura não encontrada para gerar cobrança.")
  }

  return data as AssinaturaRow
}

async function buscarCobrancaPorCompetencia(
  supabase: DbClient,
  assinaturaId: string,
  businessId: string,
  competencia: string,
): Promise<CobrancaRow | null> {
  const { data, error } = await supabase
    .from("ci_cobrancas")
    .select("*")
    .eq("assinatura_id", assinaturaId)
    .eq("business_id", businessId)
    .eq("competencia", competencia)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Erro ao buscar cobrança por competência: ${error.message}`)
  }

  return (data as CobrancaRow | null) ?? null
}

async function buscarUltimaCobrancaAberta(
  supabase: DbClient,
  assinaturaId: string,
  businessId: string,
): Promise<CobrancaRow | null> {
  const { data, error } = await supabase
    .from("ci_cobrancas")
    .select("*")
    .eq("assinatura_id", assinaturaId)
    .eq("business_id", businessId)
    .in("status", ["pending", "overdue"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Erro ao buscar cobrança aberta: ${error.message}`)
  }

  return (data as CobrancaRow | null) ?? null
}

function validarAssinaturaPodeGerarCobranca(assinatura: AssinaturaRow): void {
  if (assinatura.cancelada_em || assinatura.status === "canceled") {
    throw new Error("A assinatura está cancelada e não pode gerar cobrança.")
  }

  if (assinatura.status === "blocked") {
    throw new Error("A assinatura está bloqueada e não pode gerar cobrança.")
  }
}

function getToleranciaDias(assinatura: AssinaturaRow): number {
  return typeof assinatura.tolerancia_dias === "number"
    ? assinatura.tolerancia_dias
    : DEFAULT_TOLERANCIA_DIAS
}

function normalizeSequencial(value: number): string {
  return String(value).padStart(4, "0")
}

function getPrefixoNumeroDocumento(origemFluxo: "first_charge" | "recurring") {
  return origemFluxo === "first_charge" ? "A" : "R"
}

async function gerarNumeroDocumento(params: {
  supabase: DbClient
  competencia: string
  origemFluxo: "first_charge" | "recurring"
}): Promise<string> {
  const prefixo = getPrefixoNumeroDocumento(params.origemFluxo)
  const base = `${prefixo}-${params.competencia}`

  const { data, error } = await params.supabase
    .from("ci_cobrancas")
    .select("bling_numero_documento")
    .like("bling_numero_documento", `${base}-%`)

  if (error) {
    throw new Error(`Erro ao gerar número do documento: ${error.message}`)
  }

  const numeros = ((data ?? []) as Array<{ bling_numero_documento: string | null }>)
    .map((item) => item.bling_numero_documento)
    .filter((value): value is string => Boolean(value))
    .map((numeroDocumento) => {
      const partes = numeroDocumento.split("-")
      const sequencialTexto = partes[partes.length - 1]
      const sequencial = Number(sequencialTexto ?? 0)
      return Number.isFinite(sequencial) ? sequencial : 0
    })

  const proximoSequencial =
    numeros.length > 0 ? Math.max(...numeros) + 1 : 1

  return `${base}-${normalizeSequencial(proximoSequencial)}`
}

async function resolverCobrancaAbertaAntesDeCriar(params: {
  supabase: DbClient
  assinatura: AssinaturaRow
  origemFluxo: "first_charge" | "recurring"
}): Promise<CobrancaRow | null> {
  const toleranciaDias = getToleranciaDias(params.assinatura)

  const cobrancaAberta = await buscarUltimaCobrancaAberta(
    params.supabase,
    params.assinatura.id,
    params.assinatura.business_id,
  )

  if (!cobrancaAberta) {
    return null
  }

  if (
    isCobrancaAindaPagavel({
      cobranca: cobrancaAberta,
      toleranciaDias,
    })
  ) {
    await registrarEvento(params.supabase, {
      assinaturaId: params.assinatura.id,
      businessId: params.assinatura.business_id,
      cobrancaId: cobrancaAberta.id,
      tipo: "open_payable_charge_reused",
      descricao:
        "Cobrança aberta ainda pagável foi reutilizada. Nenhuma nova cobrança foi criada.",
      origem: "system",
      metadata: {
        origem_fluxo: params.origemFluxo,
        cobranca_status: cobrancaAberta.status,
        vencimento: cobrancaAberta.vencimento,
        tolerancia_dias: toleranciaDias,
        regra: "se_cobranca_aberta_ainda_pagavel_nao_gerar_nova_cobranca",
      },
    })

    return cobrancaAberta
  }

  if (
    isCobrancaAbertaForaDaTolerancia({
      cobranca: cobrancaAberta,
      toleranciaDias,
    })
  ) {
    throw new Error(
      "A cobrança anterior passou do prazo de pagamento. Cancele a cobrança anterior antes de gerar uma nova.",
    )
  }

  return null
}

function validarCobrancaDaMesmaCompetencia(
  cobranca: CobrancaRow | null,
  toleranciaDias: number,
): CobrancaRow | null {
  if (!cobranca) return null

  if (isCobrancaAindaPagavel({ cobranca, toleranciaDias })) {
    return cobranca
  }

  if (isCobrancaAbertaForaDaTolerancia({ cobranca, toleranciaDias })) {
    throw new Error(
      "Já existe uma cobrança aberta fora do prazo de pagamento. Cancele a cobrança anterior antes de gerar uma nova.",
    )
  }

  if (cobranca.status === "paid") {
    throw new Error(
      "Já existe uma cobrança paga para esta competência. Não é possível gerar outra cobrança para o mesmo período.",
    )
  }

  return null
}

export async function criarPrimeiraCobranca(
  supabase: DbClient,
  input: CriarPrimeiraCobrancaInput,
): Promise<CobrancaRow> {
  const assinatura = await buscarAssinatura(
    supabase,
    input.assinaturaId,
    input.businessId,
  )

  validarAssinaturaPodeGerarCobranca(assinatura)

  const cobrancaAberta = await resolverCobrancaAbertaAntesDeCriar({
    supabase,
    assinatura,
    origemFluxo: "first_charge",
  })

  if (cobrancaAberta) return cobrancaAberta

  const now = new Date()
  const vencimento = calcularVencimentoPrimeiraCobranca(now)
  const competencia = calcularCompetencia(now)
  const vencimentoDateOnly = toDateOnly(vencimento)
  const toleranciaDias = getToleranciaDias(assinatura)

  const cobrancaExistente = await buscarCobrancaPorCompetencia(
    supabase,
    input.assinaturaId,
    input.businessId,
    competencia,
  )

  const cobrancaPagavel = validarCobrancaDaMesmaCompetencia(
    cobrancaExistente,
    toleranciaDias,
  )

  if (cobrancaPagavel) {
    await registrarEvento(supabase, {
      assinaturaId: input.assinaturaId,
      businessId: input.businessId,
      cobrancaId: cobrancaPagavel.id,
      tipo: "same_competence_payable_charge_reused",
      descricao:
        "Cobrança pagável da mesma competência foi reutilizada. Nenhuma nova cobrança foi criada.",
      origem: "system",
      metadata: {
        competencia,
        vencimento: cobrancaPagavel.vencimento,
        status: cobrancaPagavel.status,
        tolerancia_dias: toleranciaDias,
      },
    })

    return cobrancaPagavel
  }

  const numeroDocumento = await gerarNumeroDocumento({
    supabase,
    competencia,
    origemFluxo: "first_charge",
  })

  const { data, error } = await supabase
    .from("ci_cobrancas")
    .insert({
      assinatura_id: input.assinaturaId,
      business_id: input.businessId,
      competencia,
      ciclo_tipo: "first_charge",
      valor: input.valor,
      gerada_em: now.toISOString(),
      vencimento: vencimentoDateOnly,
      status: "pending",
      sync_status: "pending",
      bling_numero_documento: numeroDocumento,
      metadata: {
        regra: "primeira_cobranca_vence_em_3_dias",
        origem_fluxo: "first_charge",
        assinatura_status_no_momento: assinatura.status,
        tolerancia_dias: toleranciaDias,
        numero_documento: {
          valor: numeroDocumento,
          prefixo: "A",
          competencia,
          origem_fluxo: "first_charge",
          gerado_em: now.toISOString(),
        },
      },
    })
    .select("*")
    .single()

  if (error || !data) {
    throw new Error(
      `Erro ao criar primeira cobrança: ${error?.message ?? "erro desconhecido"}`,
    )
  }

  await registrarEvento(supabase, {
    assinaturaId: input.assinaturaId,
    businessId: input.businessId,
    cobrancaId: data.id,
    tipo: "first_charge_created",
    descricao:
      assinatura.status === "trialing"
        ? "Primeira cobrança criada durante o trial."
        : "Primeira cobrança criada com prazo de vencimento de 3 dias.",
    origem: "system",
    metadata: {
      competencia,
      vencimento: vencimentoDateOnly,
      valor: input.valor,
      tolerancia_dias: toleranciaDias,
      assinatura_status_no_momento: assinatura.status,
      bling_numero_documento: numeroDocumento,
    },
  })

  return data as CobrancaRow
}

export async function podeGerarCobrancaRecorrenteHoje(params: {
  proximoVencimento: string
  hoje?: Date
}): Promise<boolean> {
  const hoje = params.hoje ?? new Date()
  const proximoVencimento = new Date(`${params.proximoVencimento}T00:00:00`)
  const dataGeracao = calcularDataGeracaoRecorrente(proximoVencimento)

  const hojeDateOnly = new Date(hoje)
  hojeDateOnly.setHours(0, 0, 0, 0)

  dataGeracao.setHours(0, 0, 0, 0)

  return hojeDateOnly.getTime() >= dataGeracao.getTime()
}

export async function criarCobrancaRecorrente(
  supabase: DbClient,
  input: CriarCobrancaRecorrenteInput,
): Promise<CobrancaRow> {
  const assinatura = await buscarAssinatura(
    supabase,
    input.assinaturaId,
    input.businessId,
  )

  validarAssinaturaPodeGerarCobranca(assinatura)

  const cobrancaAberta = await resolverCobrancaAbertaAntesDeCriar({
    supabase,
    assinatura,
    origemFluxo: "recurring",
  })

  if (cobrancaAberta) return cobrancaAberta

  if (!assinatura.proximo_vencimento) {
    throw new Error("A assinatura não possui próximo vencimento definido.")
  }

  if (!assinatura.dia_vencimento) {
    throw new Error("A assinatura não possui dia fixo de vencimento definido.")
  }

  const hoje = input.dataBase ?? new Date()
  const competencia = calcularCompetencia(
    new Date(`${assinatura.proximo_vencimento}T00:00:00`),
  )

  const jaPodeGerar = await podeGerarCobrancaRecorrenteHoje({
    proximoVencimento: assinatura.proximo_vencimento,
    hoje,
  })

  if (!jaPodeGerar) {
    throw new Error("Ainda não chegou a janela de geração da cobrança recorrente.")
  }

  const toleranciaDias = getToleranciaDias(assinatura)

  const cobrancaExistente = await buscarCobrancaPorCompetencia(
    supabase,
    input.assinaturaId,
    input.businessId,
    competencia,
  )

  const cobrancaPagavel = validarCobrancaDaMesmaCompetencia(
    cobrancaExistente,
    toleranciaDias,
  )

  if (cobrancaPagavel) {
    await registrarEvento(supabase, {
      assinaturaId: input.assinaturaId,
      businessId: input.businessId,
      cobrancaId: cobrancaPagavel.id,
      tipo: "same_competence_payable_recurring_charge_reused",
      descricao:
        "Cobrança recorrente pagável da mesma competência foi reutilizada. Nenhuma nova cobrança foi criada.",
      origem: "system",
      metadata: {
        competencia,
        vencimento: cobrancaPagavel.vencimento,
        status: cobrancaPagavel.status,
        tolerancia_dias: toleranciaDias,
      },
    })

    return cobrancaPagavel
  }

  const numeroDocumento = await gerarNumeroDocumento({
    supabase,
    competencia,
    origemFluxo: "recurring",
  })

  const { data, error } = await supabase
    .from("ci_cobrancas")
    .insert({
      assinatura_id: input.assinaturaId,
      business_id: input.businessId,
      competencia,
      ciclo_tipo: "recurring",
      valor: input.valor,
      gerada_em: hoje.toISOString(),
      vencimento: assinatura.proximo_vencimento,
      status: "pending",
      sync_status: "pending",
      bling_numero_documento: numeroDocumento,
      metadata: {
        regra: "cobranca_recorrente_gerada_10_dias_antes",
        dia_vencimento: assinatura.dia_vencimento,
        tolerancia_dias: toleranciaDias,
        numero_documento: {
          valor: numeroDocumento,
          prefixo: "R",
          competencia,
          origem_fluxo: "recurring",
          gerado_em: hoje.toISOString(),
        },
      },
    })
    .select("*")
    .single()

  if (error || !data) {
    throw new Error(
      `Erro ao criar cobrança recorrente: ${error?.message ?? "erro desconhecido"}`,
    )
  }

  await registrarEvento(supabase, {
    assinaturaId: input.assinaturaId,
    businessId: input.businessId,
    cobrancaId: data.id,
    tipo: "recurring_charge_created",
    descricao: "Cobrança recorrente criada para o próximo ciclo.",
    origem: "cron",
    metadata: {
      competencia,
      vencimento: assinatura.proximo_vencimento,
      valor: input.valor,
      dia_vencimento: assinatura.dia_vencimento,
      tolerancia_dias: toleranciaDias,
      bling_numero_documento: numeroDocumento,
    },
  })

  return data as CobrancaRow
}

async function getMetadata(
  supabase: DbClient,
  cobrancaId: string,
  businessId: string,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from("ci_cobrancas")
    .select("metadata")
    .eq("id", cobrancaId)
    .eq("business_id", businessId)
    .single()

  if (error) {
    throw new Error(`Erro ao buscar metadata da cobrança: ${error.message}`)
  }

  return (data?.metadata ?? {}) as Record<string, unknown>
}

export async function marcarCobrancaComoPaga(
  supabase: DbClient,
  params: {
    cobrancaId: string
    businessId: string
    pagoEm: Date
    blingStatusRaw: string | null
  },
): Promise<CobrancaRow> {
  const metadata = await getMetadata(
    supabase,
    params.cobrancaId,
    params.businessId,
  )

  const { data, error } = await supabase
    .from("ci_cobrancas")
    .update({
      status: "paid",
      pago_em: params.pagoEm.toISOString(),
      bling_status_raw: params.blingStatusRaw,
      ultima_consulta_bling_em: new Date().toISOString(),
      metadata: {
        ...metadata,
        bling_last_sync: {
          consulted_at: new Date().toISOString(),
          status_raw: params.blingStatusRaw,
          action: "marked_paid",
        },
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.cobrancaId)
    .eq("business_id", params.businessId)
    .select("*")
    .single()

  if (error || !data) {
    throw new Error(
      `Erro ao marcar cobrança como paga: ${error?.message ?? "erro desconhecido"}`,
    )
  }

  return data as CobrancaRow
}

export async function marcarCobrancaComoVencida(
  supabase: DbClient,
  params: {
    cobrancaId: string
    businessId: string
    blingStatusRaw: string | null
  },
): Promise<CobrancaRow> {
  const metadata = await getMetadata(
    supabase,
    params.cobrancaId,
    params.businessId,
  )

  const { data, error } = await supabase
    .from("ci_cobrancas")
    .update({
      status: "overdue",
      bling_status_raw: params.blingStatusRaw,
      ultima_consulta_bling_em: new Date().toISOString(),
      metadata: {
        ...metadata,
        bling_last_sync: {
          consulted_at: new Date().toISOString(),
          status_raw: params.blingStatusRaw,
          action: "marked_overdue",
        },
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.cobrancaId)
    .eq("business_id", params.businessId)
    .select("*")
    .single()

  if (error || !data) {
    throw new Error(
      `Erro ao marcar cobrança como vencida: ${error?.message ?? "erro desconhecido"}`,
    )
  }

  return data as CobrancaRow
}