// src/features/subscription/hooks/useTrialControl.ts

"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAccount } from "@/contexts/AccountContext"

type UseTrialControlResult = {
  loading: boolean
  count: number
  remaining: number
  limit: number
  canCreate: boolean
}

export function useTrialControl(): UseTrialControlResult {
  const supabase = createClient()
  const { business, loading: accountLoading } = useAccount()

  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)

  const LIMIT = 30

  useEffect(() => {
    async function load() {
      if (accountLoading) return

      if (!business?.id) {
        setCount(0)
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        const { count, error } = await supabase
          .from("ci_transactions")
          .select("*", { count: "exact", head: true })
          .eq("business_id", business.id)
          .is("deleted_at", null)

        if (error) {
          console.error("Erro ao contar lançamentos do trial:", error)
          setCount(0)
          return
        }

        setCount(count ?? 0)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [accountLoading, business?.id])

  const canCreate = count < LIMIT
  const remaining = Math.max(0, LIMIT - count)

  return {
    loading,
    count,
    remaining,
    limit: LIMIT,
    canCreate,
  }
}