// src/features/configuracoes/services/updateBusinessProfile.ts

import {
  getBusinessByOwnerUserId,
  updateBusiness,
} from "@/lib/db/business"

type UpdateBusinessProfileInput = {
  businessId: string | null
  ownerUserId: string | null

  tipo_pessoa: "fisica" | "juridica"

  nome_responsavel: string
  cpf: string
  data_nascimento: string | null
  whatsapp: string
  email_financeiro: string
  receber_informativos: boolean

  cnpj: string
  razao_social: string
  nome_fantasia: string
  inscricao_estadual: string

  cep: string
  rua: string
  numero: string
  complemento: string
  bairro: string
  municipio: string
  uf: string

  billing_cep: string
  billing_rua: string
  billing_numero: string
  billing_complemento: string
  billing_bairro: string
  billing_municipio: string
  billing_uf: string

  endereco_origem: "receita" | "manual"
  endereco_receita_diferente: boolean
  onboarding_completed: boolean
}

export async function updateBusinessProfile(
  input: UpdateBusinessProfileInput,
) {
  const {
    businessId,
    ownerUserId,

    tipo_pessoa,

    nome_responsavel,
    cpf,
    data_nascimento,
    whatsapp,
    email_financeiro,
    receber_informativos,

    cnpj,
    razao_social,
    nome_fantasia,
    inscricao_estadual,

    cep,
    rua,
    numero,
    complemento,
    bairro,
    municipio,
    uf,

    billing_cep,
    billing_rua,
    billing_numero,
    billing_complemento,
    billing_bairro,
    billing_municipio,
    billing_uf,

    endereco_origem,
    endereco_receita_diferente,
    onboarding_completed,
  } = input

  let resolvedBusinessId = businessId

  if (!resolvedBusinessId && ownerUserId) {
    const business = await getBusinessByOwnerUserId(ownerUserId)
    resolvedBusinessId = business?.id || null
  }

  if (!resolvedBusinessId) {
    throw new Error("Empresa não carregada ainda.")
  }

  await updateBusiness(resolvedBusinessId, {
    tipo_pessoa,

    nome_responsavel: nome_responsavel.trim(),
    cpf: cpf.trim(),
    data_nascimento: data_nascimento || null,
    whatsapp: whatsapp.trim(),
    email_financeiro: email_financeiro.trim(),
    receber_informativos,

    cnpj: tipo_pessoa === "juridica" ? cnpj.trim() : "",
    razao_social: tipo_pessoa === "juridica" ? razao_social.trim() : "",
    nome_fantasia: tipo_pessoa === "juridica" ? nome_fantasia.trim() : "",
    inscricao_estadual:
      tipo_pessoa === "juridica"
        ? inscricao_estadual.trim() || "Não Contribuinte"
        : "",

    cep: cep.trim(),
    rua: rua.trim(),
    numero: numero.trim(),
    complemento: complemento.trim(),
    bairro: bairro.trim(),
    municipio: municipio.trim(),
    uf: uf.trim().toUpperCase(),

    billing_cep: billing_cep.trim(),
    billing_rua: billing_rua.trim(),
    billing_numero: billing_numero.trim(),
    billing_complemento: billing_complemento.trim(),
    billing_bairro: billing_bairro.trim(),
    billing_municipio: billing_municipio.trim(),
    billing_uf: billing_uf.trim().toUpperCase(),

    endereco_origem,
    endereco_receita_diferente,
    onboarding_completed,
  })

  return { success: true }
}