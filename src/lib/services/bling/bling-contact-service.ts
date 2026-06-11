// src/lib/services/bling/bling-contact-service.ts

import "server-only"

import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  createBlingContact,
  findBlingContactByCpfCnpj,
  getBlingContactById,
  normalizeCpfCnpj,
  updateBlingContact,
  type BusinessContactSource,
  type BlingContactRecord,
} from "@/lib/bling/contacts"
import { registrarBlingSyncLog } from "@/lib/bling/logs"
import type { AssinaturaRow } from "@/lib/types/assinaturas"

type EnsureBlingContactInput = {
  businessId: string
  assinaturaId: string
}

type EnsureBlingContactResult = {
  contactId: string
  mode: "reused_existing_id" | "found_by_document" | "created"
  contact: BlingContactRecord
}

type BusinessRow = BusinessContactSource

async function getBusinessById(businessId: string): Promise<BusinessRow> {
  const { data, error } = await supabaseAdmin
    .from("ci_business")
    .select(
      "id, name, cnpj, nome_responsavel, whatsapp, email_financeiro, cep, rua, numero, complemento, bairro, municipio, uf"
    )
    .eq("id", businessId)
    .single()

  if (error || !data) {
    throw new Error("Empresa não encontrada para sincronizar contato no Bling.")
  }

  return data as BusinessRow
}

async function getAssinaturaById(
  assinaturaId: string,
  businessId: string
): Promise<AssinaturaRow> {
  const { data, error } = await supabaseAdmin
    .from("ci_assinaturas")
    .select("*")
    .eq("id", assinaturaId)
    .eq("business_id", businessId)
    .single()

  if (error || !data) {
    throw new Error("Assinatura não encontrada para sincronizar contato no Bling.")
  }

  return data as AssinaturaRow
}

async function updateAssinaturaBlingClienteId(
  assinaturaId: string,
  businessId: string,
  blingClienteId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("ci_assinaturas")
    .update({
      bling_cliente_id: blingClienteId,
    })
    .eq("id", assinaturaId)
    .eq("business_id", businessId)

  if (error) {
    throw new Error(
      `Erro ao salvar bling_cliente_id na assinatura: ${error.message}`
    )
  }
}

async function registrarEvento(params: {
  assinaturaId: string
  businessId: string
  tipo: string
  descricao: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  const { error } = await supabaseAdmin.from("ci_assinatura_eventos").insert({
    assinatura_id: params.assinaturaId,
    business_id: params.businessId,
    cobranca_id: null,
    tipo: params.tipo,
    descricao: params.descricao,
    origem: "bling",
    metadata: params.metadata ?? {},
  })

  if (error) {
    throw new Error(`Erro ao registrar evento da assinatura: ${error.message}`)
  }
}

function extractContactId(contact: BlingContactRecord): string {
  const id = String(contact.id ?? "").trim()

  if (!id) {
    throw new Error("O Bling retornou um contato sem ID.")
  }

  return id
}

export async function ensureBlingContactForAssinatura(
  input: EnsureBlingContactInput
): Promise<EnsureBlingContactResult> {
  const assinatura = await getAssinaturaById(input.assinaturaId, input.businessId)
  const business = await getBusinessById(input.businessId)

  const normalizedDocument = normalizeCpfCnpj(business.cnpj)

  if (!normalizedDocument) {
    throw new Error(
      "Não foi possível sincronizar o cliente no Bling porque a empresa não possui CPF/CNPJ preenchido."
    )
  }

  try {
    if (assinatura.bling_cliente_id) {
      const existingContact = await getBlingContactById(
        input.businessId,
        assinatura.bling_cliente_id
      )

      if (existingContact) {
        const updated = await updateBlingContact(
          input.businessId,
          String(assinatura.bling_cliente_id),
          business
        )

        await registrarEvento({
          assinaturaId: input.assinaturaId,
          businessId: input.businessId,
          tipo: "bling_contact_reused",
          descricao:
            "Contato do Bling já vinculado localmente e atualizado com os dados atuais da empresa.",
          metadata: {
            bling_cliente_id: String(assinatura.bling_cliente_id),
            documento: normalizedDocument,
            email_financeiro: business.email_financeiro,
          },
        })

        await registrarBlingSyncLog({
          operacao: "bling_contact_sync",
          businessId: input.businessId,
          assinaturaId: input.assinaturaId,
          status: "success",
          requestPayload: {
            mode: "reused_existing_id",
            documento: normalizedDocument,
          },
          responsePayload: {
            bling_cliente_id: String(assinatura.bling_cliente_id),
          },
        })

        return {
          contactId: String(assinatura.bling_cliente_id),
          mode: "reused_existing_id",
          contact: updated,
        }
      }
    }

    const foundByDocument = await findBlingContactByCpfCnpj(
      input.businessId,
      normalizedDocument
    )

    if (foundByDocument) {
      const foundId = extractContactId(foundByDocument)

      const updated = await updateBlingContact(
        input.businessId,
        foundId,
        business
      )

      await updateAssinaturaBlingClienteId(
        input.assinaturaId,
        input.businessId,
        foundId
      )

      await registrarEvento({
        assinaturaId: input.assinaturaId,
        businessId: input.businessId,
        tipo: "bling_contact_found_by_document",
        descricao:
          "Contato localizado no Bling por CPF/CNPJ e atualizado com os dados atuais da empresa.",
        metadata: {
          bling_cliente_id: foundId,
          documento: normalizedDocument,
          email_financeiro: business.email_financeiro,
        },
      })

      await registrarBlingSyncLog({
        operacao: "bling_contact_sync",
        businessId: input.businessId,
        assinaturaId: input.assinaturaId,
        status: "success",
        requestPayload: {
          mode: "found_by_document",
          documento: normalizedDocument,
        },
        responsePayload: {
          bling_cliente_id: foundId,
        },
      })

      return {
        contactId: foundId,
        mode: "found_by_document",
        contact: updated,
      }
    }

    const created = await createBlingContact(input.businessId, business)
    const createdId = extractContactId(created)

    await updateAssinaturaBlingClienteId(
      input.assinaturaId,
      input.businessId,
      createdId
    )

    await registrarEvento({
      assinaturaId: input.assinaturaId,
      businessId: input.businessId,
      tipo: "bling_contact_created",
      descricao:
        "Contato criado no Bling com os dados completos da empresa.",
      metadata: {
        bling_cliente_id: createdId,
        documento: normalizedDocument,
        email_financeiro: business.email_financeiro,
      },
    })

    await registrarBlingSyncLog({
      operacao: "bling_contact_sync",
      businessId: input.businessId,
      assinaturaId: input.assinaturaId,
      status: "success",
      requestPayload: {
        mode: "created",
        documento: normalizedDocument,
      },
      responsePayload: {
        bling_cliente_id: createdId,
      },
    })

    return {
      contactId: createdId,
      mode: "created",
      contact: created,
    }
  } catch (error: any) {
    const message =
      error?.message || "Erro ao sincronizar contato da assinatura com o Bling."

    await registrarBlingSyncLog({
      operacao: "bling_contact_sync",
      businessId: input.businessId,
      assinaturaId: input.assinaturaId,
      status: "error",
      erro: message,
      requestPayload: {
        documento: normalizedDocument,
      },
      responsePayload: {
        name: error?.name ?? null,
        message: error?.message ?? null,
        statusCode: error?.statusCode ?? null,
        payload: error?.payload ?? null,
      },
    })

    throw error
  }
}