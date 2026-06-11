// src/features/torre-controle/hooks/useMasterUsers.ts

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  getMasterUsers,
  type MasterUserRow,
} from "@/features/torre-controle/services/master-users.service"

type UseMasterUsersResult = {
  users: MasterUserRow[]
  loading: boolean
  saving: boolean
  error: string | null
  search: string
  status: string
  setSearch: (value: string) => void
  setStatus: (value: string) => void
  reload: () => Promise<void>
  createUser: () => Promise<{ success: boolean; error?: string }>
  summary: {
    total: number
    trial: number
    aguardandoPagamento: number
    cancelados: number
    aguardandoCancelamentoManual: number
  }
}

export function useMasterUsers(): UseMasterUsersResult {
  const [users, setUsers] = useState<MasterUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("todos")

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await getMasterUsers({
        search,
        status,
      })

      setUsers(data)
    } catch (loadError: any) {
      console.error(loadError)
      setError(
        loadError?.message || "Não consegui carregar a Central de clientes."
      )
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    void load()
  }, [load])

  const createUser = useCallback(async () => {
    return {
      success: false,
      error:
        "Clientes são criados pelo cadastro do SaaS. A Torre apenas acompanha a operação.",
    }
  }, [])

  const summary = useMemo(() => {
    return {
      total: users.length,
      trial: users.filter((user) => user.assinatura_status === "trialing")
        .length,
      aguardandoPagamento: users.filter(
        (user) => user.assinatura_status === "awaiting_payment"
      ).length,
      cancelados: users.filter((user) => user.assinatura_status === "canceled")
        .length,
      aguardandoCancelamentoManual: users.filter(
        (user) =>
          user.alerta_financeiro === "aguardando_cancelamento_manual"
      ).length,
    }
  }, [users])

  return {
    users,
    loading,
    saving,
    error,
    search,
    status,
    setSearch,
    setStatus,
    reload: load,
    createUser,
    summary,
  }
}