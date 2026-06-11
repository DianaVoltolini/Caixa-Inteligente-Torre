// src/features/cadastros/hooks/useCategorias.ts

"use client"

import { useEffect, useState } from "react"
import { useBusiness } from "@/contexts/BusinessContext"

import {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria
} from "../services/cadastros.service"

function normalize(text: string) {
  return text?.trim().toLowerCase()
}

export function useCategorias() {
  const { businessId } = useBusiness()

  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadCategorias() {
    if (!businessId) return

    try {
      setLoading(true)

      const data = await getCategorias(businessId)

      setCategories(data || [])
    } catch (err: any) {
      console.error("Erro carregar categorias", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function existsDuplicate(name: string, ignoreId?: string) {
    const normalized = normalize(name)

    return categories.some((cat) => {
      if (ignoreId && cat.id === ignoreId) return false

      return normalize(cat.name) === normalized
    })
  }

  async function handleCreateCategoria(payload: any) {
    if (!businessId) {
      return { success: false, error: "Empresa não identificada." }
    }

    if (existsDuplicate(payload.name)) {
      return { success: false, error: "Já existe uma categoria com esse nome." }
    }

    try {
      const tempId = "temp-" + Date.now()

      const novaCategoria = {
        ...payload,
        business_id: businessId,
        id: tempId
      }

      setCategories((prev) => [novaCategoria, ...prev])

      await createCategoria({
        ...payload,
        business_id: businessId
      })

      await loadCategorias()

      return { success: true }
    } catch (err: any) {
      console.error("Erro criar categoria", err)
      return { success: false, error: "Erro ao salvar categoria." }
    }
  }

  async function handleUpdateCategoria(id: string, payload: any) {
    if (existsDuplicate(payload.name, id)) {
      return { success: false, error: "Já existe uma categoria com esse nome." }
    }

    try {
      setCategories((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, ...payload }
            : item
        )
      )

      await updateCategoria(id, payload, businessId || undefined)

      await loadCategorias()

      return { success: true }
    } catch (err: any) {
      console.error("Erro atualizar categoria", err)
      return { success: false, error: "Erro ao atualizar categoria." }
    }
  }

  async function handleDeleteCategoria(id: string) {
    if (!businessId) {
      return { success: false, error: "Empresa não identificada." }
    }

    const result = await deleteCategoria(id, businessId)

    if (!result?.success) {
      return result
    }

    await loadCategorias()

    return { success: true }
  }

  useEffect(() => {
    loadCategorias()
  }, [businessId])

  return {
    categories,
    loading,
    error,

    createCategoria: handleCreateCategoria,
    updateCategoria: handleUpdateCategoria,
    deleteCategoria: handleDeleteCategoria,

    loadCategorias
  }
}