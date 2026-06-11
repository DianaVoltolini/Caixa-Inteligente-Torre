// src/features/analytics/hooks/useAnalytics.ts

"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { getAnalyticsData } from "@/features/analytics/services/analytics.service"
import { useAccount } from "@/contexts/AccountContext"

type Alerta = {
  titulo: string
  texto: string
}

type AnalyticsData = {
  receitas: number
  despesas: number
  lucro: number
  ticketMedio: number
  margemLucro: number
  diagnosticoTitulo: string
  diagnosticoTexto: string
  alertas: Alerta[]
  hasData: boolean
}

export function useAnalytics() {
  const { business, loading: accountLoading } = useAccount()

  const businessId = business?.id || null
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [receitas, setReceitas] = useState(0)
  const [despesas, setDespesas] = useState(0)
  const [lucro, setLucro] = useState(0)
  const [ticketMedio, setTicketMedio] = useState(0)
  const [margemLucro, setMargemLucro] = useState(0)
  const [diagnosticoTitulo, setDiagnosticoTitulo] = useState("")
  const [diagnosticoTexto, setDiagnosticoTexto] = useState("")
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [hasData, setHasData] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const resetValues = useCallback(() => {
    setReceitas(0)
    setDespesas(0)
    setLucro(0)
    setTicketMedio(0)
    setMargemLucro(0)
    setDiagnosticoTitulo("")
    setDiagnosticoTexto("")
    setAlertas([])
    setHasData(false)
  }, [])

  const loadAnalytics = useCallback(async () => {
    if (!businessId) {
      resetValues()
      setError("Empresa não carregada.")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data: AnalyticsData = await getAnalyticsData(businessId)

      setReceitas(data.receitas)
      setDespesas(data.despesas)
      setLucro(data.lucro)
      setTicketMedio(data.ticketMedio)
      setMargemLucro(data.margemLucro)
      setDiagnosticoTitulo(data.diagnosticoTitulo)
      setDiagnosticoTexto(data.diagnosticoTexto)
      setAlertas(data.alertas)
      setHasData(data.hasData)
    } catch (err) {
      console.error("Erro ao carregar analytics", err)

      resetValues()
      setError("Erro ao carregar analytics.")
    } finally {
      setLoading(false)
    }
  }, [businessId, resetValues])

  useEffect(() => {
    if (!accountLoading) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      loadAnalytics()
      return
    }

    setLoading(true)

    timeoutRef.current = setTimeout(() => {
      setLoading(false)
      setError("A conta demorou mais do que o esperado para carregar.")
    }, 4000)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [accountLoading, loadAnalytics])

  return {
    receitas,
    despesas,
    lucro,
    ticketMedio,
    margemLucro,
    diagnosticoTitulo,
    diagnosticoTexto,
    alertas,
    hasData,
    loading,
    error,
    refresh: loadAnalytics,
  }
}