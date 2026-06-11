// src/features/subscription/hooks/useSubscription.ts

"use client"

import { useCallback, useEffect, useState } from "react"

type SubscriptionSnapshotResponse = {
  success?: boolean
  subscription?: any | null
  transactionCount?: number
  transactionsCount?: number
  count?: number
  data?: {
    subscription?: any | null
    transactionCount?: number
    transactionsCount?: number
    count?: number
  }
  error?: string
}

type UseSubscriptionResult = {
  subscription: any | null
  transactionCount: number
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

async function getSubscriptionSnapshotFromApi(
  businessId: string,
  signal?: AbortSignal,
): Promise<{
  subscription: any | null
  transactionCount: number
}> {
  const response = await fetch(
    `/api/subscription/snapshot?businessId=${encodeURIComponent(businessId)}`,
    {
      method: "GET",
      cache: "no-store",
      signal,
    },
  )

  let result: SubscriptionSnapshotResponse | null = null

  try {
    result = (await response.json()) as SubscriptionSnapshotResponse
  } catch {
    result = null
  }

  if (!response.ok) {
    throw new Error(
      result?.error ||
        `Não foi possível carregar a assinatura. Código: ${response.status}`,
    )
  }

  const subscription =
    result?.subscription ??
    result?.data?.subscription ??
    null

  const transactionCount = Number(
    result?.transactionCount ??
      result?.transactionsCount ??
      result?.count ??
      result?.data?.transactionCount ??
      result?.data?.transactionsCount ??
      result?.data?.count ??
      0,
  )

  return {
    subscription,
    transactionCount: Number.isFinite(transactionCount) ? transactionCount : 0,
  }
}

export function useSubscription(businessId?: string | null): UseSubscriptionResult {
  const [subscription, setSubscription] = useState<any | null>(null)
  const [transactionCount, setTransactionCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!businessId) {
        setSubscription(null)
        setTransactionCount(0)
        setError(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const snapshot = await getSubscriptionSnapshotFromApi(
          businessId,
          signal,
        )

        if (signal?.aborted) return

        setSubscription(snapshot.subscription)
        setTransactionCount(snapshot.transactionCount)
      } catch (loadError: any) {
        if (signal?.aborted) return

        setSubscription(null)
        setTransactionCount(0)
        setError(
          loadError?.message ||
            "Não foi possível carregar as informações da assinatura agora.",
        )
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [businessId],
  )

  useEffect(() => {
    const controller = new AbortController()

    void load(controller.signal)

    return () => {
      controller.abort()
    }
  }, [load])

  const reload = useCallback(async () => {
    await load()
  }, [load])

  return {
    subscription,
    transactionCount,
    loading,
    error,
    reload,
  }
}