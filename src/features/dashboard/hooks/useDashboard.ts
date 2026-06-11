// src/features/dashboard/hooks/useDashboard.ts

"use client"

import { useEffect, useState } from "react"
import { useBusiness } from "@/contexts/BusinessContext"

import {
  fetchDashboardTransactions,
  fetchDashboardGoal,
  saveDashboardGoal,
} from "../services/dashboard.service"

import { calculateDashboardMetrics } from "../domain/dashboard.metrics"

function getMonthStart(baseDate: Date) {
  return new Date(baseDate.getFullYear(), baseDate.getMonth(), 1).toISOString()
}

export function useDashboard() {
  const { businessId, loading: businessLoading } = useBusiness()

  const [revenue, setRevenue] = useState(0)
  const [expense, setExpense] = useState(0)
  const [goalCents, setGoalCents] = useState(0)
  const [animatedScore, setAnimatedScore] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (businessLoading) return

    if (!businessId) {
      setLoading(false)
      return
    }

    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        const now = new Date()

        const currentMonthStart = getMonthStart(now)
        const previousMonthStart = getMonthStart(
          new Date(now.getFullYear(), now.getMonth() - 1, 1),
        )

        let transactions = await fetchDashboardTransactions(
          businessId,
          currentMonthStart,
        )

        if (!transactions.length) {
          transactions = await fetchDashboardTransactions(
            businessId,
            previousMonthStart,
          )
        }

        const goal = await fetchDashboardGoal(businessId)

        let totalRevenue = 0
        let totalExpense = 0

        transactions.forEach((t: any) => {
          if (t.type === "income") totalRevenue += Number(t.amount)
          if (t.type === "expense") totalExpense += Number(t.amount)
        })

        const target = goal?.target_amount ?? 0

        setGoalCents(Math.round(target * 100))
        setRevenue(totalRevenue)
        setExpense(totalExpense)
      } catch (err: any) {
        console.error("Erro dashboard:", err?.message || err)
        setError("Não foi possível carregar os dados financeiros.")
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [businessId, businessLoading])

  useEffect(() => {
    if (!businessId) return
    if (goalCents === 0) return

    const timeout = setTimeout(async () => {
      try {
        await saveDashboardGoal(businessId, goalCents)
      } catch (err: any) {
        console.error("Erro ao salvar meta:", err?.message || err)
      }
    }, 400)

    return () => clearTimeout(timeout)
  }, [goalCents, businessId])

  function handleGoalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const onlyNumbers = e.target.value.replace(/\D/g, "")
    setGoalCents(Number(onlyNumbers))
  }

  const goal = goalCents / 100

  const {
    profit,
    percentualMeta,
    falta,
    mediaAtual,
    mediaNecessaria,
    semanalNecessario,
    percentualDespesa,
    lucroPercentual,
    alerta,
    healthScore,
  } = calculateDashboardMetrics(revenue, expense, goal)

  useEffect(() => {
    let current = 0

    const interval = setInterval(() => {
      current += 2

      if (current >= healthScore) {
        setAnimatedScore(healthScore)
        clearInterval(interval)
      } else {
        setAnimatedScore(current)
      }
    }, 15)

    return () => clearInterval(interval)
  }, [healthScore])

  return {
    loading,
    error,
    revenue,
    expense,
    goalCents,
    animatedScore,
    profit,
    percentualMeta,
    falta,
    mediaAtual,
    mediaNecessaria,
    semanalNecessario,
    percentualDespesa,
    lucroPercentual,
    alerta,
    handleGoalChange,
  }
}