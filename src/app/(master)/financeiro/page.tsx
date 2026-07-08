// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\(master)\financeiro\page.tsx

"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import PageContainer from "@/components/layout/PageContainer"
import PageHeader from "@/components/layout/PageHeader"
import { Card, Input } from "@/components/ui"

type SituacaoFilter =
  | "todos"
  | "aberta"
  | "paga"
  | "vencida"
  | "cancelada"
  | "erro"

type PeriodoFiltro =
  | "todos"
  | "este_mes"
  | "mes_passado"
  | "mes"
  | "personalizado"

type ApiPayload = {
  ok?: boolean
  success?: boolean
  message?: string
  error?: string
  data?: unknown
  items?: unknown
  financeiro?: unknown
  cobrancas?: unknown
}

type FinanceiroRow = {
  id?: string | null
  business_id?: string | null

  documento_cliente?: string | null
  cpf_cnpj?: string | null
  documento?: string | null

  razao_social?: string | null
  nome_cliente?: string | null
  cliente_nome?: string | null
  cliente?: string | null
  business_name?: string | null
  name?: string | null
  nome_responsavel?: string | null

  tipo?: string | null
  tipo_label?: string | null
  ciclo_tipo?: string | null

  status?: string | null
  situacao?: string | null
  cobranca_status?: string | null
  sync_status?: string | null

  valor?: number | null
  cobranca_valor?: number | null
  amount?: number | null

  vencimento?: string | null
  pago_em?: string | null
  created_at?: string | null
  competencia?: string | null

  bling_cobranca_id?: string | null
  bling_numero_documento?: string | null
  bling_documento?: string | null
  bling_link_pagamento?: string | null
  ultima_consulta_bling_em?: string | null
}

type Summary = {
  total: number
  totalValor: number
  aReceber: number
  recebido: number
  vencido: number
  pendencias: number
}

const situacaoOptions: Array<{
  value: SituacaoFilter
  label: string
}> = [
  { value: "todos", label: "Todos" },
  { value: "aberta", label: "Aberta" },
  { value: "paga", label: "Paga" },
  { value: "vencida", label: "Vencida" },
  { value: "cancelada", label: "Cancelada" },
  { value: "erro", label: "Com erro" },
]

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return {}
}

function extractArray(payload: ApiPayload | null): FinanceiroRow[] {
  if (!payload) return []

  if (Array.isArray(payload.data)) return payload.data as FinanceiroRow[]
  if (Array.isArray(payload.items)) return payload.items as FinanceiroRow[]
  if (Array.isArray(payload.financeiro)) return payload.financeiro as FinanceiroRow[]
  if (Array.isArray(payload.cobrancas)) return payload.cobrancas as FinanceiroRow[]

  const data = asRecord(payload.data)

  if (Array.isArray(data.items)) return data.items as FinanceiroRow[]
  if (Array.isArray(data.financeiro)) return data.financeiro as FinanceiroRow[]
  if (Array.isArray(data.cobrancas)) return data.cobrancas as FinanceiroRow[]
  if (Array.isArray(data.data)) return data.data as FinanceiroRow[]

  return []
}

function getNumber(value: unknown) {
  const numberValue = Number(value ?? 0)

  return Number.isFinite(numberValue) ? numberValue : 0
}

function getValor(row: FinanceiroRow) {
  return getNumber(row.valor ?? row.cobranca_valor ?? row.amount)
}

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(getNumber(value))
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—"

  const cleanValue = String(value).substring(0, 10)
  const [year, month, day] = cleanValue.split("-")

  if (!year || !month || !day) return "—"

  return `${day}/${month}/${year}`
}

function isPastDate(value: string | null | undefined) {
  if (!value) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const date = new Date(`${String(value).substring(0, 10)}T00:00:00`)
  date.setHours(0, 0, 0, 0)

  return Number.isFinite(date.getTime()) && date < today
}

function formatarDataInputLocal(data: Date) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")

  return `${ano}-${mes}-${dia}`
}

function formatarMesInputLocal(data: Date) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")

  return `${ano}-${mes}`
}

function getDatasMesAtual() {
  const hoje = new Date()

  return {
    dataInicial: formatarDataInputLocal(
      new Date(hoje.getFullYear(), hoje.getMonth(), 1),
    ),
    dataFinal: formatarDataInputLocal(
      new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0),
    ),
  }
}

function getDatasMesPassado() {
  const hoje = new Date()

  return {
    dataInicial: formatarDataInputLocal(
      new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1),
    ),
    dataFinal: formatarDataInputLocal(
      new Date(hoje.getFullYear(), hoje.getMonth(), 0),
    ),
  }
}

function getDatasDoMesSelecionado(valorMes: string) {
  const [anoTexto, mesTexto] = valorMes.split("-")

  const ano = Number(anoTexto)
  const mesIndex = Number(mesTexto) - 1

  return {
    dataInicial: formatarDataInputLocal(new Date(ano, mesIndex, 1)),
    dataFinal: formatarDataInputLocal(new Date(ano, mesIndex + 1, 0)),
  }
}

function formatarMesAnoBR(valorMes: string) {
  if (!valorMes) return "—"

  const [ano, mes] = valorMes.split("-")

  const nomesMeses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ]

  return `${nomesMeses[Number(mes) - 1]} de ${ano}`
}

function formatCompetencia(value: string | null | undefined) {
  if (!value) return null

  const cleanValue = String(value).trim()

  const matchAnoMes = cleanValue.match(/^(\d{4})-(\d{2})$/)
  if (matchAnoMes) {
    return `${matchAnoMes[2]}-${matchAnoMes[1]}`
  }

  const matchMesAnoBarra = cleanValue.match(/^(\d{2})\/(\d{4})$/)
  if (matchMesAnoBarra) {
    return `${matchMesAnoBarra[1]}-${matchMesAnoBarra[2]}`
  }

  const matchAnoMesSemSeparador = cleanValue.match(/^(\d{4})(\d{2})$/)
  if (matchAnoMesSemSeparador) {
    return `${matchAnoMesSemSeparador[2]}-${matchAnoMesSemSeparador[1]}`
  }

  return cleanValue
}

function getClienteDocumento(row: FinanceiroRow) {
  return (
    row.documento_cliente ||
    row.cpf_cnpj ||
    row.documento ||
    "Documento não informado"
  )
}

function getClienteRazaoSocial(row: FinanceiroRow) {
  return (
    row.razao_social ||
    row.cliente_nome ||
    row.cliente ||
    row.business_name ||
    row.name ||
    "Cliente não identificado"
  )
}

function getClienteNome(row: FinanceiroRow) {
  return (
    row.nome_cliente ||
    row.nome_responsavel ||
    row.cliente_nome ||
    row.cliente ||
    "Nome não informado"
  )
}

function getTipoLabel(row: FinanceiroRow) {
  const raw = normalizeText(row.tipo_label || row.tipo || row.ciclo_tipo)

  if (!raw) return "—"

  if (
    raw.includes("first") ||
    raw.includes("ativacao") ||
    raw.includes("activation") ||
    raw === "first_charge"
  ) {
    return "Ativação"
  }

  if (
    raw.includes("recurring") ||
    raw.includes("recurr") ||
    raw.includes("recorr") ||
    raw.includes("renov") ||
    raw.includes("renew") ||
    raw === "recurring_charge"
  ) {
    return "Recorrência"
  }

  if (raw.includes("cancel")) {
    return "Cancelamento"
  }

  return row.tipo_label || row.tipo || row.ciclo_tipo || "—"
}

function getSituacaoCode(row: FinanceiroRow): SituacaoFilter {
  const status = normalizeText(row.situacao || row.status || row.cobranca_status)
  const syncStatus = normalizeText(row.sync_status)

  if (status === "error" || syncStatus === "error") return "erro"

  if (
    status === "paid" ||
    status === "paga" ||
    status === "pago" ||
    status === "recebida" ||
    status === "recebido"
  ) {
    return "paga"
  }

  if (
    status === "canceled" ||
    status === "cancelada" ||
    status === "cancelado" ||
    status === "cancelled"
  ) {
    return "cancelada"
  }

  if (
    status === "overdue" ||
    status === "vencida" ||
    status === "vencido" ||
    isPastDate(row.vencimento)
  ) {
    return "vencida"
  }

  return "aberta"
}

function getSituacaoLabel(row: FinanceiroRow) {
  const code = getSituacaoCode(row)

  if (code === "aberta") return "Aberta"
  if (code === "paga") return "Paga"
  if (code === "vencida") return "Vencida"
  if (code === "cancelada") return "Cancelada"
  if (code === "erro") return "Com erro"

  return "Aberta"
}

function isDateInRange(
  value: string | null | undefined,
  dateFrom: string,
  dateTo: string,
) {
  if (!dateFrom && !dateTo) return true
  if (!value) return false

  const cleanValue = String(value).substring(0, 10)

  if (dateFrom && cleanValue < dateFrom) return false
  if (dateTo && cleanValue > dateTo) return false

  return true
}

function matchesPeriodo(row: FinanceiroRow, dateFrom: string, dateTo: string) {
  if (!dateFrom && !dateTo) return true

  return (
    isDateInRange(row.vencimento, dateFrom, dateTo) ||
    isDateInRange(row.pago_em, dateFrom, dateTo) ||
    isDateInRange(row.created_at, dateFrom, dateTo)
  )
}

function getBlingDocumento(row: FinanceiroRow) {
  return row.bling_numero_documento || row.bling_documento || "—"
}

function getBlingId(row: FinanceiroRow) {
  return row.bling_cobranca_id || "—"
}

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string | number
  subtitle: string
}) {
  return (
    <Card className="rounded-[26px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-black">{value}</p>

      <p className="mt-1 text-sm leading-6 text-neutral-600">{subtitle}</p>
    </Card>
  )
}

export default function FinanceiroPage() {
  const [items, setItems] = useState<FinanceiroRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [situacaoFilter, setSituacaoFilter] =
    useState<SituacaoFilter>("todos")

  const [menuPeriodoAberto, setMenuPeriodoAberto] = useState(false)
  const [periodoSelecionado, setPeriodoSelecionado] =
    useState<PeriodoFiltro>("todos")
  const [rascunhoPeriodo, setRascunhoPeriodo] =
    useState<PeriodoFiltro>("todos")
  const [rascunhoMes, setRascunhoMes] = useState("")
  const [rascunhoDataInicial, setRascunhoDataInicial] = useState("")
  const [rascunhoDataFinal, setRascunhoDataFinal] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const menuPeriodoRef = useRef<HTMLDivElement | null>(null)

  const loadFinanceiro = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/master/financeiro", {
        method: "GET",
        cache: "no-store",
      })

      const payload = (await response.json()) as ApiPayload

      if (!response.ok || payload?.ok === false || payload?.success === false) {
        throw new Error(
          payload?.message ||
            payload?.error ||
            "Não foi possível carregar o financeiro.",
        )
      }

      setItems(extractArray(payload))
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Erro desconhecido ao carregar financeiro.",
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFinanceiro()
  }, [loadFinanceiro])

  useEffect(() => {
    if (!menuPeriodoAberto) return

    function handleClickFora(event: MouseEvent) {
      if (
        menuPeriodoRef.current &&
        !menuPeriodoRef.current.contains(event.target as Node)
      ) {
        setMenuPeriodoAberto(false)
      }
    }

    document.addEventListener("mousedown", handleClickFora)

    return () => {
      document.removeEventListener("mousedown", handleClickFora)
    }
  }, [menuPeriodoAberto])

  const filteredItems = useMemo(() => {
    const cleanSearch = normalizeText(search)

    return items.filter((item) => {
      const situacao = getSituacaoCode(item)

      const matchesSituacao =
        situacaoFilter === "todos" || situacaoFilter === situacao

      const matchesDate = matchesPeriodo(item, dateFrom, dateTo)

      const searchable = normalizeText([
        getClienteDocumento(item),
        getClienteRazaoSocial(item),
        getClienteNome(item),
        getTipoLabel(item),
        getSituacaoLabel(item),
        getValor(item),
        item.competencia,
        formatCompetencia(item.competencia),
        item.vencimento,
        item.pago_em,
        item.bling_cobranca_id,
        item.bling_numero_documento,
      ].join(" "))

      const matchesSearch = !cleanSearch || searchable.includes(cleanSearch)

      return matchesSituacao && matchesDate && matchesSearch
    })
  }, [dateFrom, dateTo, items, search, situacaoFilter])

  const summary = useMemo<Summary>(() => {
    return filteredItems.reduce(
      (acc, item) => {
        const situacao = getSituacaoCode(item)
        const valor = getValor(item)

        acc.total += 1

        if (situacao !== "cancelada") {
          acc.totalValor += valor
        }

        if (situacao === "paga") {
          acc.recebido += valor
        }

        if (situacao === "aberta" || situacao === "vencida") {
          acc.aReceber += valor
        }

        if (situacao === "vencida") {
          acc.vencido += valor
        }

        if (situacao === "erro" || situacao === "vencida") {
          acc.pendencias += 1
        }

        return acc
      },
      {
        total: 0,
        totalValor: 0,
        aReceber: 0,
        recebido: 0,
        vencido: 0,
        pendencias: 0,
      },
    )
  }, [filteredItems])

  const textoPeriodoBotao = useMemo(() => {
    if (periodoSelecionado === "este_mes") return "Este mês"
    if (periodoSelecionado === "mes_passado") return "Mês passado"
    if (periodoSelecionado === "mes") return "Selecionar mês"
    if (periodoSelecionado === "personalizado") return "Personalizado"

    return "Tudo"
  }, [periodoSelecionado])

  const resumoFiltro = useMemo(() => {
    if (periodoSelecionado === "todos") {
      return "Filtro aplicado: tudo"
    }

    if (periodoSelecionado === "este_mes") {
      return "Filtro aplicado: este mês"
    }

    if (periodoSelecionado === "mes_passado") {
      return "Filtro aplicado: mês passado"
    }

    if (periodoSelecionado === "mes") {
      return `Filtro aplicado: ${formatarMesAnoBR(rascunhoMes)}`
    }

    return `Filtro aplicado: ${formatDate(dateFrom)} até ${formatDate(dateTo)}`
  }, [dateFrom, dateTo, periodoSelecionado, rascunhoMes])

  function abrirMenuPeriodo() {
    const mesAtual = formatarMesInputLocal(new Date())

    setRascunhoPeriodo(periodoSelecionado)
    setRascunhoMes(rascunhoMes || mesAtual)
    setRascunhoDataInicial(dateFrom)
    setRascunhoDataFinal(dateTo)
    setMenuPeriodoAberto(true)
  }

  function aplicarTudo() {
    setPeriodoSelecionado("todos")
    setRascunhoPeriodo("todos")
    setRascunhoMes("")
    setRascunhoDataInicial("")
    setRascunhoDataFinal("")
    setDateFrom("")
    setDateTo("")
    setMenuPeriodoAberto(false)
  }

  function aplicarPeriodoRapido(tipoPeriodo: "este_mes" | "mes_passado") {
    const datas =
      tipoPeriodo === "este_mes" ? getDatasMesAtual() : getDatasMesPassado()

    const hoje = new Date()
    const mesReferencia =
      tipoPeriodo === "este_mes"
        ? formatarMesInputLocal(hoje)
        : formatarMesInputLocal(
            new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1),
          )

    setPeriodoSelecionado(tipoPeriodo)
    setRascunhoPeriodo(tipoPeriodo)
    setRascunhoMes(mesReferencia)
    setRascunhoDataInicial(datas.dataInicial)
    setRascunhoDataFinal(datas.dataFinal)
    setDateFrom(datas.dataInicial)
    setDateTo(datas.dataFinal)
    setMenuPeriodoAberto(false)
  }

  function aplicarMesSelecionado(valorMes: string) {
    if (!valorMes) return

    const datas = getDatasDoMesSelecionado(valorMes)

    setPeriodoSelecionado("mes")
    setRascunhoPeriodo("mes")
    setRascunhoMes(valorMes)
    setRascunhoDataInicial(datas.dataInicial)
    setRascunhoDataFinal(datas.dataFinal)
    setDateFrom(datas.dataInicial)
    setDateTo(datas.dataFinal)
  }

  function limparFiltros() {
    setSearch("")
    setSituacaoFilter("todos")
    aplicarTudo()
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Torre de controle"
          title="Financeiro"
          subtitle="Controle de contas a receber e recebidas do SaaS, com vencimentos, pagamentos e conferência no Bling."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            title="Total"
            value={summary.total}
            subtitle="Cobranças no filtro atual."
          />

          <SummaryCard
            title="Total previsto"
            value={formatMoney(summary.totalValor)}
            subtitle="Tudo no filtro, sem canceladas."
          />

          <SummaryCard
            title="A receber"
            value={formatMoney(summary.aReceber)}
            subtitle="Abertas e vencidas."
          />

          <SummaryCard
            title="Recebido"
            value={formatMoney(summary.recebido)}
            subtitle="Pagas no filtro atual."
          />

          <SummaryCard
            title="Vencido"
            value={formatMoney(summary.vencido)}
            subtitle="Vencidas no filtro atual."
          />
        </div>

        <Card className="overflow-visible rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                Filtros
              </p>

              <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_auto]">
                <div>
                  <label className="text-sm font-medium text-black">
                    Buscar no financeiro
                  </label>

                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cliente, documento, tipo, situação, Bling ou competência"
                    className="mt-2 h-11"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-black">
                    Situação
                  </label>

                  <select
                    value={situacaoFilter}
                    onChange={(event) =>
                      setSituacaoFilter(event.target.value as SituacaoFilter)
                    }
                    className="mt-2 h-11 w-full rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm text-black outline-none transition focus:border-[#002198] focus:ring-2 focus:ring-[#002198]/10"
                  >
                    {situacaoOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={limparFiltros}
                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm font-semibold text-[#002198] transition hover:bg-[#eef3ff] xl:w-auto"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#dfe7f7] bg-[#f8fbff] p-4">
                <p className="text-sm font-semibold text-black">
                  Os resultados atualizam automaticamente.
                </p>
              </div>
            </div>

            <div className="w-full shrink-0 lg:w-[330px]">
              <div className="rounded-[22px] border border-[#dfe7f7] bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <div className="relative" ref={menuPeriodoRef}>
                  <label className="text-xs font-bold uppercase tracking-[0.14em] text-[#002198]">
                    Período
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (menuPeriodoAberto) {
                        setMenuPeriodoAberto(false)
                        return
                      }

                      abrirMenuPeriodo()
                    }}
                    className={[
                      "mt-2 flex h-10 w-full items-center justify-between rounded-2xl border px-3 text-sm font-semibold transition",
                      menuPeriodoAberto
                        ? "border-[#002198] bg-[#f8fbff] text-[#002198]"
                        : "border-[#dfe7f7] bg-white text-black hover:bg-[#f8fbff]",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-2 text-left">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#eef3ff] text-xs">
                        📅
                      </span>
                      {textoPeriodoBotao}
                    </span>

                    <span className="text-[10px] text-[#002198]">
                      {menuPeriodoAberto ? "▲" : "▼"}
                    </span>
                  </button>

                  {menuPeriodoAberto ? (
                    <div className="absolute right-0 z-20 mt-2 w-full rounded-[20px] border border-[#dfe7f7] bg-white p-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={aplicarTudo}
                          className={[
                            "flex h-9 w-full items-center justify-between rounded-2xl px-3 text-sm font-semibold transition",
                            periodoSelecionado === "todos"
                              ? "bg-[#eef3ff] text-[#002198]"
                              : "bg-white text-black hover:bg-[#f8fbff]",
                          ].join(" ")}
                        >
                          Tudo
                        </button>

                        <button
                          type="button"
                          onClick={() => aplicarPeriodoRapido("este_mes")}
                          className="flex h-9 w-full items-center rounded-2xl px-3 text-sm font-semibold text-black transition hover:bg-[#f8fbff]"
                        >
                          Este mês
                        </button>

                        <button
                          type="button"
                          onClick={() => aplicarPeriodoRapido("mes_passado")}
                          className="flex h-9 w-full items-center rounded-2xl px-3 text-sm font-semibold text-black transition hover:bg-[#f8fbff]"
                        >
                          Mês passado
                        </button>

                        <input
                          type="month"
                          value={rascunhoMes}
                          onChange={(event) =>
                            aplicarMesSelecionado(event.target.value)
                          }
                          className="h-9 w-full rounded-2xl border border-[#dfe7f7] bg-white px-3 text-sm text-black outline-none transition focus:border-[#002198]"
                        />

                        <button
                          type="button"
                          onClick={() => setMenuPeriodoAberto(false)}
                          className="flex h-9 w-full items-center rounded-2xl px-3 text-sm font-semibold text-neutral-600 transition hover:bg-[#f8fbff]"
                        >
                          Fechar
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 rounded-2xl border border-[#dfe7f7] bg-[#f8fbff] px-3 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#002198]">
                    Filtro aplicado
                  </p>

                  <p className="mt-0.5 text-xs font-semibold text-black">
                    {resumoFiltro}
                  </p>

                  <p className="mt-1 text-[11px] leading-4 text-neutral-500">
                    Usa vencimento, pagamento ou criação da cobrança.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {error ? (
          <Card className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 shadow-none">
            <p className="text-sm font-semibold text-rose-700">{error}</p>
          </Card>
        ) : null}

        {loading ? (
          <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <p className="text-base font-semibold text-black">
              Carregando financeiro...
            </p>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <p className="text-base font-semibold text-black">
              Nenhum registro financeiro encontrado.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-[#dfe7f7] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <div className="grid grid-cols-[1.35fr_0.9fr_0.48fr_0.65fr_0.9fr_1fr] items-start gap-4 border-b border-[#dfe7f7] bg-[#f8fbff] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#002198]">
              <span>Cliente</span>
              <span>Tipo</span>
              <span>Situação</span>
              <span className="text-center">Valor</span>
              <span>Data</span>
              <span>Bling</span>
            </div>

            <div className="divide-y divide-[#dfe7f7]">
              {filteredItems.map((item, index) => (
                <div
                  key={item.id || `${item.business_id}-${index}`}
                  className="grid grid-cols-[1.35fr_0.9fr_0.48fr_0.65fr_0.9fr_1fr] items-start gap-4 px-5 py-4 text-sm leading-6 text-neutral-700"
                >
                  <div>
                    <p className="text-[#002198]">
                      {getClienteDocumento(item)}
                    </p>

                    <p className="text-black">
                      {getClienteRazaoSocial(item)}
                    </p>

                    <p className="text-neutral-700">
                      {getClienteNome(item)}
                    </p>
                  </div>

                  <div>
                    <p>{getTipoLabel(item)}</p>

                    {formatCompetencia(item.competencia) ? (
                      <p className="text-neutral-500">
                        Competência: {formatCompetencia(item.competencia)}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <p>{getSituacaoLabel(item)}</p>
                  </div>

                  <div className="text-center">
                    <p>{formatMoney(getValor(item))}</p>
                  </div>

                  <div>
                    <p>Venc.: {formatDate(item.vencimento)}</p>
                    <p>Pago: {formatDate(item.pago_em)}</p>
                  </div>

                  <div>
                    <p>ID: {getBlingId(item)}</p>
                    <p>Doc.: {getBlingDocumento(item)}</p>
                    <p>
                      Última consulta:{" "}
                      {formatDate(item.ultima_consulta_bling_em)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}