// src/app/master/torre-controle/consulta-cnpj/page.tsx

"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"

import PageContainer from "@/components/layout/PageContainer"
import PageHeader from "@/components/layout/PageHeader"
import { Card } from "@/components/ui"

type CnpjApiResponse = {
  ok: boolean
  message?: string
  data?: {
    cnpj_raiz?: string
    razao_social?: string
    capital_social?: string
    porte?: {
      descricao?: string
    }
    natureza_juridica?: {
      descricao?: string
    }
    estabelecimento?: {
      cnpj?: string
      nome_fantasia?: string | null
      tipo?: string
      situacao_cadastral?: string
      data_situacao_cadastral?: string
      data_inicio_atividade?: string
      email?: string | null
      ddd1?: string | null
      telefone1?: string | null
      ddd2?: string | null
      telefone2?: string | null
      logradouro?: string
      numero?: string
      complemento?: string | null
      bairro?: string
      cep?: string
      cidade?: {
        nome?: string
      }
      estado?: {
        sigla?: string
      }
      atividade_principal?: {
        descricao?: string
        id?: string
      }
      atividades_secundarias?: Array<{
        descricao?: string
        id?: string
      }>
      inscricoes_estaduais?: Array<{
        inscricao_estadual?: string
        ativo?: boolean
        estado?: {
          sigla?: string
          nome?: string
        }
      }>
    }
    socios?: Array<{
      nome?: string
      tipo?: string
      data_entrada?: string
      qualificacao_socio?: {
        descricao?: string
      }
    }>
    simples?: {
      simples?: string
      mei?: string
      atualizado_em?: string
    }
  }
}

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "")
}

function formatCnpjInput(value: string) {
  const numbers = onlyNumbers(value).slice(0, 14)

  if (numbers.length <= 2) {
    return numbers
  }

  if (numbers.length <= 5) {
    return numbers.replace(/^(\d{2})(\d+)/, "$1.$2")
  }

  if (numbers.length <= 8) {
    return numbers.replace(/^(\d{2})(\d{3})(\d+)/, "$1.$2.$3")
  }

  if (numbers.length <= 12) {
    return numbers.replace(
      /^(\d{2})(\d{3})(\d{3})(\d+)/,
      "$1.$2.$3/$4"
    )
  }

  return numbers.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  )
}

function formatCnpj(value?: string) {
  const numbers = onlyNumbers(value || "")

  if (numbers.length !== 14) {
    return value || "-"
  }

  return numbers.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  )
}

function formatCep(value?: string) {
  const numbers = onlyNumbers(value || "")

  if (numbers.length !== 8) {
    return value || "-"
  }

  return numbers.replace(/^(\d{5})(\d{3})$/, "$1-$2")
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date)
}

function formatMoney(value?: string) {
  if (!value) {
    return "-"
  }

  const number = Number(value)

  if (Number.isNaN(number)) {
    return value
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number)
}

function formatPhone(ddd?: string | null, phone?: string | null) {
  if (!ddd || !phone) {
    return "-"
  }

  return `(${ddd}) ${phone}`
}

function InfoItem({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <div className="rounded-[22px] border border-[#dfe7f7] bg-[#f8fbff] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#002198]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-black">
        {value || "-"}
      </p>
    </div>
  )
}

export default function ConsultaCnpjPage() {
  const [cnpj, setCnpj] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<CnpjApiResponse["data"] | null>(null)

  const cnpjNumbers = useMemo(() => onlyNumbers(cnpj), [cnpj])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError("")
    setResult(null)

    if (cnpjNumbers.length !== 14) {
      setError("Informe um CNPJ válido com 14 números.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/cnpj/${cnpjNumbers}`)
      const payload = (await response.json()) as CnpjApiResponse

      if (!response.ok || !payload.ok) {
        setError(
          payload.message ||
            "Não foi possível consultar este CNPJ agora. Tente novamente."
        )
        return
      }

      setResult(payload.data || null)
    } catch {
      setError(
        "Falha ao consultar o CNPJ. Verifique sua conexão e tente novamente."
      )
    } finally {
      setLoading(false)
    }
  }

  const estabelecimento = result?.estabelecimento
  const socios = result?.socios || []
  const inscricoesEstaduais = estabelecimento?.inscricoes_estaduais || []

  const atividadesSecundarias =
    estabelecimento?.atividades_secundarias?.filter((atividade) =>
      Boolean(atividade.descricao)
    ) || []

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            eyebrow="Consulta operacional"
            title="Consulta de CNPJ"
            subtitle="Consulte dados públicos de uma empresa para validar informações antes de seguir com cadastros, análises ou conferências internas."
          />

          <Link
            href="/master/torre-controle"
            className="inline-flex w-fit items-center justify-center rounded-full border border-[#dfe7f7] bg-white px-5 py-3 text-sm font-semibold text-[#002198] shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
          >
            Voltar para Torre
          </Link>
        </div>

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                Busca rápida
              </p>

              <h2 className="mt-2 text-2xl font-bold text-black">
                Informe o CNPJ da empresa
              </h2>

              <p className="mt-2 text-sm leading-7 text-neutral-600">
                A consulta é apenas visual neste MVP. Nenhuma informação será
                salva no banco de dados.
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <input
  		value={cnpj}
  			onChange={(event) =>
    			setCnpj(formatCnpjInput(event.target.value))
  			}
  			placeholder="00.000.000/0000-00"
  			maxLength={18}
                className="h-12 rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm font-medium text-black outline-none transition placeholder:text-neutral-400 focus:border-[#002198] focus:ring-4 focus:ring-[#002198]/10"
              />

              <button
                type="submit"
                disabled={loading}
                className="h-12 rounded-2xl bg-[#002198] px-6 text-sm font-bold text-white shadow-[0_14px_30px_rgba(0,33,152,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(0,33,152,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Consultando..." : "Consultar CNPJ"}
              </button>
            </div>

            {error ? (
              <div className="rounded-[22px] border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium leading-6 text-red-700">
                  {error}
                </p>
              </div>
            ) : null}
          </form>
        </Card>

        {result ? (
          <div className="space-y-6">
            <Card className="p-6 sm:p-8">
              <div className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                  Dados principais
                </p>

                <h2 className="mt-2 text-2xl font-bold text-black">
                  {result.razao_social || "Empresa consultada"}
                </h2>

                <p className="mt-2 text-sm leading-7 text-neutral-600">
                  Informações cadastrais retornadas pela base pública de CNPJ.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <InfoItem
                  label="CNPJ"
                  value={formatCnpj(estabelecimento?.cnpj)}
                />
                <InfoItem
                  label="Nome fantasia"
                  value={estabelecimento?.nome_fantasia || "Não informado"}
                />
                <InfoItem
                  label="Situação"
                  value={estabelecimento?.situacao_cadastral}
                />
                <InfoItem label="Tipo" value={estabelecimento?.tipo} />
                <InfoItem
                  label="Abertura"
                  value={formatDate(estabelecimento?.data_inicio_atividade)}
                />
                <InfoItem label="Porte" value={result.porte?.descricao} />
                <InfoItem
                  label="Natureza jurídica"
                  value={result.natureza_juridica?.descricao}
                />
                <InfoItem
                  label="Capital social"
                  value={formatMoney(result.capital_social)}
                />
                <InfoItem
                  label="Simples Nacional"
                  value={result.simples?.simples || "Não informado"}
                />
                <InfoItem
                  label="MEI"
                  value={result.simples?.mei || "Não informado"}
                />
                <InfoItem
                  label="Atualizado em"
                  value={formatDate(result.simples?.atualizado_em)}
                />
              </div>
            </Card>

            <Card className="p-6 sm:p-8">
              <div className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                  Inscrição estadual
                </p>

                <h2 className="mt-2 text-2xl font-bold text-black">
                  Inscrições estaduais encontradas
                </h2>

                <p className="mt-2 text-sm leading-7 text-neutral-600">
                  Quando a base pública retornar inscrição estadual, ela aparece
                  aqui para conferência operacional.
                </p>
              </div>

              {inscricoesEstaduais.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {inscricoesEstaduais.map((inscricao, index) => (
                    <div
                      key={`${inscricao.inscricao_estadual}-${index}`}
                      className="rounded-[22px] border border-[#dfe7f7] bg-[#f8fbff] p-4"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#002198]">
                        {inscricao.estado?.sigla || "UF não informada"}
                      </p>

                      <p className="mt-2 text-lg font-bold text-black">
                        {inscricao.inscricao_estadual || "Não informada"}
                      </p>

                      <p className="mt-2 text-sm font-medium text-neutral-600">
                        {inscricao.ativo
                          ? "Inscrição ativa"
                          : "Inscrição inativa"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[22px] border border-[#dfe7f7] bg-[#f8fbff] p-5">
                  <p className="text-sm leading-6 text-neutral-600">
                    Nenhuma inscrição estadual foi retornada para este CNPJ na
                    consulta atual.
                  </p>
                </div>
              )}
            </Card>

            <Card className="p-6 sm:p-8">
              <div className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                  Atividade econômica
                </p>

                <h2 className="mt-2 text-2xl font-bold text-black">
                  CNAE principal
                </h2>
              </div>

              <div className="space-y-4">
                <InfoItem
                  label={estabelecimento?.atividade_principal?.id || "CNAE"}
                  value={estabelecimento?.atividade_principal?.descricao}
                />

                {atividadesSecundarias.length > 0 ? (
                  <div className="rounded-[22px] border border-[#dfe7f7] bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#002198]">
                      Atividades secundárias
                    </p>

                    <div className="mt-3 space-y-2">
                      {atividadesSecundarias.map((atividade, index) => (
                        <p
                          key={`${atividade.id}-${index}`}
                          className="text-sm leading-6 text-neutral-700"
                        >
                          <span className="font-semibold text-black">
                            {atividade.id || "CNAE"}:
                          </span>{" "}
                          {atividade.descricao}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>

            <Card className="p-6 sm:p-8">
              <div className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                  Localização e contato
                </p>

                <h2 className="mt-2 text-2xl font-bold text-black">
                  Endereço da empresa
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <InfoItem
                  label="Logradouro"
                  value={`${estabelecimento?.logradouro || "-"}, ${
                    estabelecimento?.numero || "S/N"
                  }`}
                />
                <InfoItem
                  label="Complemento"
                  value={estabelecimento?.complemento || "Não informado"}
                />
                <InfoItem label="Bairro" value={estabelecimento?.bairro} />
                <InfoItem
                  label="Cidade/UF"
                  value={`${estabelecimento?.cidade?.nome || "-"} / ${
                    estabelecimento?.estado?.sigla || "-"
                  }`}
                />
                <InfoItem label="CEP" value={formatCep(estabelecimento?.cep)} />
                <InfoItem label="E-mail" value={estabelecimento?.email} />
                <InfoItem
                  label="Telefone principal"
                  value={formatPhone(
                    estabelecimento?.ddd1,
                    estabelecimento?.telefone1
                  )}
                />
                <InfoItem
                  label="Telefone secundário"
                  value={formatPhone(
                    estabelecimento?.ddd2,
                    estabelecimento?.telefone2
                  )}
                />
              </div>
            </Card>

            <Card className="p-6 sm:p-8">
              <div className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                  Quadro societário
                </p>

                <h2 className="mt-2 text-2xl font-bold text-black">
                  Sócios encontrados
                </h2>

                <p className="mt-2 text-sm leading-7 text-neutral-600">
                  Quando a base pública retornar sócios, eles aparecerão abaixo
                  para conferência.
                </p>
              </div>

              {socios.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {socios.map((socio, index) => (
                    <div
                      key={`${socio.nome}-${index}`}
                      className="rounded-[22px] border border-[#dfe7f7] bg-[#f8fbff] p-4"
                    >
                      <p className="text-sm font-bold text-black">
                        {socio.nome || "Sócio sem nome informado"}
                      </p>

                      <p className="mt-2 text-sm leading-6 text-neutral-600">
                        {socio.qualificacao_socio?.descricao ||
                          "Qualificação não informada"}
                      </p>

                      <p className="mt-2 text-xs font-medium text-neutral-500">
                        Entrada: {formatDate(socio.data_entrada)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[22px] border border-[#dfe7f7] bg-[#f8fbff] p-5">
                  <p className="text-sm leading-6 text-neutral-600">
                    Nenhum sócio foi retornado para este CNPJ na consulta atual.
                  </p>
                </div>
              )}
            </Card>
          </div>
        ) : null}
      </div>
    </PageContainer>
  )
}