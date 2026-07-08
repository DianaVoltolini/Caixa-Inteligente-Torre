// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\(master)\financeiro\page.tsx

"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import PageContainer from "@/components/layout/PageContainer"
import PageHeader from "@/components/layout/PageHeader"
import { Card, Input } from "@/components/ui"

type StatusFilter =
  | "todos"
  | "a_receber"
  | "paid"
  | "vencido"
  | "pending_emission"
  | "canceled"
  | "error"
  | "needs_action"

type PeriodoFiltro =
  | "todos"
  | "este_mes"
  | "mes_passado"
  | "mes"
  | "personalizado"

type SituacaoFinanceira =
  | "a_receber"
  | "recebido"
  | "vencido"
  | "cancelado"
  | "erro"
  | "pendente_emissao"

type FinanceiroItem = {
  id: string
  virtual: boolean
  business_id: string
  assinatura_id: string | null
  cliente: string
  responsavel: string | null
  email_financeiro: string | null
  whatsapp: string | null
  assinatura_status: string | null
  plano: string | null
  forma_pagamento: string | null
  valor: number
  vencimento: string | null
  status: string | null
  situacao_code: SituacaoFinanceira
  situacao_label: string
  sync_status: string | null
  sync_error: string | null
  ciclo_tipo: string | null
  tipo_code: "ativacao" | "renovacao" | "outro"
  tipo_label: string
  competencia: string | null
  created_at: string | null
  gerada_em: string | null
  pago_em: string | null
  data_referencia: string | null
  bling_cobranca_id: string | null
  bling_numero_documento: string | null
  bling_link_pagamento: string | null
  bling_status_raw: string | null
  ultima_consulta_bling_em: string | null
  needs_action: boolean
}

type Summary = {
  totalCobrancas: number
  totalPrevisto: number
  aReceber: number
  aReceberCount: number
  recebido: number
  recebidoCount: number
  vencido: number
  vencidoCount: number
  cancelado: number
  canceladoCount: number
  pendenteEmissao: number
  pendenteEmissaoCount: number
  erros: number
  errosCount: number
  acaoManual: number
}

type FinanceiroResponse = {
  ok: boolean
  message?: string
  summary?: Partial<Summary>
  data?: FinanceiroItem[]
}

const emptySummary: Summary = {
  totalCobrancas: 0,
  totalPrevisto: 0,
  aReceber: 0,
  aReceberCount: 0,
  recebido: 0,
  recebidoCount: 0,
  vencido: 0,
  vencidoCount: 0,
  cancelado: 0,
  canceladoCount: 0,
  pendenteEmissao: 0,
  pendenteEmissaoCount: 0,
  erros: 0,
  errosCount: 0,
  acaoManual: 0,
}

function numberOrZero(value: unknown) {
  const number = Number(value)

  return Number.isFinite(number) ? number : 0
}

function normalizeSummary(summary?: Partial<Summary>): Summary {
  return {
    totalCobrancas: numberOrZero(summary?.totalCobrancas),
    totalPrevisto: numberOrZero(summary?.totalPrevisto),
    aReceber: numberOrZero(summary?.aReceber),
    aReceberCount: numberOrZero(summary?.aReceberCount),
    recebido: numberOrZero(summary?.recebido),
    recebidoCount: numberOrZero(summary?.recebidoCount),
    vencido: numberOrZero(summary?.vencido),
    vencidoCount: numberOrZero(summary?.vencidoCount),
    cancelado: numberOrZero(summary?.cancelado),
    canceladoCount: numberOrZero(summary?.canceladoCount),
    pendenteEmissao: numberOrZero(summary?.pendenteEmissao),
    pendenteEmissaoCount: numberOrZero(summary?.pendenteEmissaoCount),
    erros: numberOrZero(summary?.erros),
    errosCount: numberOrZero(summary?.errosCount),
    acaoManual: numberOrZero(summary?.acaoManual),
  }
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

function formatDate(value: string | null) {
  if (!value) return "—"

  const cleanValue = String(value).substring(0, 10)
  const [year, month, day] = cleanValue.split("-")

  if (!year || !month || !day) return "—"

  return `${day}/${month}/${year}`
}

function formatDateTime(value: string | null) {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "—"

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
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

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0))
}

function onlyNumbers(value: string | null) {
  return String(value ?? "").replace(/\D/g, "")
}

function getStatusClass(value: SituacaoFinanceira) {
  if (value === "recebido") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }

  if (value === "a_receber") {
    return "border-amber-200 bg-amber-50 text-amber-900"
  }

  if (value === "vencido" || value === "erro") {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  if (value === "pendente_emissao") {
    return "border-orange-200 bg-orange-50 text-orange-800"
  }

  if (value === "cancelado") {
    return "border-neutral-200 bg-neutral-50 text-neutral-700"
  }

  return "border-[#dfe7f7] bg-[#f8fbff] text-[#002198]"
}

function buildWhatsAppMessage(item: FinanceiroItem) {
  const link = item.bling_link_pagamento || ""
  const vencimento = formatDate(item.vencimento)
  const valor = formatMoney(item.valor)

  return [
    `Olá, ${item.responsavel || item.cliente}.`,
    "",
    "Segue o link da sua cobrança do Meu Caixa Inteligente.",
    "",
    `Valor: ${valor}`,
    `Vencimento: ${vencimento}`,
    "",
    link,
  ].join("\n")
}

function buildWhatsAppChargeUrl(item: FinanceiroItem) {
  const digits = onlyNumbers(item.whatsapp)

  if (!digits || !item.bling_link_pagamento) return null

  const phone = digits.startsWith("55") ? digits : `55${digits}`
  const message = encodeURIComponent(buildWhatsAppMessage(item))

  return `https://wa.me/${phone}?text=${message}`
}

function SummaryCard({
  label,
  value,
  helper,
  tone = "default",
  active = false,
  onClick,
}: {
  label: string
  value: string | number
  helper: string
  tone?: "default" | "success" | "warning" | "danger" | "blue" | "neutral"
  active?: boolean
  onClick: () => void
}) {
  const className =
    tone === "danger"
      ? "border border-rose-200 bg-rose-50"
      : tone === "success"
        ? "border border-emerald-200 bg-emerald-50"
        : tone === "warning"
          ? "border border-amber-200 bg-amber-50"
          : tone === "blue"
            ? "border border-[#cfd8ff] bg-[#eef3ff]"
            : tone === "neutral"
              ? "border border-neutral-200 bg-neutral-50"
              : "border border-[#dfe7f7] bg-white"

  const valueClass =
    tone === "danger"
      ? "text-rose-800"
      : tone === "success"
        ? "text-emerald-800"
        : tone === "warning"
          ? "text-amber-800"
          : "text-black"

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-[24px] p-4 text-left shadow-[0_14px_34px_rgba(15,23,42,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.07)]",
        className,
        active ? "ring-2 ring-[#002198] ring-offset-2" : "",
      ].join(" ")}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
        {label}
      </p>

      <p className={["mt-3 text-2xl font-bold", valueClass].join(" ")}>
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-neutral-600">{helper}</p>
    </button>
  )
}

export default function FinanceiroPage() {
  const [items, setItems] = useState<FinanceiroItem[]>([])
  const [summary, setSummary] = useState<Summary>(emptySummary)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("todos")

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

  const queryString = useMemo(() => {
    const params = new URLSearchParams()

    params.set("limit", "2000")
    params.set("status", status)

    if (search.trim()) {
      params.set("search", search.trim())
    }

    if (dateFrom) {
      params.set("dateFrom", dateFrom)
    }

    if (dateTo) {
      params.set("dateTo", dateTo)
    }

    return params.toString()
  }, [dateFrom, dateTo, search, status])

  const loadFinanceiro = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/master/financeiro?${queryString}`, {
        method: "GET",
        cache: "no-store",
      })

      const payload = (await response.json()) as FinanceiroResponse

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.message || "Não foi possível carregar o financeiro.",
        )
      }

      setItems(payload.data ?? [])
      setSummary(normalizeSummary(payload.summary))
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Erro ao carregar financeiro.",
      )
      setItems([])
      setSummary(emptySummary)
    } finally {
      setLoading(false)
    }
  }, [queryString])

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

  function abrirSelecionarMes() {
    const mesAtual = formatarMesInputLocal(new Date())

    setRascunhoPeriodo("mes")
    setRascunhoMes(rascunhoMes || mesAtual)
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

  function abrirPeriodoPersonalizado() {
    const datasMesAtual = getDatasMesAtual()

    setRascunhoPeriodo("personalizado")
    setRascunhoDataInicial(dateFrom || datasMesAtual.dataInicial)
    setRascunhoDataFinal(dateTo || datasMesAtual.dataFinal)
  }

  function aplicarDataInicialPersonalizada(value: string) {
    setRascunhoDataInicial(value)
    setPeriodoSelecionado("personalizado")
    setRascunhoPeriodo("personalizado")
    setDateFrom(value)

    if (rascunhoDataFinal) {
      setDateTo(rascunhoDataFinal)
    }
  }

  function aplicarDataFinalPersonalizada(value: string) {
    setRascunhoDataFinal(value)
    setPeriodoSelecionado("personalizado")
    setRascunhoPeriodo("personalizado")
    setDateTo(value)

    if (rascunhoDataInicial) {
      setDateFrom(rascunhoDataInicial)
    }
  }

  function limparFiltros() {
    setSearch("")
    setStatus("todos")
    aplicarTudo()
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Torre de controle"
          title="Financeiro"
          subtitle="Controle financeiro das contas a receber, recebidas, vencidas e pendentes de emissão."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <SummaryCard
            label="Total previsto"
            value={formatMoney(summary.totalPrevisto)}
            helper={`${summary.totalCobrancas} registro(s) no filtro.`}
            tone="blue"
            active={status === "todos"}
            onClick={() => setStatus("todos")}
          />

          <SummaryCard
            label="A receber"
            value={formatMoney(summary.aReceber)}
            helper={`${summary.aReceberCount} cobrança(s) aberta(s).`}
            tone="warning"
            active={status === "a_receber"}
            onClick={() => setStatus("a_receber")}
          />

          <SummaryCard
            label="Recebido"
            value={formatMoney(summary.recebido)}
            helper={`${summary.recebidoCount} cobrança(s) paga(s).`}
            tone="success"
            active={status === "paid"}
            onClick={() => setStatus("paid")}
          />

          <SummaryCard
            label="Vencido"
            value={formatMoney(summary.vencido)}
            helper={`${summary.vencidoCount} cobrança(s) vencida(s).`}
            tone={summary.vencido > 0 ? "danger" : "default"}
            active={status === "vencido"}
            onClick={() => setStatus("vencido")}
          />

          <SummaryCard
            label="Pendente emissão"
            value={formatMoney(summary.pendenteEmissao)}
            helper={`${summary.pendenteEmissaoCount} item(ns) sem cobrança.`}
            tone={summary.pendenteEmissaoCount > 0 ? "warning" : "default"}
            active={status === "pending_emission"}
            onClick={() => setStatus("pending_emission")}
          />

          <SummaryCard
            label="Ação necessária"
            value={summary.acaoManual}
            helper={`${summary.errosCount} com erro.`}
            tone={summary.acaoManual > 0 ? "danger" : "default"}
            active={status === "needs_action"}
            onClick={() => setStatus("needs_action")}
          />
        </div>

        <Card className="overflow-visible rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                Filtros
              </p>

              <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_240px_auto]">
                <div>
                  <label className="text-sm font-medium text-black">
                    Buscar no financeiro
                  </label>

                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cliente, responsável, e-mail, WhatsApp, Bling ou competência"
                    className="mt-2 h-11"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-black">
                    Situação
                  </label>

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as StatusFilter)
                    }
                    className="mt-2 h-11 w-full rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm text-black outline-none transition focus:border-[#002198] focus:ring-2 focus:ring-[#002198]/10"
                  >
                    <option value="todos">Todos</option>
                    <option value="a_receber">A receber</option>
                    <option value="paid">Recebido</option>
                    <option value="vencido">Vencido</option>
                    <option value="pending_emission">
                      Pendente de emissão
                    </option>
                    <option value="canceled">Cancelado</option>
                    <option value="error">Com erro</option>
                    <option value="needs_action">Ação necessária</option>
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
                          <span className="flex items-center gap-2 text-left">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#eef3ff] text-xs">
                              ✨
                            </span>
                            Tudo
                          </span>

                          <span className="w-5 text-right text-[#002198]">
                            {periodoSelecionado === "todos" ? "✓" : ""}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => aplicarPeriodoRapido("este_mes")}
                          className={[
                            "flex h-9 w-full items-center justify-between rounded-2xl px-3 text-sm font-semibold transition",
                            periodoSelecionado === "este_mes"
                              ? "bg-[#eef3ff] text-[#002198]"
                              : "bg-white text-black hover:bg-[#f8fbff]",
                          ].join(" ")}
                        >
                          <span className="flex items-center gap-2 text-left">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#eef3ff] text-xs">
                              📅
                            </span>
                            Este mês
                          </span>

                          <span className="w-5 text-right text-[#002198]">
                            {periodoSelecionado === "este_mes" ? "✓" : ""}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => aplicarPeriodoRapido("mes_passado")}
                          className={[
                            "flex h-9 w-full items-center justify-between rounded-2xl px-3 text-sm font-semibold transition",
                            periodoSelecionado === "mes_passado"
                              ? "bg-[#eef3ff] text-[#002198]"
                              : "bg-white text-black hover:bg-[#f8fbff]",
                          ].join(" ")}
                        >
                          <span className="flex items-center gap-2 text-left">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#eef3ff] text-xs">
                              🗓️
                            </span>
                            Mês passado
                          </span>

                          <span className="w-5 text-right text-[#002198]">
                            {periodoSelecionado === "mes_passado" ? "✓" : ""}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={abrirSelecionarMes}
                          className={[
                            "flex h-9 w-full items-center justify-between rounded-2xl px-3 text-sm font-semibold transition",
                            rascunhoPeriodo === "mes"
                              ? "bg-[#eef3ff] text-[#002198]"
                              : "bg-white text-black hover:bg-[#f8fbff]",
                          ].join(" ")}
                        >
                          <span className="flex items-center gap-2 text-left">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#eef3ff] text-xs">
                              📆
                            </span>
                            Selecionar mês
                          </span>

                          <span className="w-5 text-right text-[#002198]">
                            {rascunhoPeriodo === "mes" ? "✓" : ""}
                          </span>
                        </button>

                        {rascunhoPeriodo === "mes" ? (
                          <div className="mt-2 space-y-2 rounded-2xl border border-[#dfe7f7] bg-[#f8fbff] p-2.5">
                            <input
                              type="month"
                              value={rascunhoMes}
                              onChange={(event) =>
                                aplicarMesSelecionado(event.target.value)
                              }
                              className="h-9 w-full rounded-2xl border border-[#dfe7f7] bg-white px-3 text-sm text-black outline-none transition focus:border-[#002198]"
                            />
                          </div>
                        ) : null}

                        <button
                          type="button"
                          onClick={abrirPeriodoPersonalizado}
                          className={[
                            "flex h-9 w-full items-center justify-between rounded-2xl px-3 text-sm font-semibold transition",
                            rascunhoPeriodo === "personalizado"
                              ? "bg-[#eef3ff] text-[#002198]"
                              : "bg-white text-black hover:bg-[#f8fbff]",
                          ].join(" ")}
                        >
                          <span className="flex items-center gap-2 text-left">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#eef3ff] text-xs">
                              🔎
                            </span>
                            Personalizado
                          </span>

                          <span className="w-5 text-right text-[#002198]">
                            {rascunhoPeriodo === "personalizado" ? "✓" : ""}
                          </span>
                        </button>

                        {rascunhoPeriodo === "personalizado" ? (
                          <div className="mt-2 space-y-2 rounded-2xl border border-[#dfe7f7] bg-[#f8fbff] p-2.5">
                            <input
                              type="date"
                              value={rascunhoDataInicial}
                              onChange={(event) =>
                                aplicarDataInicialPersonalizada(
                                  event.target.value,
                                )
                              }
                              className="h-9 w-full rounded-2xl border border-[#dfe7f7] bg-white px-3 text-sm text-black outline-none transition focus:border-[#002198]"
                            />

                            <input
                              type="date"
                              value={rascunhoDataFinal}
                              onChange={(event) =>
                                aplicarDataFinalPersonalizada(
                                  event.target.value,
                                )
                              }
                              className="h-9 w-full rounded-2xl border border-[#dfe7f7] bg-white px-3 text-sm text-black outline-none transition focus:border-[#002198]"
                            />
                          </div>
                        ) : null}

                        <div className="my-1 border-t border-[#dfe7f7]" />

                        <button
                          type="button"
                          onClick={() => setMenuPeriodoAberto(false)}
                          className="flex h-9 w-full items-center gap-2 rounded-2xl px-3 text-left text-sm font-semibold text-neutral-600 transition hover:bg-[#f8fbff]"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#eef3ff] text-xs text-[#002198]">
                            ✕
                          </span>
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
                    Recebidos usam data de pagamento. Demais usam vencimento.
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
        ) : items.length === 0 ? (
          <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <p className="text-base font-semibold text-black">
              Nenhum registro financeiro encontrado.
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Ajuste período, situação ou busca.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-[#dfe7f7] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <div className="hidden grid-cols-[1.15fr_0.7fr_0.8fr_0.75fr_0.9fr_0.9fr_0.95fr] gap-4 border-b border-[#dfe7f7] bg-[#f8fbff] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:grid">
              <span>Cliente</span>
              <span>Tipo</span>
              <span>Situação</span>
              <span>Valor</span>
              <span>Vencimento / Pagamento</span>
              <span>Bling</span>
              <span className="text-right">Ação</span>
            </div>

            <div className="divide-y divide-[#dfe7f7]">
              {items.map((item) => {
                const whatsappChargeUrl = buildWhatsAppChargeUrl(item)

                return (
                  <div
                    key={item.id}
                    className="grid gap-4 px-5 py-5 xl:grid-cols-[1.15fr_0.7fr_0.8fr_0.75fr_0.9fr_0.9fr_0.95fr] xl:items-start"
                  >
                    <div>
                      <p className="text-sm font-semibold text-black">
                        {item.cliente}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {item.responsavel || "Responsável não informado"}
                      </p>

                      <p className="mt-1 break-all text-xs text-neutral-500">
                        {item.email_financeiro || "E-mail não informado"}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        WhatsApp: {item.whatsapp || "não informado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-black">
                        {item.tipo_label}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Competência: {item.competencia || "—"}
                      </p>
                    </div>

                    <div>
                      <span
                        className={[
                          "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                          getStatusClass(item.situacao_code),
                        ].join(" ")}
                      >
                        {item.situacao_label}
                      </span>

                      {item.needs_action ? (
                        <p className="mt-2 text-xs font-semibold text-rose-700">
                          Ação necessária
                        </p>
                      ) : null}

                      {item.sync_error ? (
                        <p className="mt-2 text-xs font-semibold text-rose-700">
                          {item.sync_error}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-black">
                        {formatMoney(item.valor)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-neutral-700">
                        Venc.: {formatDate(item.vencimento)}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Pago em: {formatDate(item.pago_em)}
                      </p>
                    </div>

                    <div>
                      {item.virtual ? (
                        <p className="text-xs font-semibold text-orange-800">
                          Não emitida
                        </p>
                      ) : (
                        <>
                          <p className="break-all text-xs text-neutral-700">
                            ID: {item.bling_cobranca_id || "—"}
                          </p>

                          <p className="mt-1 break-all text-xs text-neutral-500">
                            Doc.: {item.bling_numero_documento || "—"}
                          </p>

                          <p className="mt-1 text-xs text-neutral-500">
                            Última consulta:{" "}
                            {formatDateTime(item.ultima_consulta_bling_em)}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 xl:items-end xl:text-right">
                      {item.bling_link_pagamento ? (
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              item.bling_link_pagamento || "",
                              "_blank",
                            )
                          }
                          className="inline-flex w-full items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-3 py-2 text-xs font-semibold text-[#002198] transition hover:bg-[#eef3ff] xl:w-auto"
                        >
                          Abrir cobrança
                        </button>
                      ) : null}

                      {whatsappChargeUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            window.open(whatsappChargeUrl, "_blank")
                          }
                          className="inline-flex w-full items-center justify-center rounded-2xl bg-[#002198] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#00166f] xl:w-auto"
                        >
                          Enviar cobrança
                        </button>
                      ) : null}

                      {!item.bling_link_pagamento && !whatsappChargeUrl ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-400 xl:w-auto"
                        >
                          Sem link emitido
                        </button>
                      ) : null}

                      <a
                        href="/cobrancas"
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-3 py-2 text-xs font-semibold text-[#002198] transition hover:bg-[#eef3ff] xl:w-auto"
                      >
                        Ver cobranças
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}