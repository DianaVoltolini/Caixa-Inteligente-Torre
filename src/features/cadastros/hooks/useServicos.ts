// src/features/cadastros/hooks/useServicos.ts

"use client"

import { useEffect, useState } from "react"
import { useBusiness } from "@/contexts/BusinessContext"

import {
  getServicos,
  createServico,
  updateServico,
  deleteServico
} from "../services/cadastros.service"

function normalize(text: string) {
  return text?.trim().toLowerCase()
}

export function useServicos() {
  const { businessId } = useBusiness()

  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadServicos() {
    if (!businessId) return

    try {
      setLoading(true)

      const data = await getServicos(businessId)

      setServices(data || [])
    } catch (err: any) {
      console.error("Erro carregar serviços", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function existsDuplicate(name: string, ignoreId?: string) {
    const normalized = normalize(name)

    return services.some((s) => {
      if (ignoreId && s.id === ignoreId) return false

      return normalize(s.name) === normalized
    })
  }

  async function handleCreateServico(payload: any) {
    if (!businessId) {
      return { success: false, error: "Empresa não identificada." }
    }

    if (existsDuplicate(payload.name)) {
      return { success: false, error: "Já existe um serviço com esse nome." }
    }

    try {
      const tempId = "temp-" + Date.now()

      const novoServico = {
        ...payload,
        business_id: businessId,
        id: tempId
      }

      setServices((prev) => [novoServico, ...prev])

      await createServico({
        ...payload,
        business_id: businessId
      })

      await loadServicos()

      return { success: true }
    } catch (err: any) {
      console.error("Erro criar serviço", err)
      return { success: false, error: "Erro ao salvar serviço." }
    }
  }

  async function handleUpdateServico(id: string, payload: any) {
    if (existsDuplicate(payload.name, id)) {
      return { success: false, error: "Já existe um serviço com esse nome." }
    }

    try {
      setServices((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, ...payload }
            : item
        )
      )

      await updateServico(id, payload, businessId || undefined)

      await loadServicos()

      return { success: true }
    } catch (err: any) {
      console.error("Erro atualizar serviço", err)
      return { success: false, error: "Erro ao atualizar serviço." }
    }
  }

  async function handleDeleteServico(id: string) {
    if (!businessId) {
      return { success: false, error: "Empresa não identificada." }
    }

    const result = await deleteServico(id, businessId)

    if (!result?.success) {
      return result
    }

    await loadServicos()

    return { success: true }
  }

  useEffect(() => {
    loadServicos()
  }, [businessId])

  return {
    services,
    loading,
    error,

    createServico: handleCreateServico,
    updateServico: handleUpdateServico,
    deleteServico: handleDeleteServico,

    loadServicos
  }
}