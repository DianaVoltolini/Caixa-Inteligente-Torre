// src/features/analytics/services/analytics.service.ts

import { createClient } from "@/lib/supabase/client"

type TransactionRow = {
  type: string
  amount: number | string | null
}

type Alerta = {
  titulo: string
  texto: string
}

function buildDiagnostico(
  receitas: number,
  despesas: number,
  lucro: number,
) {
  if (receitas <= 0) {
    return {
      titulo:
        "Você ainda não tem movimento suficiente para analisar",
      texto:
        "Assim que você começar a lançar seus atendimentos e gastos, esta área vai mostrar com mais clareza como o dinheiro está se comportando.",
    }
  }

  const margemLucro =
    receitas > 0
      ? (lucro / receitas) * 100
      : 0

  if (lucro < 0) {
    return {
      titulo:
        "Hoje você está gastando mais do que entra",
      texto:
        "Seu resultado está negativo neste período. Vale revisar gastos e preços para não trabalhar muito e terminar o mês apertada.",
    }
  }

  if (margemLucro < 15) {
    return {
      titulo:
        "Você está trabalhando, mas sobrando pouco",
      texto:
        "Seu negócio está faturando, mas o lucro ainda está baixo para o volume que entrou. Isso costuma ser sinal de custo alto ou preço abaixo do ideal.",
    }
  }

  if (margemLucro < 30) {
    return {
      titulo:
        "Seu negócio está caminhando, mas ainda pode melhorar",
      texto:
        "Já existe resultado, mas ainda há espaço para deixar mais dinheiro na sua mão. Pequenos ajustes em custos e preço podem melhorar bastante essa margem.",
    }
  }

  return {
    titulo:
      "Seu resultado está saudável",
    texto:
      "Você está conseguindo transformar boa parte do que entra em resultado. Agora o foco é manter esse ritmo e crescer sem perder margem.",
  }
}

function buildAlertas(
  receitas: number,
  despesas: number,
  lucro: number,
  ticketMedio: number,
): Alerta[] {
  const margemLucro =
    receitas > 0
      ? (lucro / receitas) * 100
      : 0

  const alertas: Alerta[] = []

  if (lucro < 0) {
    alertas.push({
      titulo:
        "Alerta de resultado negativo",
      texto:
        "Neste período, saiu mais dinheiro do que entrou. Vale revisar seus gastos primeiro para entender onde o dinheiro está pesando.",
    })
  } else if (margemLucro < 15) {
    alertas.push({
      titulo:
        "Lucro baixo para o que entrou",
      texto:
        "Você está movimentando dinheiro, mas uma parte muito pequena está sobrando. Isso pode indicar preço baixo ou custo alto demais.",
    })
  } else {
    alertas.push({
      titulo:
        "Seu lucro está respirando melhor",
      texto:
        "Seu resultado mostra que o dinheiro que entra está sobrando de forma mais saudável. O ideal é acompanhar isso para manter consistência.",
    })
  }

  if (
    despesas > receitas * 0.5 &&
    receitas > 0
  ) {
    alertas.push({
      titulo:
        "Seus custos estão pesando",
      texto:
        "Mais da metade do que entrou está indo para gastos. Vale revisar despesas fixas, compras e custos do dia a dia.",
    })
  } else {
    alertas.push({
      titulo:
        "Seus custos estão mais controlados",
      texto:
        "Seus gastos ainda não estão consumindo a maior parte do que entra. Isso ajuda a deixar seu resultado mais leve.",
    })
  }

  if (ticketMedio <= 0) {
    alertas.push({
      titulo:
        "Ainda sem média de atendimento",
      texto:
        "Assim que você lançar mais entradas, o sistema vai mostrar quanto, em média, cada atendimento está gerando.",
    })
  } else if (ticketMedio < 100) {
    alertas.push({
      titulo:
        "Seu ticket médio pode subir",
      texto:
        "O valor médio por atendimento ainda está baixo. Pode ser uma oportunidade para revisar preço, pacote ou serviço adicional.",
    })
  } else {
    alertas.push({
      titulo:
        "Seu ticket médio está interessante",
      texto:
        "O valor médio por atendimento já mostra boa geração por venda. Acompanhar isso ajuda a crescer sem depender só de volume.",
    })
  }

  return alertas
}

export async function getAnalyticsData(
  businessId: string,
) {
  const supabase = createClient()

  const { data, error } =
    await supabase
      .from("ci_transactions")
      .select("type, amount")
      .eq("business_id", businessId)
      .is("deleted_at", null)

  if (error) {
    throw new Error(error.message)
  }

  const rows: TransactionRow[] =
    Array.isArray(data)
      ? data
      : []

  const receitasList = rows.filter(
    (transaction) =>
      transaction.type === "income",
  )

  const despesasList = rows.filter(
    (transaction) =>
      transaction.type === "expense",
  )

  const receitas =
    receitasList.reduce(
      (acc, transaction) => {
        return (
          acc +
          Number(
            transaction.amount || 0,
          )
        )
      },
      0,
    )

  const despesas =
    despesasList.reduce(
      (acc, transaction) => {
        return (
          acc +
          Number(
            transaction.amount || 0,
          )
        )
      },
      0,
    )

  const lucro =
    receitas - despesas

  const ticketMedio =
    receitasList.length > 0
      ? receitas /
        receitasList.length
      : 0

  const margemLucro =
    receitas > 0
      ? (lucro / receitas) * 100
      : 0

  const diagnostico =
    buildDiagnostico(
      receitas,
      despesas,
      lucro,
    )

  const alertas =
    buildAlertas(
      receitas,
      despesas,
      lucro,
      ticketMedio,
    )

  return {
    receitas,
    despesas,
    lucro,
    ticketMedio,
    margemLucro,
    diagnosticoTitulo:
      diagnostico.titulo,
    diagnosticoTexto:
      diagnostico.texto,
    alertas,
    hasData: rows.length > 0,
  }
}