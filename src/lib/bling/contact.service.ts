// src/lib/bling/contact.service.ts

import { blingRequest } from "./client"
import { BlingContactInput, BlingContactResult } from "./types"

interface BlingContactApiItem {
  id: number | string
  nome?: string
  numeroDocumento?: string
  cnpj?: string
  cpf?: string
  email?: string
}

interface BlingContactsSearchResponse {
  data?: BlingContactApiItem[]
}

interface BlingContactCreateResponse {
  data?: {
    id: number | string
  }
}

interface BlingContactUpdateResponse {
  data?: {
    id: number | string
  }
}

function normalizeDocument(document?: string | null): string | null {
  if (!document) return null

  const onlyNumbers = document.replace(/\D/g, "")
  return onlyNumbers || null
}

function getItemDocument(item: BlingContactApiItem): string | null {
  return (
    normalizeDocument(item.numeroDocumento) ||
    normalizeDocument(item.cnpj) ||
    normalizeDocument(item.cpf) ||
    null
  )
}

function isDuplicateDocumentError(errorMessage: string): boolean {
  const normalized = errorMessage.toLowerCase()

  return (
    normalized.includes("cpf já está cadastrado") ||
    normalized.includes("cnpj já está cadastrado") ||
    normalized.includes("cpf ja esta cadastrado") ||
    normalized.includes("cnpj ja esta cadastrado")
  )
}

async function searchContactsByQuery(
  query: Record<string, string | number>,
): Promise<BlingContactApiItem[]> {
  try {
    const response = await blingRequest<BlingContactsSearchResponse>("/contatos", {
      method: "GET",
      query,
    })

    return response.data ?? []
  } catch {
    return []
  }
}

async function findContactByDocument(document: string): Promise<BlingContactApiItem | null> {
  const strategies: Array<Record<string, string | number>> = [
    {
      criterio: 1,
      tipoFiltro: 3,
      valor: document,
    },
    {
      valor: document,
    },
    {
      numeroDocumento: document,
    },
    {
      pesquisa: document,
    },
  ]

  for (const strategy of strategies) {
    const items = await searchContactsByQuery(strategy)

    const exactMatch = items.find((item) => getItemDocument(item) === document)
    if (exactMatch) {
      return exactMatch
    }

    if (items.length === 1) {
      return items[0] ?? null
    }
  }

  return null
}

function buildContactPayload(input: BlingContactInput): Record<string, unknown> {
  const normalizedDocument = normalizeDocument(input.document)

  return {
    nome: input.name,
    email: input.email ?? undefined,
    telefone: input.phone ?? undefined,
    numeroDocumento: normalizedDocument ?? undefined,
    tipo: input.personType === "J" ? "J" : "F",
    situacao: "A",
    endereco: input.address?.street ?? undefined,
    enderecoNro: input.address?.number ?? undefined,
    complemento: input.address?.complement ?? undefined,
    bairro: input.address?.neighborhood ?? undefined,
    municipio: input.address?.city ?? undefined,
    uf: input.address?.state ?? undefined,
    cep: input.address?.zipCode?.replace(/\D/g, "") ?? undefined,
  }
}

async function updateExistingContact(
  contactId: string,
  input: BlingContactInput,
): Promise<BlingContactResult> {
  const payload = buildContactPayload(input)

  const updated = await blingRequest<BlingContactUpdateResponse>(`/contatos/${contactId}`, {
    method: "PUT",
    body: payload,
  })

  return {
    id: String(updated.data?.id ?? contactId),
    raw: updated as Record<string, unknown>,
  }
}

async function createNewContact(input: BlingContactInput): Promise<BlingContactResult> {
  const payload = buildContactPayload(input)

  const created = await blingRequest<BlingContactCreateResponse>("/contatos", {
    method: "POST",
    body: payload,
  })

  if (!created.data?.id) {
    throw new Error("O Bling não retornou o ID do contato criado.")
  }

  return {
    id: String(created.data.id),
    raw: created as Record<string, unknown>,
  }
}

export async function upsertBlingContact(
  input: BlingContactInput,
): Promise<BlingContactResult> {
  const normalizedDocument = normalizeDocument(input.document)

  if (normalizedDocument) {
    const existing = await findContactByDocument(normalizedDocument)

    if (existing?.id) {
      return updateExistingContact(String(existing.id), input)
    }
  }

  try {
    return await createNewContact(input)
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao criar contato no Bling."

    if (!normalizedDocument || !isDuplicateDocumentError(message)) {
      throw error
    }

    const existingAfterCreateFailure = await findContactByDocument(normalizedDocument)

    if (existingAfterCreateFailure?.id) {
      return updateExistingContact(String(existingAfterCreateFailure.id), input)
    }

    throw new Error(
      "Já existe um contato no Bling com esse CPF/CNPJ, mas não foi possível localizá-lo automaticamente.",
    )
  }
}