// src/lib/services/assinaturas/assinatura-service.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calcularFimTrial,
  calcularPrimeiroProximoVencimentoRecorrente,
  calcularStatusOperacionalAssinatura,
  toDateOnly,
  validarDiaVencimento,
} from "@/lib/services/assinaturas/assinatura-rules";
import type {
  AssinaturaRow,
  CiAssinaturaStatus,
  ConverterTrialEmAssinaturaInput,
  CriarTrialAssinaturaInput,
  RegistrarEventoInput,
} from "@/lib/types/assinaturas";

type DbClient = SupabaseClient<any, "public", any>;

async function registrarEvento(
  supabase: DbClient,
  input: RegistrarEventoInput,
): Promise<void> {
  const { error } = await supabase.from("ci_assinatura_eventos").insert({
    assinatura_id: input.assinaturaId,
    business_id: input.businessId,
    cobranca_id: input.cobrancaId ?? null,
    tipo: input.tipo,
    descricao: input.descricao ?? null,
    origem: input.origem ?? "system",
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(`Erro ao registrar evento: ${error.message}`);
  }
}

export async function criarAssinaturaTrial(
  supabase: DbClient,
  input: CriarTrialAssinaturaInput,
): Promise<AssinaturaRow> {
  const now = new Date();
  const trialEndsAt = calcularFimTrial(now);

  const { data, error } = await supabase
    .from("ci_assinaturas")
    .insert({
      business_id: input.businessId,
      status: "trialing",
      plano: input.plano,
      valor: input.valor,
      trial_started_at: now.toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
      tolerancia_dias: input.toleranciaDias ?? 3,
      observacoes_internas: input.observacoesInternas ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Erro ao criar assinatura trial: ${error.message}`);
  }

  await registrarEvento(supabase, {
    assinaturaId: data.id,
    businessId: input.businessId,
    tipo: "trial_started",
    descricao: "Assinatura criada em período de teste gratuito de 7 dias.",
    origem: "system",
    metadata: {
      plano: input.plano,
      valor: input.valor,
      trial_ends_at: trialEndsAt.toISOString(),
    },
  });

  return data as AssinaturaRow;
}

export async function buscarAssinaturaPorId(
  supabase: DbClient,
  assinaturaId: string,
  businessId: string,
): Promise<AssinaturaRow> {
  const { data, error } = await supabase
    .from("ci_assinaturas")
    .select("*")
    .eq("id", assinaturaId)
    .eq("business_id", businessId)
    .single();

  if (error || !data) {
    throw new Error("Assinatura não encontrada.");
  }

  return data as AssinaturaRow;
}

export async function converterTrialEmAssinatura(
  supabase: DbClient,
  input: ConverterTrialEmAssinaturaInput,
): Promise<AssinaturaRow> {
  const assinatura = await buscarAssinaturaPorId(
    supabase,
    input.assinaturaId,
    input.businessId,
  );

  if (assinatura.status !== "trialing") {
    throw new Error("A assinatura informada não está em trial.");
  }

  const now = new Date();

  const payload: Record<string, unknown> = {
    status: "active",
    trial_converted_at: now.toISOString(),
    assinada_em: now.toISOString(),
  };

  if (input.paymentMethod) {
    payload.payment_method = input.paymentMethod;
  }

  if (
    input.usuarioEscolheuDiaVencimento !== null &&
    input.usuarioEscolheuDiaVencimento !== undefined
  ) {
    if (!validarDiaVencimento(input.usuarioEscolheuDiaVencimento)) {
      throw new Error("Dia de vencimento inválido. Use apenas 8, 16 ou 25.");
    }

    payload.dia_vencimento = input.usuarioEscolheuDiaVencimento;

    const proximoVencimento = calcularPrimeiroProximoVencimentoRecorrente(
      input.usuarioEscolheuDiaVencimento,
      now,
    );

    payload.proximo_vencimento = toDateOnly(proximoVencimento);
  }

  const { data, error } = await supabase
    .from("ci_assinaturas")
    .update(payload)
    .eq("id", input.assinaturaId)
    .eq("business_id", input.businessId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Erro ao converter trial em assinatura: ${error?.message ?? "erro desconhecido"}`,
    );
  }

  await registrarEvento(supabase, {
    assinaturaId: input.assinaturaId,
    businessId: input.businessId,
    tipo: "trial_converted",
    descricao: "Trial convertido em assinatura ativa.",
    origem: input.origem ?? "user",
    metadata: {
      dia_vencimento: payload.dia_vencimento ?? null,
      proximo_vencimento: payload.proximo_vencimento ?? null,
      payment_method: payload.payment_method ?? null,
    },
  });

  return data as AssinaturaRow;
}

export async function atualizarStatusOperacionalAssinatura(
  supabase: DbClient,
  params: {
    assinaturaId: string;
    businessId: string;
    cobrancaAtualStatus?: "pending" | "paid" | "overdue" | "canceled" | null;
  },
): Promise<AssinaturaRow> {
  const assinatura = await buscarAssinaturaPorId(
    supabase,
    params.assinaturaId,
    params.businessId,
  );

  const novoStatus = calcularStatusOperacionalAssinatura({
    assinatura,
    cobrancaAtualStatus: params.cobrancaAtualStatus ?? null,
  });

  if (novoStatus === assinatura.status) {
    return assinatura;
  }

  const updatePayload: {
    status: CiAssinaturaStatus;
    bloqueada_em?: string | null;
  } = {
    status: novoStatus,
  };

  if (novoStatus === "blocked" || novoStatus === "overdue") {
    updatePayload.bloqueada_em = new Date().toISOString();
  }

  if (novoStatus === "active") {
    updatePayload.bloqueada_em = null;
  }

  const { data, error } = await supabase
    .from("ci_assinaturas")
    .update(updatePayload)
    .eq("id", params.assinaturaId)
    .eq("business_id", params.businessId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Erro ao atualizar status operacional da assinatura: ${error?.message ?? "erro desconhecido"}`,
    );
  }

  await registrarEvento(supabase, {
    assinaturaId: params.assinaturaId,
    businessId: params.businessId,
    tipo: "subscription_status_updated",
    descricao: `Status da assinatura atualizado para ${novoStatus}.`,
    origem: "system",
    metadata: {
      status_anterior: assinatura.status,
      status_novo: novoStatus,
      cobranca_atual_status: params.cobrancaAtualStatus ?? null,
    },
  });

  return data as AssinaturaRow;
}

export async function bloquearAssinaturaManual(
  supabase: DbClient,
  params: {
    assinaturaId: string;
    businessId: string;
    motivo?: string;
  },
): Promise<AssinaturaRow> {
  const { data, error } = await supabase
    .from("ci_assinaturas")
    .update({
      status: "blocked",
      bloqueio_manual: true,
      bloqueada_em: new Date().toISOString(),
    })
    .eq("id", params.assinaturaId)
    .eq("business_id", params.businessId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Erro ao bloquear assinatura manualmente: ${error?.message ?? "erro desconhecido"}`,
    );
  }

  await registrarEvento(supabase, {
    assinaturaId: params.assinaturaId,
    businessId: params.businessId,
    tipo: "manual_block",
    descricao: params.motivo ?? "Assinatura bloqueada manualmente.",
    origem: "admin",
    metadata: {},
  });

  return data as AssinaturaRow;
}

export async function liberarAssinaturaManual(
  supabase: DbClient,
  params: {
    assinaturaId: string;
    businessId: string;
    motivo?: string;
  },
): Promise<AssinaturaRow> {
  const assinatura = await buscarAssinaturaPorId(
    supabase,
    params.assinaturaId,
    params.businessId,
  );

  const novoStatus = calcularStatusOperacionalAssinatura({
    assinatura: {
      ...assinatura,
      bloqueio_manual: false,
    },
    cobrancaAtualStatus: null,
  });

  const { data, error } = await supabase
    .from("ci_assinaturas")
    .update({
      status: novoStatus,
      bloqueio_manual: false,
      bloqueada_em: null,
    })
    .eq("id", params.assinaturaId)
    .eq("business_id", params.businessId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Erro ao liberar assinatura manualmente: ${error?.message ?? "erro desconhecido"}`,
    );
  }

  await registrarEvento(supabase, {
    assinaturaId: params.assinaturaId,
    businessId: params.businessId,
    tipo: "manual_unblock",
    descricao: params.motivo ?? "Assinatura liberada manualmente.",
    origem: "admin",
    metadata: {
      status_resultante: novoStatus,
    },
  });

  return data as AssinaturaRow;
}