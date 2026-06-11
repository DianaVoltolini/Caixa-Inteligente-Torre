// src/lib/api/secure-api.ts

import { NextRequest, NextResponse } from "next/server"

export type ApiSuccessResponse<T = unknown> = {
  ok: true
  data: T
}

export type ApiErrorResponse = {
  ok: false
  error: string
  code?: string
}

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status = 400, code?: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

export function apiSuccess<T>(
  data: T,
  status = 200,
) {
  return NextResponse.json<ApiSuccessResponse<T>>(
    {
      ok: true,
      data,
    },
    { status },
  )
}

export function apiError(
  error: unknown,
  fallbackMessage = "Não foi possível concluir a solicitação.",
) {
  if (error instanceof ApiError) {
    return NextResponse.json<ApiErrorResponse>(
      {
        ok: false,
        error: error.message,
        code: error.code,
      },
      { status: error.status },
    )
  }

  console.error("[API_ERROR]", error)

  return NextResponse.json<ApiErrorResponse>(
    {
      ok: false,
      error: fallbackMessage,
      code: "internal_error",
    },
    { status: 500 },
  )
}

export async function readJsonBody<T = Record<string, unknown>>(
  request: NextRequest,
): Promise<T> {
  try {
    return await request.json()
  } catch {
    throw new ApiError(
      "Corpo da requisição inválido.",
      400,
      "invalid_json",
    )
  }
}

export function requireString(
  value: unknown,
  fieldName: string,
) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(
      `Campo obrigatório ausente: ${fieldName}.`,
      400,
      "required_field",
    )
  }

  return value.trim()
}

export function optionalString(value: unknown) {
  if (typeof value !== "string") return null

  const normalized = value.trim()

  return normalized.length > 0 ? normalized : null
}

export function requireUuid(
  value: unknown,
  fieldName: string,
) {
  const normalized = requireString(value, fieldName)

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  if (!uuidRegex.test(normalized)) {
    throw new ApiError(
      `Campo inválido: ${fieldName}.`,
      400,
      "invalid_uuid",
    )
  }

  return normalized
}

export function requireEmail(value: unknown) {
  const email = requireString(value, "email").toLowerCase()

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email)) {
    throw new ApiError(
      "E-mail inválido.",
      400,
      "invalid_email",
    )
  }

  return email
}

export function requireNumber(
  value: unknown,
  fieldName: string,
) {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    throw new ApiError(
      `Campo numérico inválido: ${fieldName}.`,
      400,
      "invalid_number",
    )
  }

  return numberValue
}

export function requirePositiveNumber(
  value: unknown,
  fieldName: string,
) {
  const numberValue = requireNumber(value, fieldName)

  if (numberValue <= 0) {
    throw new ApiError(
      `Campo deve ser maior que zero: ${fieldName}.`,
      400,
      "invalid_positive_number",
    )
  }

  return numberValue
}

export function getRequestIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

export function getUserAgent(request: NextRequest) {
  return request.headers.get("user-agent") || "unknown"
}

export async function secureRoute(
  handler: () => Promise<NextResponse>,
  fallbackMessage?: string,
) {
  try {
    return await handler()
  } catch (error) {
    return apiError(error, fallbackMessage)
  }
}