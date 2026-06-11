// src/features/relatorios/hooks/useRelatorio.ts

"use client"

import { useCallback, useRef, useState } from "react"

import {
  buscarRelatorio,
  type RelatorioFiltros
} from "../services/relatorio.service"

type TipoRelatorio =
  | "fluxo"
  | "servicos"
  | "categorias"
  | "clientes"
  | "fornecedores"
  | "financeiro"

function getCacheKey(filtros: RelatorioFiltros) {
  return [
    filtros.businessId ?? "",
    filtros.dataInicial ?? "",
    filtros.dataFinal ?? "",
    filtros.tipo ?? "all",
    filtros.tipoRelatorio ?? "fluxo"
  ].join("|")
}

export function useRelatorio() {
  const [dados, setDados] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const cacheRef = useRef<Map<string, any[]>>(new Map())

  const gerarRelatorio = useCallback(async (filtros: RelatorioFiltros) => {
    const cacheKey = getCacheKey(filtros)
    const cache = cacheRef.current.get(cacheKey)

    if (cache) {
      setErro(null)
      setDados(cache)
      setLoading(false)
      return cache
    }

    try {
      setLoading(true)
      setErro(null)

      const resultado = await buscarRelatorio(filtros)
      const dadosTratados = Array.isArray(resultado) ? resultado : []

      cacheRef.current.set(cacheKey, dadosTratados)
      setDados(dadosTratados)

      return dadosTratados
    } catch (err) {
      console.error(err)
      setErro("Não foi possível gerar o relatório.")
      setDados([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const prefetchRelatorios = useCallback(
    async (params: {
      businessId: string
      dataInicial?: string
      dataFinal?: string
      tipo?: "all" | "receita" | "despesa"
    }) => {
      const tipos: TipoRelatorio[] = [
        "fluxo",
        "servicos",
        "categorias",
        "clientes",
        "fornecedores"
      ]

      await Promise.all(
        tipos.map(async (tipoRelatorio) => {
          const filtros: RelatorioFiltros = {
            businessId: params.businessId,
            dataInicial: params.dataInicial,
            dataFinal: params.dataFinal,
            tipo: params.tipo ?? "all",
            tipoRelatorio
          }

          const cacheKey = getCacheKey(filtros)

          if (cacheRef.current.has(cacheKey)) {
            return
          }

          try {
            const resultado = await buscarRelatorio(filtros)
            cacheRef.current.set(
              cacheKey,
              Array.isArray(resultado) ? resultado : []
            )
          } catch (err) {
            console.error(err)
          }
        })
      )
    },
    []
  )

  const limparCache = useCallback(() => {
    cacheRef.current.clear()
  }, [])

  return {
    dados,
    loading,
    erro,
    gerarRelatorio,
    prefetchRelatorios,
    limparCache
  }
}