// src/features/relatorios/hooks/useRelatorioClientes.ts

"use client"

import { useState } from "react"

import {
  getRelatorioClientes,
  RelatorioCliente
} from "../services/getRelatorioClientes"

export function useRelatorioClientes() {

  const [dados, setDados] = useState<RelatorioCliente[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function gerarRelatorioClientes(params: {
    businessId: string
    dataInicial?: string
    dataFinal?: string
  }) {

    try {

      setLoading(true)
      setErro(null)

      const resultado = await getRelatorioClientes(params)

      setDados(resultado)

    } catch (err: any) {

      setErro("Erro ao gerar relatório de clientes")

    } finally {

      setLoading(false)

    }

  }

  return {
    dados,
    loading,
    erro,
    gerarRelatorioClientes
  }

}
