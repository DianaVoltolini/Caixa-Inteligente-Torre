// src/lib/bling/receive.service.ts

import { blingRequest } from './client'
import { BillingPaymentMethod } from './types'

interface BlingReceiveResponse {
  bordero?: {
    id: number
  }
}

interface BlingChargeDetailsResponse {
  data?: Record<string, unknown>
}

interface BlingBoletosResponse {
  data?: unknown
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function extractPixArtifacts(details: Record<string, unknown>): {
  pixCode: string | null
  pixQrCode: string | null
} {
  return {
    pixCode: normalizeString(details.idTransacao),
    pixQrCode: normalizeString(details.linkQRCodePix),
  }
}

function extractBoletoArtifacts(boletos: unknown): {
  boletoLink: string | null
} {
  if (!boletos) {
    return { boletoLink: null }
  }

  if (Array.isArray(boletos)) {
    for (const item of boletos) {
      if (item && typeof item === 'object') {
        const candidate =
          normalizeString((item as Record<string, unknown>).link) ||
          normalizeString((item as Record<string, unknown>).url) ||
          normalizeString((item as Record<string, unknown>).linkBoleto) ||
          normalizeString((item as Record<string, unknown>).linkPdf) ||
          normalizeString((item as Record<string, unknown>).linkPDF)

        if (candidate) {
          return { boletoLink: candidate }
        }
      }
    }
  }

  if (typeof boletos === 'object') {
    const obj = boletos as Record<string, unknown>

    const direct =
      normalizeString(obj.link) ||
      normalizeString(obj.url) ||
      normalizeString(obj.linkBoleto) ||
      normalizeString(obj.linkPdf) ||
      normalizeString(obj.linkPDF)

    if (direct) {
      return { boletoLink: direct }
    }

    if (Array.isArray(obj.data)) {
      return extractBoletoArtifacts(obj.data)
    }
  }

  return { boletoLink: null }
}

function getTodayISO(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function receiveBlingCharge(params: {
  chargeId: string
  amount: number
  paymentMethod: BillingPaymentMethod
}): Promise<{
  borderoId: string | null
  pixCode: string | null
  pixQrCode: string | null
  boletoLink: string | null
  raw: Record<string, unknown>
}> {
  const baixarResponse = await blingRequest<BlingReceiveResponse>(
    `/contas/receber/${params.chargeId}/baixar`,
    {
      method: 'POST',
      body: {
        valor: Number(params.amount),
        data: getTodayISO(),
      },
    }
  )

  let detailsResponse: Record<string, unknown> = {}
  try {
    const details = await blingRequest<BlingChargeDetailsResponse>(
      `/contas/receber/${params.chargeId}`,
      { method: 'GET' }
    )
    detailsResponse = details.data ?? {}
  } catch {
    detailsResponse = {}
  }

  let boletosResponse: unknown = null
  if (params.paymentMethod === 'boleto') {
    try {
      const boletos = await blingRequest<BlingBoletosResponse>(
        '/contas/receber/boletos',
        {
          method: 'GET',
          query: {
            idOrigem: params.chargeId,
          },
        }
      )
      boletosResponse = boletos.data ?? boletos
    } catch {
      boletosResponse = null
    }
  }

  const pix = extractPixArtifacts(detailsResponse)
  const boleto = extractBoletoArtifacts(boletosResponse)

  return {
    borderoId: baixarResponse.bordero?.id
      ? String(baixarResponse.bordero.id)
      : null,
    pixCode: pix.pixCode,
    pixQrCode: pix.pixQrCode,
    boletoLink: boleto.boletoLink,
    raw: {
      baixarResponse,
      detailsResponse,
      boletosResponse,
    },
  }
}