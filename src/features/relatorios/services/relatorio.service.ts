// src/features/relatorios/services/relatorio.service.ts

import { createClient } from "@/lib/supabase/client"

export type RelatorioFiltros = {
  businessId: string
  dataInicial?: string
  dataFinal?: string
  tipo?: "all" | "receita" | "despesa"
  tipoRelatorio?:
    | "financeiro"
    | "clientes"
    | "servicos"
    | "fluxo"
    | "fornecedores"
    | "categorias"
}

type TransactionRow = {
  id: string
  business_id: string
  type: "income" | "expense"
  amount: number | string | null
  description: string | null
  transaction_date: string | null
  contact_id?: string | null
  category_id?: string | null
}

type ContactRow = {
  id: string
  name: string
}

type CategoryRow = {
  id: string
  name: string
}

type TransactionServiceRow = {
  transaction_id: string
  service_id: string
}

type ServiceRow = {
  id: string
  name: string
  price?: number | string | null
}

type ServiceItem = {
  service_name: string
  service_price: number
}

export async function buscarRelatorio(filtros: RelatorioFiltros) {
  const supabase = createClient()

  const {
    businessId,
    dataInicial,
    dataFinal,
    tipo,
    tipoRelatorio,
  } = filtros

  try {
    let query = supabase
      .from("ci_transactions")
      .select(`
        id,
        business_id,
        type,
        amount,
        description,
        transaction_date,
        contact_id,
        category_id
      `)
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .order("transaction_date", { ascending: false })

    if (dataInicial) {
      query = query.gte("transaction_date", `${dataInicial}T00:00:00`)
    }

    if (dataFinal) {
      query = query.lte("transaction_date", `${dataFinal}T23:59:59`)
    }

    const { data: transactions, error: transactionsError } = await query

    if (transactionsError) {
      throw transactionsError
    }

    const listaBase: TransactionRow[] =
      (transactions ?? []) as TransactionRow[]

    const contactIds = Array.from(
      new Set(listaBase.map((item) => item.contact_id).filter(Boolean)),
    ) as string[]

    let contatosMap = new Map<string, ContactRow>()

    if (contactIds.length > 0) {
      const { data: contatos, error: contatosError } = await supabase
        .from("ci_contacts")
        .select("id, name")
        .in("id", contactIds)
        .eq("business_id", businessId)
        .is("deleted_at", null)

      if (contatosError) {
        throw contatosError
      }

      contatosMap = new Map(
        ((contatos ?? []) as ContactRow[]).map((contato) => [
          contato.id,
          contato,
        ]),
      )
    }

    const categoryIds = Array.from(
      new Set(listaBase.map((item) => item.category_id).filter(Boolean)),
    ) as string[]

    let categoriasMap = new Map<string, CategoryRow>()

    if (categoryIds.length > 0) {
      const { data: categorias, error: categoriasError } = await supabase
        .from("ci_categories")
        .select("id, name")
        .in("id", categoryIds)
        .eq("business_id", businessId)
        .is("deleted_at", null)

      if (categoriasError) {
        throw categoriasError
      }

      categoriasMap = new Map(
        ((categorias ?? []) as CategoryRow[]).map((categoria) => [
          categoria.id,
          categoria,
        ]),
      )
    }

    const transactionIds = listaBase.map((item) => item.id)
    const transactionServicesMap = new Map<string, ServiceItem[]>()

    if (transactionIds.length > 0) {
      const {
        data: transacaoServicos,
        error: transacaoServicosError,
      } = await supabase
        .from("ci_transaction_services")
        .select("transaction_id, service_id")
        .in("transaction_id", transactionIds)
        .is("deleted_at", null)

      if (transacaoServicosError) {
        throw transacaoServicosError
      }

      const relacoes =
        (transacaoServicos ?? []) as TransactionServiceRow[]

      const serviceIds = Array.from(
        new Set(relacoes.map((item) => item.service_id).filter(Boolean)),
      ) as string[]

      let servicesMap = new Map<string, ServiceRow>()

      if (serviceIds.length > 0) {
        const { data: servicos, error: servicosError } = await supabase
          .from("ci_services")
          .select("id, name, price")
          .in("id", serviceIds)
          .eq("business_id", businessId)
          .is("deleted_at", null)

        if (servicosError) {
          throw servicosError
        }

        servicesMap = new Map(
          ((servicos ?? []) as ServiceRow[]).map((servico) => [
            servico.id,
            servico,
          ]),
        )
      }

      relacoes.forEach((relacao) => {
        const servico = servicesMap.get(relacao.service_id)

        if (!transactionServicesMap.has(relacao.transaction_id)) {
          transactionServicesMap.set(relacao.transaction_id, [])
        }

        transactionServicesMap.get(relacao.transaction_id)!.push({
          service_name: servico?.name ?? "Sem serviço",
          service_price: Number(servico?.price ?? 0),
        })
      })
    }

    const lista = listaBase.map((item) => ({
      ...item,
      amount: Number(item.amount ?? 0),
      contact: item.contact_id
        ? contatosMap.get(item.contact_id) ?? null
        : null,
      category: item.category_id
        ? categoriasMap.get(item.category_id) ?? null
        : null,
      services: transactionServicesMap.get(item.id) ?? [],
    }))

    if (tipoRelatorio === "clientes") {
      const mapa = new Map<
        string,
        {
          cliente: string
          total_pago: number
          atendimentos: {
            data: string | null
            servicos: string[]
          }[]
        }
      >()

      lista
        .filter((t) => t.type === "income")
        .forEach((t) => {
          const nomeCliente = t.contact?.name ?? "Sem cliente"
          const dataAtendimento = t.transaction_date
            ? t.transaction_date.substring(0, 10)
            : null

          const servicosRelacionados = Array.isArray(t.services)
            ? t.services
                .map((servico) => servico?.service_name)
                .filter((nome): nome is string => Boolean(nome))
            : []

          const servicosDoAtendimento =
            servicosRelacionados.length > 0
              ? servicosRelacionados
              : t.description
                ? [t.description]
                : []

          if (!mapa.has(nomeCliente)) {
            mapa.set(nomeCliente, {
              cliente: nomeCliente,
              total_pago: 0,
              atendimentos: [],
            })
          }

          const registro = mapa.get(nomeCliente)!

          registro.total_pago += Number(t.amount ?? 0)

          registro.atendimentos.push({
            data: dataAtendimento,
            servicos: servicosDoAtendimento,
          })
        })

      return Array.from(mapa.values())
        .map((item) => ({
          ...item,
          atendimentos: item.atendimentos.sort((a, b) => {
            const dataA = a.data ? new Date(a.data).getTime() : 0
            const dataB = b.data ? new Date(b.data).getTime() : 0
            return dataB - dataA
          }),
        }))
        .sort((a, b) => b.total_pago - a.total_pago)
    }

    if (tipoRelatorio === "servicos") {
      const mapa = new Map<
        string,
        {
          servico: string
          quantidade: number
          total_valor: number
        }
      >()

      lista
        .filter((t) => t.type === "income")
        .forEach((t) => {
          const servicos = t.services ?? []

          servicos.forEach((s) => {
            const nome = s.service_name ?? "Sem serviço"

            if (!mapa.has(nome)) {
              mapa.set(nome, {
                servico: nome,
                quantidade: 0,
                total_valor: 0,
              })
            }

            const registro = mapa.get(nome)!

            registro.quantidade += 1
            registro.total_valor += Number(s.service_price ?? 0)
          })
        })

      return Array.from(mapa.values())
        .map((item) => ({
          ...item,
          ticket_medio:
            item.quantidade > 0
              ? item.total_valor / item.quantidade
              : 0,
        }))
        .sort((a, b) => b.total_valor - a.total_valor)
    }

    if (tipoRelatorio === "categorias") {
      const mapa = new Map<
        string,
        {
          categoria: string
          quantidade: number
          total: number
          media: number
        }
      >()

      lista
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const nome = t.category?.name ?? "Sem categoria"

          if (!mapa.has(nome)) {
            mapa.set(nome, {
              categoria: nome,
              quantidade: 0,
              total: 0,
              media: 0,
            })
          }

          const registro = mapa.get(nome)!

          registro.quantidade += 1
          registro.total += Number(t.amount ?? 0)
        })

      return Array.from(mapa.values())
        .map((item) => ({
          ...item,
          media: item.quantidade > 0 ? item.total / item.quantidade : 0,
        }))
        .sort((a, b) => b.total - a.total)
    }

    if (tipoRelatorio === "fornecedores") {
      const mapa = new Map<
        string,
        {
          fornecedor: string
          total: number
          movimentos: {
            data: string | null
            categoria: string
          }[]
        }
      >()

      lista
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const nomeFornecedor = t.contact?.name ?? "Sem fornecedor"
          const dataMovimento = t.transaction_date
            ? t.transaction_date.substring(0, 10)
            : null
          const categoriaMovimento = t.category?.name ?? "Sem categoria"

          if (!mapa.has(nomeFornecedor)) {
            mapa.set(nomeFornecedor, {
              fornecedor: nomeFornecedor,
              total: 0,
              movimentos: [],
            })
          }

          const registro = mapa.get(nomeFornecedor)!

          registro.total += Number(t.amount ?? 0)
          registro.movimentos.push({
            data: dataMovimento,
            categoria: categoriaMovimento,
          })
        })

      return Array.from(mapa.values())
        .map((item) => ({
          ...item,
          movimentos: item.movimentos.sort((a, b) => {
            const dataA = a.data ? new Date(a.data).getTime() : 0
            const dataB = b.data ? new Date(b.data).getTime() : 0
            return dataB - dataA
          }),
        }))
        .sort((a, b) => b.total - a.total)
    }

    if (tipoRelatorio === "fluxo") {
      const mapa = new Map<
        string,
        {
          data: string
          receitas: number
          despesas: number
          saldo: number
        }
      >()

      lista.forEach((t) => {
        const data = t.transaction_date?.substring(0, 10)

        if (!data) return

        if (!mapa.has(data)) {
          mapa.set(data, {
            data,
            receitas: 0,
            despesas: 0,
            saldo: 0,
          })
        }

        const registro = mapa.get(data)!

        if (t.type === "income") {
          registro.receitas += Number(t.amount ?? 0)
        }

        if (t.type === "expense") {
          registro.despesas += Number(t.amount ?? 0)
        }

        registro.saldo = registro.receitas - registro.despesas
      })

      return Array.from(mapa.values()).sort(
        (a, b) =>
          new Date(a.data).getTime() - new Date(b.data).getTime(),
      )
    }

    let resultado = [...lista]

    if (tipo === "receita") {
      resultado = resultado.filter((t) => t.type === "income")
    }

    if (tipo === "despesa") {
      resultado = resultado.filter((t) => t.type === "expense")
    }

    return resultado.sort(
      (a, b) =>
        new Date(b.transaction_date ?? 0).getTime() -
        new Date(a.transaction_date ?? 0).getTime(),
    )
  } catch (err: any) {
    console.error("Erro ao buscar relatório:", err?.message || err)
    throw new Error(err?.message || "Erro ao buscar relatório")
  }
}