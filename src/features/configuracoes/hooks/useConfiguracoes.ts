// src/features/configuracoes/hooks/useConfiguracoes.ts

"use client"

import { useEffect, useMemo, useState } from "react"
import { useAccount } from "@/contexts/AccountContext"
import { updateBusinessProfile } from "@/features/configuracoes/services/updateBusinessProfile"

type TipoPessoa = "fisica" | "juridica"

function onlyDigits(value: string) {
  return value.replace(/\D/g, "")
}

function maskCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8)

  if (digits.length <= 5) return digits

  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function maskCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function maskCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14)

  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value)
}

function getAddressFromCnpjApi(data: any) {
  const estabelecimento = data?.estabelecimento ?? {}
  const cidade = estabelecimento?.cidade ?? {}
  const estado = estabelecimento?.estado ?? {}

  const tipoLogradouro = String(estabelecimento?.tipo_logradouro ?? "").trim()
  const logradouro = String(estabelecimento?.logradouro ?? "").trim()

  const rua = [tipoLogradouro, logradouro].filter(Boolean).join(" ")

  const inscricaoEstadual =
    estabelecimento?.inscricoes_estaduais?.[0]?.inscricao_estadual ??
    estabelecimento?.inscricao_estadual ??
    data?.inscricoes_estaduais?.[0]?.inscricao_estadual ??
    "Não Contribuinte"

  return {
    razao_social: data?.razao_social ?? "",
    nome_fantasia: estabelecimento?.nome_fantasia ?? "",
    inscricao_estadual: inscricaoEstadual || "Não Contribuinte",
    cep: maskCep(estabelecimento?.cep ?? ""),
    rua,
    numero: estabelecimento?.numero ?? "",
    complemento: estabelecimento?.complemento ?? "",
    bairro: estabelecimento?.bairro ?? "",
    municipio: cidade?.nome ?? estabelecimento?.cidade?.nome ?? "",
    uf: estado?.sigla ?? cidade?.estado?.sigla ?? "",
  }
}

function isOnboardingComplete(data: {
  tipoPessoa: TipoPessoa
  nomeResponsavel: string
  cpf: string
  whatsapp: string
  emailFinanceiro: string
  cnpj: string
  razaoSocial: string
  cep: string
  rua: string
  numero: string
  bairro: string
  municipio: string
  uf: string
  billingCep: string
  billingRua: string
  billingNumero: string
  billingBairro: string
  billingMunicipio: string
  billingUf: string
  enderecoReceitaDiferente: boolean
}) {
  const userOk = Boolean(
    data.nomeResponsavel.trim() &&
      onlyDigits(data.cpf).length === 11 &&
      data.whatsapp.trim() &&
      data.emailFinanceiro.trim(),
  )

  if (data.tipoPessoa === "fisica") {
    return Boolean(
      userOk &&
        onlyDigits(data.billingCep).length === 8 &&
        data.billingRua.trim() &&
        data.billingNumero.trim() &&
        data.billingBairro.trim() &&
        data.billingMunicipio.trim() &&
        data.billingUf.trim().length === 2,
    )
  }

  const receitaOk = Boolean(
    onlyDigits(data.cnpj).length === 14 &&
      data.razaoSocial.trim() &&
      onlyDigits(data.cep).length === 8 &&
      data.rua.trim() &&
      data.bairro.trim() &&
      data.municipio.trim() &&
      data.uf.trim().length === 2,
  )

  if (!data.enderecoReceitaDiferente) {
    return Boolean(userOk && receitaOk)
  }

  return Boolean(
    userOk &&
      receitaOk &&
      onlyDigits(data.billingCep).length === 8 &&
      data.billingRua.trim() &&
      data.billingNumero.trim() &&
      data.billingBairro.trim() &&
      data.billingMunicipio.trim() &&
      data.billingUf.trim().length === 2,
  )
}

export function useConfiguracoes() {
  const { user, business, refreshAccount } = useAccount()

  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>("fisica")

  const [nomeResponsavel, setNomeResponsavel] = useState("")
  const [cpf, setCpfState] = useState("")
  const [dataNascimento, setDataNascimento] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [emailFinanceiro, setEmailFinanceiro] = useState("")
  const [receberInformativos, setReceberInformativos] = useState(true)

  const [cnpj, setCnpjState] = useState("")
  const [razaoSocial, setRazaoSocial] = useState("")
  const [nomeFantasia, setNomeFantasia] = useState("")
  const [inscricaoEstadual, setInscricaoEstadual] = useState("")

  const [cep, setCepState] = useState("")
  const [rua, setRua] = useState("")
  const [numero, setNumero] = useState("")
  const [complemento, setComplemento] = useState("")
  const [bairro, setBairro] = useState("")
  const [municipio, setMunicipio] = useState("")
  const [uf, setUf] = useState("")

  const [billingCep, setBillingCepState] = useState("")
  const [billingRua, setBillingRua] = useState("")
  const [billingNumero, setBillingNumero] = useState("")
  const [billingComplemento, setBillingComplemento] = useState("")
  const [billingBairro, setBillingBairro] = useState("")
  const [billingMunicipio, setBillingMunicipio] = useState("")
  const [billingUf, setBillingUf] = useState("")

  const [enderecoReceitaDiferente, setEnderecoReceitaDiferente] =
    useState(false)

  const [salvando, setSalvando] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [buscandoBillingCep, setBuscandoBillingCep] = useState(false)
  const [buscandoCnpj, setBuscandoCnpj] = useState(false)

  const enderecoOrigem = useMemo<"receita" | "manual">(() => {
    if (tipoPessoa === "juridica" && !enderecoReceitaDiferente) {
      return "receita"
    }

    return "manual"
  }, [tipoPessoa, enderecoReceitaDiferente])

  useEffect(() => {
    if (!business) return

    const businessTipoPessoa =
      business.tipo_pessoa === "juridica" ||
      onlyDigits(business.cnpj || "").length === 14
        ? "juridica"
        : "fisica"

    setTipoPessoa(businessTipoPessoa)

    setNomeResponsavel(business.nome_responsavel || "")
    setCpfState(maskCpf(business.cpf || ""))
    setDataNascimento(business.data_nascimento || "")
    setWhatsapp(business.whatsapp || "")
    setEmailFinanceiro(business.email_financeiro || "")
    setReceberInformativos(business.receber_informativos !== false)

    setCnpjState(maskCnpj(business.cnpj || ""))
    setRazaoSocial(business.razao_social || "")
    setNomeFantasia(business.nome_fantasia || "")
    setInscricaoEstadual(business.inscricao_estadual || "")

    setCepState(maskCep(business.cep || ""))
    setRua(business.rua || "")
    setNumero(business.numero || "")
    setComplemento(business.complemento || "")
    setBairro(business.bairro || "")
    setMunicipio(business.municipio || "")
    setUf((business.uf || "").toUpperCase())

    setBillingCepState(maskCep(business.billing_cep || business.cep || ""))
    setBillingRua(business.billing_rua || "")
    setBillingNumero(business.billing_numero || "")
    setBillingComplemento(business.billing_complemento || "")
    setBillingBairro(business.billing_bairro || "")
    setBillingMunicipio(business.billing_municipio || "")
    setBillingUf((business.billing_uf || "").toUpperCase())

    setEnderecoReceitaDiferente(Boolean(business.endereco_receita_diferente))
  }, [business])

  function setCpf(value: string) {
    setCpfState(maskCpf(value))
  }

  function setCnpj(value: string) {
    setCnpjState(maskCnpj(value))
  }

  function setCep(value: string) {
    setCepState(maskCep(value))
  }

  function setBillingCep(value: string) {
    const previousCep = onlyDigits(billingCep)
    const nextCep = onlyDigits(value)

    setBillingCepState(maskCep(value))

    if (previousCep !== nextCep) {
      setBillingNumero("")
      setBillingComplemento("")
    }

    if (nextCep.length === 0) {
      setBillingRua("")
      setBillingBairro("")
      setBillingMunicipio("")
      setBillingUf("")
    }
  }

  async function buscarCep() {
    const cepLimpo = onlyDigits(cep)

    if (cepLimpo.length !== 8) return

    try {
      setBuscandoCep(true)

      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()

      if (data?.erro) return

      setRua(data.logradouro || "")
      setBairro(data.bairro || "")
      setMunicipio(data.localidade || "")
      setUf((data.uf || "").toUpperCase())
    } finally {
      setBuscandoCep(false)
    }
  }

  async function buscarBillingCep() {
    const cepLimpo = onlyDigits(billingCep)

    if (cepLimpo.length !== 8) return

    try {
      setBuscandoBillingCep(true)

      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()

      if (data?.erro) return

      setBillingRua(data.logradouro || "")
      setBillingBairro(data.bairro || "")
      setBillingMunicipio(data.localidade || "")
      setBillingUf((data.uf || "").toUpperCase())
      setBillingNumero("")
      setBillingComplemento("")
    } finally {
      setBuscandoBillingCep(false)
    }
  }

  async function consultarCnpj() {
    const cnpjLimpo = onlyDigits(cnpj)

    if (cnpjLimpo.length !== 14) {
      return {
        success: false,
        error: "Digite um CNPJ válido para consultar.",
      }
    }

    try {
      setBuscandoCnpj(true)

      const response = await fetch(`/api/cnpj/${cnpjLimpo}`, {
        method: "GET",
        cache: "no-store",
      })

      const result = await response.json()

      if (!response.ok || result?.ok !== true) {
        return {
          success: false,
          error: result?.message || "Não consegui consultar este CNPJ agora.",
        }
      }

      const parsed = getAddressFromCnpjApi(result.data)

      setRazaoSocial(parsed.razao_social)
      setNomeFantasia(parsed.nome_fantasia)
      setInscricaoEstadual(parsed.inscricao_estadual || "Não Contribuinte")

      setCepState(parsed.cep)
      setRua(parsed.rua)
      setNumero(parsed.numero)
      setComplemento(parsed.complemento)
      setBairro(parsed.bairro)
      setMunicipio(parsed.municipio)
      setUf(String(parsed.uf || "").toUpperCase())

      if (!enderecoReceitaDiferente) {
        setBillingCepState("")
        setBillingRua("")
        setBillingNumero("")
        setBillingComplemento("")
        setBillingBairro("")
        setBillingMunicipio("")
        setBillingUf("")
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || "Erro ao consultar CNPJ.",
      }
    } finally {
      setBuscandoCnpj(false)
    }
  }

  async function salvar() {
    if (!nomeResponsavel.trim()) {
      return { success: false, error: "Preencha o nome." }
    }

    if (onlyDigits(cpf).length !== 11) {
      return { success: false, error: "Preencha um CPF válido." }
    }

    if (!whatsapp.trim()) {
      return { success: false, error: "Preencha o WhatsApp." }
    }

    if (!emailFinanceiro.trim()) {
      return { success: false, error: "Preencha o e-mail para receber cobrança." }
    }

    if (!isValidEmail(emailFinanceiro.trim())) {
      return { success: false, error: "Digite um e-mail válido." }
    }

    if (tipoPessoa === "juridica") {
      if (onlyDigits(cnpj).length !== 14) {
        return { success: false, error: "Preencha um CNPJ válido." }
      }

      if (!razaoSocial.trim()) {
        return {
          success: false,
          error: "Consulte o CNPJ para preencher os dados da empresa.",
        }
      }

      if (onlyDigits(cep).length !== 8 || !rua.trim()) {
        return {
          success: false,
          error: "Atualize os dados da Receita para preencher o endereço fiscal.",
        }
      }
    }

    if (tipoPessoa === "fisica" || enderecoReceitaDiferente) {
      if (onlyDigits(billingCep).length !== 8) {
        return { success: false, error: "Preencha um CEP de cobrança válido." }
      }

      if (!billingRua.trim()) {
        return { success: false, error: "Preencha a rua de cobrança." }
      }

      if (!billingNumero.trim()) {
        return { success: false, error: "Preencha o número de cobrança." }
      }

      if (!billingBairro.trim()) {
        return { success: false, error: "Preencha o bairro de cobrança." }
      }

      if (!billingMunicipio.trim()) {
        return { success: false, error: "Preencha o município de cobrança." }
      }

      if (!billingUf.trim() || billingUf.trim().length !== 2) {
        return { success: false, error: "Preencha a UF de cobrança com 2 letras." }
      }
    }

    try {
      setSalvando(true)

      const onboardingCompleted = isOnboardingComplete({
        tipoPessoa,
        nomeResponsavel,
        cpf,
        whatsapp,
        emailFinanceiro,
        cnpj,
        razaoSocial,
        cep,
        rua,
        numero,
        bairro,
        municipio,
        uf,
        billingCep,
        billingRua,
        billingNumero,
        billingBairro,
        billingMunicipio,
        billingUf,
        enderecoReceitaDiferente,
      })

      const fiscalAsBilling =
        tipoPessoa === "juridica" && !enderecoReceitaDiferente

      await updateBusinessProfile({
        businessId: business?.id || null,
        ownerUserId: user?.id || null,

        tipo_pessoa: tipoPessoa,

        nome_responsavel: nomeResponsavel,
        cpf,
        data_nascimento: dataNascimento || null,
        whatsapp,
        email_financeiro: emailFinanceiro,
        receber_informativos: receberInformativos,

        cnpj,
        razao_social: razaoSocial,
        nome_fantasia: nomeFantasia,
        inscricao_estadual: inscricaoEstadual || "Não Contribuinte",

        cep,
        rua,
        numero,
        complemento,
        bairro,
        municipio,
        uf,

        billing_cep: fiscalAsBilling ? "" : billingCep,
        billing_rua: fiscalAsBilling ? "" : billingRua,
        billing_numero: fiscalAsBilling ? "" : billingNumero,
        billing_complemento: fiscalAsBilling ? "" : billingComplemento,
        billing_bairro: fiscalAsBilling ? "" : billingBairro,
        billing_municipio: fiscalAsBilling ? "" : billingMunicipio,
        billing_uf: fiscalAsBilling ? "" : billingUf,

        endereco_origem: enderecoOrigem,
        endereco_receita_diferente: enderecoReceitaDiferente,
        onboarding_completed: onboardingCompleted,
      })

      await refreshAccount()

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || "Erro ao salvar.",
      }
    } finally {
      setSalvando(false)
    }
  }

  return {
    tipoPessoa,

    nomeResponsavel,
    cpf,
    dataNascimento,
    whatsapp,
    emailFinanceiro,
    receberInformativos,

    cnpj,
    razaoSocial,
    nomeFantasia,
    inscricaoEstadual,

    cep,
    rua,
    numero,
    complemento,
    bairro,
    municipio,
    uf,

    billingCep,
    billingRua,
    billingNumero,
    billingComplemento,
    billingBairro,
    billingMunicipio,
    billingUf,

    enderecoReceitaDiferente,
    enderecoOrigem,

    buscandoCep,
    buscandoBillingCep,
    buscandoCnpj,
    salvando,

    setTipoPessoa,
    setNomeResponsavel,
    setCpf,
    setDataNascimento,
    setWhatsapp,
    setEmailFinanceiro,
    setReceberInformativos,

    setCnpj,

    setCep,
    setRua,
    setNumero,
    setComplemento,
    setBairro,
    setMunicipio,
    setUf,

    setBillingCep,
    setBillingRua,
    setBillingNumero,
    setBillingComplemento,
    setBillingBairro,
    setBillingMunicipio,
    setBillingUf,

    setEnderecoReceitaDiferente,

    buscarCep,
    buscarBillingCep,
    consultarCnpj,
    salvar,
  }
}