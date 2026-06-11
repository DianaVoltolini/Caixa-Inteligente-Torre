// src/lib/db/transactions.ts

import { createClient } from "@/lib/supabase/client"
import { getLatestSubscriptionSnapshot } from "@/features/subscription/services/subscription.service"

export type Transaction = {
  id: string
  type: "income" | "expense"
  description: string | null
  amount: number
  transaction_date: string | null
  date: string | null
  time: string | null
  contact_id: string | null
  category_id: string | null
  contact: {
    name: string | null
    phone: string | null
  } | null
  category: {
    name: string | null
    is_fixed: boolean | null
  } | null
  services?: {
    service_id: string
    service_name: string
    service_price: number
  }[]
}

type TransactionInput = {
  business_id: string
  type: "income" | "expense"
  description?: string | null
  amount: number
  transaction_date?: string | null
  contact_id?: string | null
  category_id?: string | null
  services?: Array<{
    service_id: string
  }>
}

const TRIAL_MAX_TRANSACTIONS = 30

function normalizeContactId(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null
}

function normalizeCategoryId(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null
}

function nowIso() {
  return new Date().toISOString()
}

async function getSubscriptionSnapshot(businessId: string) {
  if (!businessId) {
    throw new Error("businessId é obrigatório para validar o acesso do plano.")
  }

  return getLatestSubscriptionSnapshot(businessId)
}

function isActivePaidSubscription(status: string) {
  return status === "active" || status === "ativa"
}

function isTrialSubscription(status: string) {
  return status === "trial" || status === "trialing"
}

async function assertCanMutateTransaction(
  businessId: string,
  action: "create" | "edit" | "delete",
) {
  const snapshot = await getSubscriptionSnapshot(businessId)
  const subscription = snapshot.subscription

  if (!subscription) {
    throw new Error(
      "Não encontramos uma assinatura ativa para esta empresa. Seus dados continuam visíveis, mas alterações estão bloqueadas até regularizar o acesso.",
    )
  }

  const status = String(subscription.status || "").toLowerCase()

  if (isActivePaidSubscription(status)) {
    return
  }

  if (!isTrialSubscription(status)) {
    throw new Error(
      "Sua assinatura não está ativa. Seus dados continuam visíveis, mas alterações estão bloqueadas até regularizar o acesso.",
    )
  }

  const trialEnd = subscription.trial_ends_at
    ? new Date(subscription.trial_ends_at)
    : null

  if (!trialEnd || Number.isNaN(trialEnd.getTime())) {
    throw new Error(
      "Seu período de teste não pôde ser validado. Seus dados continuam visíveis, mas alterações estão bloqueadas até ativar seu acesso completo.",
    )
  }

  const now = new Date()

  if (trialEnd.getTime() <= now.getTime()) {
    if (action === "create") {
      throw new Error(
        "Seu período de teste terminou. Seus dados continuam visíveis, mas novos lançamentos estão bloqueados até ativar seu acesso completo.",
      )
    }

    if (action === "edit") {
      throw new Error(
        "Seu período de teste terminou. Seus dados continuam visíveis, mas edições estão bloqueadas até ativar seu acesso completo.",
      )
    }

    throw new Error(
      "Seu período de teste terminou. Seus dados continuam visíveis, mas exclusões estão bloqueadas até ativar seu acesso completo.",
    )
  }

  const maxTransactions = subscription.max_transactions ?? TRIAL_MAX_TRANSACTIONS

  if (snapshot.transactionCount >= maxTransactions) {
    throw new Error(
      "Você atingiu o limite de lançamentos do teste gratuito. Seus dados continuam visíveis, mas alterações estão bloqueadas até ativar seu acesso completo.",
    )
  }
}

export async function getTransactions(
  businessId: string,
): Promise<Transaction[]> {
  if (!businessId) {
    return []
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from("ci_transactions")
    .select(`
      id,
      type,
      description,
      amount,
      transaction_date,
      contact_id,
      category_id,
      ci_contacts (
        name,
        phone
      ),
      ci_categories (
        name,
        is_fixed
      ),
      ci_transaction_services (
        service_id,
        deleted_at,
        ci_services (
          name,
          price
        )
      )
    `)
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .order("transaction_date", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((item: any) => {
    let date: string | null = null
    let time: string | null = null

    if (item.transaction_date) {
      const parts = String(item.transaction_date).split("T")
      date = parts[0]

      if (parts[1]) {
        time = parts[1].substring(0, 5)
      }
    }

    return {
      id: item.id,
      type: item.type,
      description: item.description,
      amount: item.amount,
      transaction_date: item.transaction_date,
      date,
      time,
      contact_id: item.contact_id,
      category_id: item.category_id,
      contact: item.ci_contacts
        ? {
            name: item.ci_contacts.name,
            phone: item.ci_contacts.phone,
          }
        : null,
      category: item.ci_categories
        ? {
            name: item.ci_categories.name,
            is_fixed: item.ci_categories.is_fixed,
          }
        : null,
      services:
        item.ci_transaction_services
          ?.filter((service: any) => !service.deleted_at)
          ?.map((service: any) => ({
            service_id: service.service_id,
            service_name: service.ci_services?.name,
            service_price: service.ci_services?.price,
          })) ?? [],
    }
  })
}

export async function createTransaction(input: TransactionInput) {
  const supabase = createClient()

  const { services, ...transactionData } = input
  const businessId = transactionData.business_id

  if (!businessId) {
    throw new Error("business_id é obrigatório para criar o lançamento.")
  }

  await assertCanMutateTransaction(businessId, "create")

  const safeTransactionData = {
    ...transactionData,
    contact_id: normalizeContactId(transactionData.contact_id),
    category_id: normalizeCategoryId(transactionData.category_id),
    deleted_at: null,
  }

  const { data: transaction, error } = await supabase
    .from("ci_transactions")
    .insert(safeTransactionData)
    .select()
    .single()

  if (error) {
    throw error
  }

  if (services && services.length > 0) {
    const rows = services.map((service) => ({
      business_id: businessId,
      transaction_id: transaction.id,
      service_id: service.service_id,
      deleted_at: null,
    }))

    const { error: servicesError } = await supabase
      .from("ci_transaction_services")
      .insert(rows)

    if (servicesError) {
      throw servicesError
    }
  }

  return transaction
}

export async function updateTransaction(
  id: string,
  businessId: string,
  input: Partial<TransactionInput>,
) {
  if (!id) {
    throw new Error("id é obrigatório para atualizar o lançamento.")
  }

  if (!businessId) {
    throw new Error("businessId é obrigatório para atualizar o lançamento.")
  }

  await assertCanMutateTransaction(businessId, "edit")

  const supabase = createClient()
  const { services, ...transactionData } = input

  const safeTransactionData = {
    ...transactionData,
    business_id: businessId,
    contact_id: normalizeContactId(transactionData.contact_id),
    category_id: normalizeCategoryId(transactionData.category_id),
  }

  const { data, error } = await supabase
    .from("ci_transactions")
    .update(safeTransactionData)
    .eq("id", id)
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .select()
    .single()

  if (error) {
    throw error
  }

  if (services) {
    const { error: softDeleteServicesError } = await supabase
      .from("ci_transaction_services")
      .update({
        deleted_at: nowIso(),
      })
      .eq("transaction_id", id)
      .eq("business_id", businessId)
      .is("deleted_at", null)

    if (softDeleteServicesError) {
      throw softDeleteServicesError
    }

    if (services.length > 0) {
      const rows = services.map((service) => ({
        business_id: businessId,
        transaction_id: id,
        service_id: service.service_id,
        deleted_at: null,
      }))

      const { error: servicesError } = await supabase
        .from("ci_transaction_services")
        .insert(rows)

      if (servicesError) {
        throw servicesError
      }
    }
  }

  return data
}

export async function deleteTransaction(id: string, businessId: string) {
  if (!id) {
    throw new Error("id é obrigatório para excluir o lançamento.")
  }

  if (!businessId) {
    throw new Error("businessId é obrigatório para excluir o lançamento.")
  }

  await assertCanMutateTransaction(businessId, "delete")

  const supabase = createClient()
  const deletedAt = nowIso()

  const { error: servicesError } = await supabase
    .from("ci_transaction_services")
    .update({
      deleted_at: deletedAt,
    })
    .eq("transaction_id", id)
    .eq("business_id", businessId)
    .is("deleted_at", null)

  if (servicesError) {
    throw servicesError
  }

  const { error } = await supabase
    .from("ci_transactions")
    .update({
      deleted_at: deletedAt,
    })
    .eq("id", id)
    .eq("business_id", businessId)
    .is("deleted_at", null)

  if (error) {
    throw error
  }
}