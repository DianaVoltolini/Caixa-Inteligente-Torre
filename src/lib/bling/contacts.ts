// src/lib/bling/contacts.ts

import "server-only"

import { blingRequestForBusiness } from "@/lib/bling/client"

const DOCUMENT_SEARCH_QUERY_KEY =
  process.env.BLING_CONTACT_DOCUMENT_QUERY_KEY ?? "numeroDocumento"

export type BlingContactRecord = {
  id: string | number
  nome?: string
  numeroDocumento?: string
  cpfCnpj?: string
  celular?: string
  telefone?: string
  email?: string
  emails?: Array<{
    email?: string
    principal?: boolean
  }>
  endereco?: {
    geral?: {
      endereco?: string
      numero?: string
      complemento?: string
      bairro?: string
      municipio?: string
      uf?: string
      cep?: string
    }
  }
}

export type BusinessContactSource = {
  id: string
  name: string | null
  cnpj: string | null
  nome_responsavel: string | null
  whatsapp: string | null
  email_financeiro: string | null
  cep: string | null
  rua: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  municipio: string | null
  uf: string | null
}

function onlyNumbers(value?: string | null): string {
  return String(value ?? "").replace(/\D/g, "")
}

function isCpf(document: string): boolean {
  return document.length === 11
}

function isCnpj(document: string): boolean {
  return document.length === 14
}

export function normalizeCpfCnpj(value?: string | null): string {
  return onlyNumbers(value)
}

export function assertValidCpfCnpj(value?: string | null): string {
  const normalized = normalizeCpfCnpj(value)

  if (!normalized) {
    throw new Error(
      "Não foi possível sincronizar o cliente no Bling porque a empresa não possui CPF/CNPJ preenchido."
    )
  }

  if (!isCpf(normalized) && !isCnpj(normalized)) {
    throw new Error(
      "CPF/CNPJ inválido. Preencha um CPF ou CNPJ válido antes de integrar com o Bling."
    )
  }

  return normalized
}

function getContactName(source: BusinessContactSource): string {
  const legalName = String(source.name ?? "").trim()
  const ownerName = String(source.nome_responsavel ?? "").trim()

  if (legalName) return legalName
  if (ownerName) return ownerName

  throw new Error(
    "Não foi possível sincronizar o cliente no Bling porque a empresa não possui nome preenchido."
  )
}

export function buildBlingContactPayload(source: BusinessContactSource) {
  const document = assertValidCpfCnpj(source.cnpj)
  const emailFinanceiro = String(source.email_financeiro ?? "").trim()
  const whatsapp = onlyNumbers(source.whatsapp)
  const nome = getContactName(source)

  return {
    nome,
    tipoPessoa: isCnpj(document) ? "J" : "F",
    numeroDocumento: document,
    email: emailFinanceiro || undefined,
    telefone: whatsapp || undefined,
    celular: whatsapp || undefined,
    endereco: {
      geral: {
        endereco: String(source.rua ?? "").trim() || undefined,
        numero: String(source.numero ?? "").trim() || undefined,
        complemento: String(source.complemento ?? "").trim() || undefined,
        bairro: String(source.bairro ?? "").trim() || undefined,
        municipio: String(source.municipio ?? "").trim() || undefined,
        uf: String(source.uf ?? "").trim() || undefined,
        cep: onlyNumbers(source.cep) || undefined,
      },
    },
    contatos: [
      {
        nome: String(source.nome_responsavel ?? "").trim() || nome,
        email: emailFinanceiro || undefined,
        celular: whatsapp || undefined,
      },
    ],
  }
}

function normalizeReturnedDocument(contact: BlingContactRecord): string {
  return onlyNumbers(contact.numeroDocumento ?? contact.cpfCnpj ?? "")
}

function pickFirstExactDocumentMatch(
  contacts: BlingContactRecord[],
  document: string
): BlingContactRecord | null {
  const normalizedDocument = onlyNumbers(document)

  for (const contact of contacts) {
    if (normalizeReturnedDocument(contact) === normalizedDocument) {
      return contact
    }
  }

  return contacts[0] ?? null
}

export async function getBlingContactById(
  businessId: string,
  contactId: string
): Promise<BlingContactRecord | null> {
  try {
    const response = await blingRequestForBusiness<{
      data?: BlingContactRecord
    }>(businessId, `/contatos/${contactId}`, {
      method: "GET",
    })

    return response?.data ?? null
  } catch {
    return null
  }
}

export async function findBlingContactByCpfCnpj(
  businessId: string,
  cpfCnpj: string
): Promise<BlingContactRecord | null> {
  const document = assertValidCpfCnpj(cpfCnpj)

  const response = await blingRequestForBusiness<{
    data?: BlingContactRecord[]
  }>(businessId, "/contatos", {
    method: "GET",
    query: {
      [DOCUMENT_SEARCH_QUERY_KEY]: document,
      pagina: 1,
      limite: 100,
    },
  })

  const contacts = Array.isArray(response?.data) ? response.data : []

  return pickFirstExactDocumentMatch(contacts, document)
}

export async function createBlingContact(
  businessId: string,
  source: BusinessContactSource
): Promise<BlingContactRecord> {
  const payload = buildBlingContactPayload(source)

  const response = await blingRequestForBusiness<{
    data?: BlingContactRecord
  }>(businessId, "/contatos", {
    method: "POST",
    body: payload,
  })

  if (!response?.data) {
    throw new Error("O Bling não retornou o contato criado.")
  }

  return response.data
}

export async function updateBlingContact(
  businessId: string,
  contactId: string,
  source: BusinessContactSource
): Promise<BlingContactRecord> {
  const payload = buildBlingContactPayload(source)

  const response = await blingRequestForBusiness<{
    data?: BlingContactRecord
  }>(businessId, `/contatos/${contactId}`, {
    method: "PUT",
    body: payload,
  })

  if (!response?.data) {
    throw new Error("O Bling não retornou o contato atualizado.")
  }

  return response.data
}