// src/lib/bling/charge.service.ts

import { blingRequest } from "./client"
import {
  BillingPaymentMethod,
  BlingChargeInput,
  BlingChargeResult,
} from "./types"

interface BlingChargeCreateResponse {
  data?: {
    id: number | string
  }
}

interface BlingChargeDetailsResponse {
  data?: Record<string, unknown>
}

const BLING_PAYMENT_METHOD_IDS: Record<BillingPaymentMethod, number> = {
  boleto: 4525123,
  pix: 4525124,
}

const BLING_FINANCIAL_ACCOUNT_ID = 14889368964
const BLING_REVENUE_CATEGORY_ID = 14659751263

function formatDateISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function addDays(baseDate: Date, days: number): Date {
  const date = new Date(baseDate)
  date.setDate(date.getDate() + days)
  return date
}

function buildDueDate(inputDueDate?: string, dueInDays = 10): string {
  if (inputDueDate) return inputDueDate
  return formatDateISO(addDays(new Date(), dueInDays))
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") return null

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function extractStatus(data: Record<string, unknown>): string | null {
  const status = data.situacao

  if (
    typeof status === "string" ||
    typeof status === "number" ||
    typeof status === "boolean"
  ) {
    return String(status)
  }

  return null
}

function extractPaymentArtifacts(
  data: Record<string, unknown>,
  paymentMethod: BillingPaymentMethod,
) {
  const boletos = Array.isArray(data.boletos) ? data.boletos : []
  const pix =
    typeof data.pix === "object" && data.pix !== null
      ? (data.pix as Record<string, unknown>)
      : null

  const primeiroBoleto =
    boletos.length > 0 && typeof boletos[0] === "object" && boletos[0] !== null
      ? (boletos[0] as Record<string, unknown>)
      : {}

  const boletoLink =
    normalizeString(primeiroBoleto.link) ||
    normalizeString(primeiroBoleto.url) ||
    normalizeString(data.linkBoleto)

  const pixQrCode =
    normalizeString(pix?.qrCode) ||
    normalizeString(pix?.imagem) ||
    normalizeString(data.linkQRCodePix)

  const pixCode = normalizeString(pix?.codigo) || normalizeString(data.idTransacao)

  if (paymentMethod === "boleto") {
    return {
      paymentLink: boletoLink,
      boletoLink,
      pixCode: null,
      pixQrCode: null,
    }
  }

  return {
    paymentLink: pixQrCode,
    boletoLink: null,
    pixCode,
    pixQrCode,
  }
}

export async function getBlingChargeDetails(
  chargeId: string,
): Promise<Record<string, unknown>> {
  const response = await blingRequest<BlingChargeDetailsResponse>(
    `/contas/receber/${chargeId}`,
    {
      method: "GET",
    },
  )

  return response.data ?? {}
}

export async function cancelBlingCharge(
  chargeId: string,
): Promise<Record<string, unknown>> {
  if (!chargeId.trim()) {
    throw new Error("ID da cobrança no Bling é obrigatório para cancelamento.")
  }

  return blingRequest<Record<string, unknown>>(`/contas/receber/${chargeId}`, {
    method: "DELETE",
  })
}

export async function createBlingCharge(
  input: BlingChargeInput,
): Promise<BlingChargeResult> {
  const paymentMethodId = BLING_PAYMENT_METHOD_IDS[input.paymentMethod]

  if (!paymentMethodId) {
    throw new Error("Forma de pagamento do Bling não configurada.")
  }

  const documentNumber = input.documentNumber.trim()

  if (!documentNumber) {
    throw new Error("Número do documento é obrigatório para criar cobrança no Bling.")
  }

  const payload = {
    contato: {
      id: Number(input.contactId),
    },
    dataEmissao: formatDateISO(new Date()),
    competencia: formatDateISO(new Date()),
    vencimento: buildDueDate(input.dueDate, input.dueInDays ?? 10),
    valor: Number(input.amount),
    numeroDocumento: documentNumber,
    historico: input.description,
    situacao: "A",
    formaPagamento: {
      id: paymentMethodId,
    },
    portador: {
      id: BLING_FINANCIAL_ACCOUNT_ID,
    },
    categoria: {
      id: BLING_REVENUE_CATEGORY_ID,
    },
  }

  const createResponse = await blingRequest<BlingChargeCreateResponse>(
    "/contas/receber",
    {
      method: "POST",
      body: payload,
    },
  )

  if (!createResponse.data?.id) {
    throw new Error("Erro ao criar cobrança no Bling")
  }

  const chargeId = String(createResponse.data.id)
  const detailsResponse = await getBlingChargeDetails(chargeId)
  const artifacts = extractPaymentArtifacts(detailsResponse, input.paymentMethod)

  return {
    id: chargeId,
    status: extractStatus(detailsResponse),
    paymentMethod: input.paymentMethod,
    documentNumber,
    paymentLink: artifacts.paymentLink,
    boletoLink: artifacts.boletoLink,
    pixCode: artifacts.pixCode,
    pixQrCode: artifacts.pixQrCode,
    raw: {
      createResponse,
      detailsResponse,
      requestPayload: payload,
    } as Record<string, unknown>,
  }
}