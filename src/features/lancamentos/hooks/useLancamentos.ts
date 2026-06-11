// src/features/lancamentos/hooks/useLancamentos.ts

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useBusiness } from "@/contexts/BusinessContext"
import { createClient } from "@/lib/supabase/client"

export type Transaction = {
  id: string
  type: "income" | "expense"
  amount: number
  description?: string
  transaction_date?: string
  contact?: {
    name?: string
    phone?: string
  }
  category?: {
    name?: string
    is_fixed?: boolean
  }
  services?: {
    service_name: string
    service_price: number
  }[]
}

export function useLancamentos() {
  const { businessId } = useBusiness()
  const supabase = createClient()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTransactions = useCallback(async () => {
    if (!businessId) {
      setTransactions([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("ci_transactions")
        .select(`
          id,
          type,
          amount,
          description,
          transaction_date,
          contact:ci_contacts!ci_transactions_contact_id_fkey(name, phone),
          category:ci_categories!ci_transactions_category_id_fkey(name, is_fixed),
          services:ci_transaction_services(
            service:ci_services(name, price)
          )
        `)
        .eq("business_id", businessId)
        .is("deleted_at", null)
        .order("transaction_date", { ascending: false })

      if (error) throw new Error(error.message)

      const formatted = (data || []).map((t: any) => ({
        ...t,
        services: (t.services || []).map((s: any) => ({
          service_name: s.service?.name || "",
          service_price: s.service?.price || 0,
        })),
      }))

      setTransactions(formatted)
    } catch (error: any) {
      console.error("Erro ao carregar lançamentos:", error)
      setError("Não foi possível carregar os lançamentos")
    } finally {
      setLoading(false)
    }
  }, [businessId, supabase])

  function addTransactionLocal(newTransaction: Transaction) {
    setTransactions((prev) => [newTransaction, ...prev])
  }

  function updateTransactionLocal(updated: Transaction) {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t)),
    )
  }

  function removeTransactionLocal(id: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  useEffect(() => {
    void loadTransactions()
  }, [loadTransactions])

  const resumo = useMemo(() => {
    let receitas = 0
    let despesas = 0

    transactions.forEach((t) => {
      if (t.type === "income") receitas += Number(t.amount || 0)
      if (t.type === "expense") despesas += Number(t.amount || 0)
    })

    return {
      receitas,
      despesas,
      saldo: receitas - despesas,
    }
  }, [transactions])

  return {
    transactions,
    loading,
    error,
    resumo,
    reload: loadTransactions,
    addTransactionLocal,
    updateTransactionLocal,
    removeTransactionLocal,
  }
}