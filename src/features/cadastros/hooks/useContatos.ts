// src/features/cadastros/hooks/useContatos.ts

"use client"

import { useEffect, useState } from "react"
import { useBusiness } from "@/contexts/BusinessContext"
import {
  getClientes,
  createContato as createContatoService,
  updateContato as updateContatoService,
  deleteContato as deleteContatoService,
} from "../services/cadastros.service"

export type Contato = {
  id: string
  name: string
  phone?: string
  email?: string
  type: "client" | "supplier"
}

type ServiceResult<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

function normalize(value?: string | null) {
  return value?.trim() || null
}

function normalizePhone(value?: string | null) {
  if (!value) return null

  const onlyDigits = value.replace(/\D/g, "")

  return onlyDigits || null
}

function normalizeContactType(value?: string | null) {
  if (value === "cliente") return "client"
  if (value === "fornecedor") return "supplier"
  return value
}

export function useContatos() {
  const { businessId } = useBusiness()

  const [contatos, setContatos] = useState<Contato[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadContatos() {
    if (!businessId) {
      setContatos([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data = await getClientes(businessId)

      setContatos(data || [])
    } catch (error: any) {
      console.error("Erro ao carregar contatos:", error)
      setError(error?.message || "Erro ao carregar contatos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadContatos()
  }, [businessId])

  function existsDuplicatePhone(
    phone: string | null,
    type: "client" | "supplier",
    ignoreId?: string,
  ) {
    const normalizedPhone = normalizePhone(phone)
    const normalizedType = normalizeContactType(type)

    if (!normalizedPhone) return false

    return contatos.some((contato) => {
      const contatoType = normalizeContactType(contato.type)

      if (ignoreId && contato.id === ignoreId) return false
      if (contatoType !== normalizedType) return false

      return normalizePhone(contato.phone) === normalizedPhone
    })
  }

  async function createContato(payload: {
    name: string
    phone?: string
    email?: string
    type: "client" | "supplier"
  }): Promise<ServiceResult> {
    if (!businessId) {
      return { success: false, error: "Empresa não identificada" }
    }

    const contatoPayload = {
      business_id: businessId,
      name: payload.name.trim(),
      phone: normalize(payload.phone),
      email: normalize(payload.email),
      type: payload.type,
    }

    if (existsDuplicatePhone(contatoPayload.phone, contatoPayload.type)) {
      return {
        success: false,
        error:
          contatoPayload.type === "client"
            ? "Já existe uma cliente com esse WhatsApp"
            : "Já existe um fornecedor com esse WhatsApp",
      }
    }

    try {
      const result = await createContatoService(contatoPayload)

      await loadContatos()

      return {
        success: true,
        data: result?.data,
      }
    } catch (error: any) {
      console.error("Erro ao criar contato:", error)

      return {
        success: false,
        error: error?.message || "Não conseguimos salvar esse cadastro",
      }
    }
  }

  async function updateContato(
    id: string,
    payload: {
      name: string
      phone?: string | null
      email?: string | null
      type: "client" | "supplier"
    },
  ): Promise<ServiceResult> {
    if (!businessId) {
      return { success: false, error: "Empresa não identificada" }
    }

    try {
      setError(null)

      const contatoPayload = {
        name: payload.name.trim(),
        phone: normalize(payload.phone),
        email: normalize(payload.email),
        type: payload.type,
      }

      const contatoAnterior = contatos.find((item) => item.id === id)

      if (!contatoAnterior) {
        return { success: false, error: "Cadastro não encontrado para edição" }
      }

      if (existsDuplicatePhone(contatoPayload.phone, contatoPayload.type, id)) {
        return {
          success: false,
          error:
            contatoPayload.type === "client"
              ? "Já existe uma cliente com esse WhatsApp"
              : "Já existe um fornecedor com esse WhatsApp",
        }
      }

      setContatos((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                ...contatoPayload,
              }
            : item,
        ),
      )

      const result = (await updateContatoService(
        id,
        businessId,
        contatoPayload,
      )) as ServiceResult

      if (!result?.success) {
        throw new Error(result?.error || "Não conseguimos salvar essa alteração")
      }

      await loadContatos()

      return { success: true }
    } catch (error: any) {
      console.error("Erro ao atualizar contato:", error)

      await loadContatos()

      return {
        success: false,
        error: error?.message || "Não conseguimos atualizar esse cadastro",
      }
    }
  }

  async function deleteContato(id: string): Promise<ServiceResult> {
    if (!businessId) {
      return { success: false, error: "Empresa não identificada" }
    }

    const result = (await deleteContatoService(id, businessId)) as ServiceResult

    if (!result?.success) {
      return result
    }

    await loadContatos()

    return { success: true }
  }

  return {
    contatos,
    loading,
    error,
    createContato,
    updateContato,
    deleteContato,
    refetch: loadContatos,
  }
}