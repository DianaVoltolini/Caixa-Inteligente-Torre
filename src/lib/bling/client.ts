// src/lib/bling/client.ts

import { getValidBlingAccessToken } from "./token-service"

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

interface BlingRequestOptions {
  method?: HttpMethod
  body?: Record<string, unknown> | null
  query?: Record<string, string | number | boolean | null | undefined>
}

const BLING_API_BASE_URL =
  process.env.BLING_API_URL || "https://api.bling.com.br/Api/v3"

function buildUrl(
  endpoint: string,
  query?: Record<string, string | number | boolean | null | undefined>,
): string {
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`

  const url = new URL(`${BLING_API_BASE_URL}${normalizedEndpoint}`)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined) continue
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

export async function blingRequest<T>(
  endpoint: string,
  options: BlingRequestOptions = {},
): Promise<T> {
  const token = await getValidBlingAccessToken()
  const url = buildUrl(endpoint, options.query)

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  })

  const rawText = await response.text()

  console.log("[BLING REQUEST]", {
    url,
    method: options.method ?? "GET",
    status: response.status,
    response: rawText,
  })

  if (!response.ok) {
    throw new Error(
      `Erro na API do Bling: ${response.status} - ${rawText || "sem resposta"}`,
    )
  }

  if (response.status === 204 || !rawText.trim()) {
    return {} as T
  }

  try {
    return JSON.parse(rawText) as T
  } catch {
    throw new Error("Resposta inválida da API do Bling: retorno não é JSON.")
  }
}

/**
 * Compatibilidade temporária com código antigo.
 * O Bling agora é central da fundadora, então businessId é ignorado.
 * NÃO reintroduz ci_integracoes_bling nem token por usuário.
 */
export async function blingRequestForBusiness<T>(
  _businessId: string,
  endpoint: string,
  options: BlingRequestOptions = {},
): Promise<T> {
  return blingRequest<T>(endpoint, options)
}