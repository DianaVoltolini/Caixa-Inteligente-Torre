// src/lib/bling/errors.ts

export class BlingApiError extends Error {
  statusCode: number
  payload: unknown

  constructor(message: string, statusCode = 500, payload: unknown = null) {
    super(message)
    this.name = "BlingApiError"
    this.statusCode = statusCode
    this.payload = payload
  }
}

export function getBlingErrorMessage(payload: any): string {
  if (!payload) {
    return "Erro desconhecido retornado pelo Bling."
  }

  if (typeof payload?.error?.description === "string") {
    return payload.error.description
  }

  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    const first = payload.errors[0]

    if (typeof first?.message === "string" && first.message.trim()) {
      return first.message
    }

    if (typeof first?.detail === "string" && first.detail.trim()) {
      return first.detail
    }
  }

  if (typeof payload?.message === "string" && payload.message.trim()) {
    return payload.message
  }

  return "Erro desconhecido retornado pelo Bling."
}