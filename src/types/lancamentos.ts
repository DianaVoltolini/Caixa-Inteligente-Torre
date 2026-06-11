// src/types/lancamentos.ts

export type TransactionType = "income" | "expense"

export interface Transaction {
  id: string
  business_id: string
  type: TransactionType

  transaction_date: string

  amount: number

  description: string | null

  contact_id: string | null
  category_id: string | null

  created_at: string
}

export interface TransactionService {
  id: string
  business_id: string

  transaction_id: string

  service_id: string

  qty: number

  service_price: number

  service_name: string
}

/**
 * 🔥 NOVO: Tipo composto usado no Dashboard
 */
export interface TransactionWithServices extends Transaction {
  services?: TransactionService[]
}

export interface ServicoSelecionado {
  service_id: string
  service_name: string
  service_price: number
  qty: number
}

export interface LancamentoReceitaInput {
  transaction_date: string

  contact_id: string

  services: ServicoSelecionado[]

  total_services: number

  amount: number

  description?: string
}

export interface LancamentoDespesaInput {
  transaction_date: string

  contact_id: string

  category_id: string

  amount: number

  description?: string
}