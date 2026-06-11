// src/lib/bling/types.ts

export type BlingIntegrationProvider = "bling"

export type BlingIntegrationStatus =
  | "inactive"
  | "active"
  | "expired"
  | "error"

export type BillingPaymentMethod = "boleto" | "pix"

export type BlingSyncStatus = "success" | "error" | "pending"

export interface BlingPlatformIntegration {
  id: string
  provider: BlingIntegrationProvider
  status: BlingIntegrationStatus
  access_token: string | null
  refresh_token: string | null
  token_type: string | null
  expires_at: string | null
  scope: string | null
  account_name: string | null
  account_email: string | null
  external_account_id: string | null
  last_auth_at: string | null
  last_refresh_at: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface BlingTokenResponse {
  access_token: string
  refresh_token: string
  token_type?: string
  expires_in?: number
  scope?: string
}

export type BlingTokenPayload = BlingTokenResponse

export interface BlingRequestLogInput {
  operacao: string
  status: BlingSyncStatus
  erro?: string | null
  requestPayload?: Record<string, unknown> | null
  responsePayload?: Record<string, unknown> | unknown
  businessId?: string | null
  assinaturaId?: string | null
  cobrancaId?: string | null
  metadata?: Record<string, unknown> | null
}

export interface BlingAddressInput {
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  complement?: string | null
}

export interface BlingContactInput {
  name: string
  email?: string | null
  phone?: string | null
  document?: string | null
  personType?: "F" | "J"
  address?: BlingAddressInput | null
}

export interface BlingContactResult {
  id: string
  raw: Record<string, unknown>
}

export interface BlingChargeInput {
  businessId: string
  customerId?: string | null
  subscriptionId?: string | null
  contactId: string
  amount: number
  description: string
  paymentMethod: BillingPaymentMethod
  dueDate?: string
  dueInDays?: number
  documentNumber: string
}

export interface BlingChargeResult {
  id: string
  status?: string | null
  paymentMethod: BillingPaymentMethod
  documentNumber: string
  paymentLink?: string | null
  boletoLink?: string | null
  pixCode?: string | null
  pixQrCode?: string | null
  raw: Record<string, unknown>
}