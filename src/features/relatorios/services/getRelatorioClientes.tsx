// src/features/relatorios/services/getRelatorioClientes.ts

import { createClient } from "@/lib/supabase/client"

export type RelatorioCliente = {
  cliente: string
  total_pago: number
  quantidade_servicos: number
  ultimo_atendimento: string | null
}

type Params = {
  businessId: string
  dataInicial?: string
  dataFinal?: string
}

export async function getRelatorioClientes({
  businessId,
  dataInicial,
  dataFinal,
}: Params): Promise<RelatorioCliente[]> {
  const supabase = createClient()

  let query = supabase
    .from("ci_transactions")
    .select(`
      amount,
      transaction_date,
      contact:ci_contacts (
        name
      )
    `)
    .eq("business_id", businessId)
    .eq("type", "income")
    .is("deleted_at", null)

  if (dataInicial) {
    query = query.gte("transaction_date", dataInicial)
  }

  if (dataFinal) {
    query = query.lte("transaction_date", dataFinal)
  }

  const { data, error } = await query

  if (error) {
    console.error("Erro relatório clientes:", error)
    throw error
  }

  const mapa = new Map<string, RelatorioCliente>()

  data?.forEach((item: any) => {
    const nome = item.contact?.name ?? "Sem cliente"
    const dataAtendimento = item.transaction_date ?? null

    if (!mapa.has(nome)) {
      mapa.set(nome, {
        cliente: nome,
        total_pago: 0,
        quantidade_servicos: 0,
        ultimo_atendimento: dataAtendimento,
      })
    }

    const registro = mapa.get(nome)!

    registro.total_pago += Number(item.amount ?? 0)
    registro.quantidade_servicos += 1

    if (
      dataAtendimento &&
      (!registro.ultimo_atendimento ||
        new Date(dataAtendimento) > new Date(registro.ultimo_atendimento))
    ) {
      registro.ultimo_atendimento = dataAtendimento
    }
  })

  return Array.from(mapa.values()).sort((a, b) => b.total_pago - a.total_pago)
}