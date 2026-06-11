// src/features/subscription/hooks/useSubscriptionActions.ts

import { useState } from "react"

export function useSubscriptionActions() {
  const [loading, setLoading] = useState(false)

  async function reativar(businessId: string) {
    setLoading(true)

    try {
      const res = await fetch("/api/subscription/reactivate", {
        method: "POST",
        body: JSON.stringify({ businessId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      window.location.href = "/assinaturas/pagamento"
    } catch (err) {
      console.error(err)
      alert("Erro ao reativar assinatura")
    } finally {
      setLoading(false)
    }
  }

  return {
    reativar,
    loading,
  }
}