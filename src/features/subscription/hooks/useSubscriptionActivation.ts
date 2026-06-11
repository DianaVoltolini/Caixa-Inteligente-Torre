// src/features/subscription/hooks/useSubscriptionActivation.ts

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { useBusiness } from "@/contexts/BusinessContext"

type PaymentMethod = "pix" | "boleto"
type DiaVencimento = 8 | 16 | 25

type ActivationData = {
  subscriptionId: string | null
  plano: string
  valor: number
  paymentMethod: PaymentMethod | ""
  diaVencimento: DiaVencimento | ""
  status: string | null
}

type SavePreferencesResponse = {
  success: boolean
  error?: string
  subscription?: {
    id: string
    payment_method?: PaymentMethod | null
    dia_vencimento?: DiaVencimento | null
    plano?: string | null
    valor?: number | null
    status?: string | null
  }
}

type CreateChargeResponse = {
  success: boolean
  error?: string
  subscriptionId?: string
  paymentLink?: string | null
  boletoLink?: string | null
  pixCode?: string | null
  pixQrCode?: string | null
  paymentMethod?: PaymentMethod
  status?: string | null
  localCharge?: {
    id: string
  } | null
}

const PLAN_NAME = "Plano Lucro Real"
const PLAN_VALUE = 29.9

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Erro desconhecido."
}

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === "pix" || value === "boleto"
}

function isDiaVencimento(value: unknown): value is DiaVencimento {
  return value === 8 || value === 16 || value === 25
}

export function useSubscriptionActivation() {
  const { businessId } = useBusiness()

  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  const [planoAtual, setPlanoAtual] = useState(PLAN_NAME)
  const [valorAtual, setValorAtual] = useState(PLAN_VALUE)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix")
  const [diaVencimento, setDiaVencimento] = useState<DiaVencimento>(8)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creatingCharge, setCreatingCharge] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const valorFormatado = useMemo(
    () => formatCurrency(valorAtual),
    [valorAtual],
  )

  const loadActivationData = useCallback(async () => {
    if (!businessId) {
      setLoading(false)
      setError("Empresa não encontrada para ativação da assinatura.")
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(
        `/api/subscription/activation-data?businessId=${businessId}`,
        {
          method: "GET",
          cache: "no-store",
        },
      )

      const data = (await response.json()) as {
        success: boolean
        error?: string
        activation?: ActivationData
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Não foi possível carregar a ativação.")
      }

      const activation = data.activation

      setSubscriptionId(activation?.subscriptionId ?? null)
      setPlanoAtual(activation?.plano || PLAN_NAME)
      setValorAtual(Number(activation?.valor ?? PLAN_VALUE))

      if (isPaymentMethod(activation?.paymentMethod)) {
        setPaymentMethod(activation.paymentMethod)
      }

      if (isDiaVencimento(activation?.diaVencimento)) {
        setDiaVencimento(activation.diaVencimento)
      }
    } catch (error) {
      setError(getErrorMessage(error))
      setPlanoAtual(PLAN_NAME)
      setValorAtual(PLAN_VALUE)
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    void loadActivationData()
  }, [loadActivationData])

  async function savePreferences() {
    if (!businessId) {
      setError("Empresa não encontrada para salvar as preferências.")
      return null
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch("/api/subscription/save-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          subscriptionId,
          paymentMethod,
          diaVencimento,
        }),
      })

      const data = (await response.json()) as SavePreferencesResponse

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Não foi possível salvar as preferências.")
      }

      if (data.subscription?.id) {
        setSubscriptionId(data.subscription.id)
      }

      setPlanoAtual(data.subscription?.plano || PLAN_NAME)
      setValorAtual(Number(data.subscription?.valor ?? PLAN_VALUE))

      setMessage("Preferências salvas com sucesso.")

      return data.subscription ?? null
    } catch (error) {
      setError(getErrorMessage(error))
      return null
    } finally {
      setSaving(false)
    }
  }

  async function createCharge() {
    if (!businessId) {
      setError("Empresa não encontrada para gerar a cobrança.")
      return null
    }

    setCreatingCharge(true)
    setError(null)
    setMessage(null)

    try {
      const savedSubscription = await savePreferences()

      const finalSubscriptionId =
        savedSubscription?.id ??
        subscriptionId

      const response = await fetch("/api/subscription/create-charge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          subscriptionId: finalSubscriptionId,
          paymentMethod,
        }),
      })

      const data = (await response.json()) as CreateChargeResponse

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Não foi possível gerar a cobrança.")
      }

      if (data.subscriptionId) {
        setSubscriptionId(data.subscriptionId)
      }

      setMessage("Cobrança gerada com sucesso.")

      return data
    } catch (error) {
      setError(getErrorMessage(error))
      return null
    } finally {
      setCreatingCharge(false)
    }
  }

  return {
    businessId,
    subscriptionId,
    planoAtual,
    valorAtual,
    valorFormatado,
    paymentMethod,
    diaVencimento,
    loading,
    saving,
    creatingCharge,
    error,
    message,
    setPaymentMethod,
    setDiaVencimento,
    reload: loadActivationData,
    savePreferences,
    createCharge,
  }
}