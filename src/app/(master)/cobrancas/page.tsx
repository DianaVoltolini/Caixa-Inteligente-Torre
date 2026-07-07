// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\(master)\cobrancas\page.tsx

"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import PageContainer from "@/components/layout/PageContainer"
import PageHeader from "@/components/layout/PageHeader"
import { Card, Input } from "@/components/ui"

type StatusFilter =
  | "todos"
  | "pending"
  | "overdue"
  | "paid"
  | "error"
  | "canceled"
  | "needs_action"

type TipoFilter = "todos" | "ativacao" | "renovacao"

type PeriodoFiltro =
  | "todos"
  | "este_mes"
  | "mes_passado"
  | "mes"
  | "personalizado"

type CobrancaItem = {
  id: string
  business_id: string
  assinatura_id: string | null
  cliente: string
  responsavel: string | null
  email_financeiro: string | null
  whatsapp: string | null
  assinatura_status: string | null
  plano: string | null
  forma_pagamento: string | null
  proximo_vencimento: string | null
  valor: number | null
  vencimento: string | null
  status: string | null
  sync_status: string | null
  sync_error: string | null
  ciclo_tipo: string | null
  tipo_code: "ativacao" | "renovacao" | "outro"
  tipo_label: string
  competencia: string | null
  gerada_em: string | null
  created_at: string | null
  data_criacao: string | null
  pago_em: string | null
  bling_cobranca_id: string | null
  bling_numero_documento: string | null
  bling_link_pagamento: string | null
  bling_status_raw: string | null
  ultima_consulta_bling_em: string | null
  needs_action: boolean
}

type Summary = {
  total: number
  ativacao: number
  renovacao: number
  cancelamento: number
  pending: number
  overdue: number
  paid: number
  error: number
  canceled: number
  needsAction: number
}

type ApiResponse = {
  ok: boolean
  message?: string
  summary?: Partial<Summary>
  data?: CobrancaItem[]
}

type ProcessorResponse = {
  success?: boolean
  error?: string
  payload?: unknown
}

const defaultSummary: Summary = {
  total: 0,
  ativacao: 0,
  renovacao: 0,
  cancelamento: 0,
  pending: 0,
  overdue: 0,
  paid: 0,
  error: 0,
  canceled: 0,
  needsAction: 0,
}

function numberOrZero(value: unknown) {
  const number = Number(value)

  return Number.isFinite(number) ? number : 0
}

function normalizeSummary(summary?: Partial<Summary>): Summary {
  return {
    total: numberOrZero(summary?.total),
    ativacao: numberOrZero(summary?.ativacao),
    renovacao: numberOrZero(summary?.renovacao),
    cancelamento: numberOrZero(summary?.cancelamento),
    pending: numberOrZero(summary?.pending),
    overdue: numberOrZero(summary?.overdue),
    paid: numberOrZero(summary?.paid),
    error: numberOrZero(summary?.error),
    canceled: numberOrZero(summary?.canceled),
    needsAction: numberOrZero(summary?.needsAction),
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

function formatMoney(value: number | null) {
  if (value === null || value === undefined) return "—"

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value))
}

function normalizeStatus(value: string | null) {
  return String(value ?? "").trim().toLowerCase()
}

function onlyNumbers(value: string | null) {
  return String(value ?? "").replace(/\D/g, "")
}

function isPastDate(value: string | null) {
  if (!value) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const date = new Date(`${String(value).substring(0, 10)}T00:00:00`)
  date.setHours(0, 0, 0, 0)

  return Number.isFinite(date.getTime()) && date < today
}

function getStatusLabel(status: string | null, vencimento?: string | null) {
  const normalized = normalizeStatus(status)

  if (normalized === "pending" && isPastDate(vencimento ?? null)) {
    return "Vencida"
  }

  if (normalized === "pending") return "Aberta"
  if (normalized === "overdue") return "Vencida"
  if (normalized === "paid") return "Paga"
  if (normalized === "error") return "Erro"
  if (normalized === "canceled") return "Cancelada"

  return status || "Sem status"
}

function buildWhatsAppChargeLink(item: CobrancaItem) {
  const digits = onlyNumbers(item.whatsapp)

  if (!digits || !item.bling_link_pagamento) return null

  const normalizedPhone = digits.startsWith("55") ? digits : `55${digits}`
  const nome = item.responsavel || item.cliente
  const mensagem = [
    `Olá, ${nome}.`,
    "",
    "Segue o link da sua cobrança do Meu Caixa Inteligente:",
    item.bling_link_pagamento,
    "",
    `Valor: ${formatMoney(item.valor)}`,
    `Vencimento: ${formatDate(item.vencimento)}`,
  ].join("\n")

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(mensagem)}`
}

function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string
  tone?: "neutral" | "success" | "warning" | "danger" | "blue"
}) {
  const tones = {
    neutral: "border-neutral-200 bg-neutral-50 text-neutral-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    blue: "border-[#cfd8ff] bg-[#eef3ff] text-[#002198]",
  }

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        tones[tone],
      ].join(" ")}
    >
      {label}
    </span>
  )
}

function ChargeStatusBadge({
  status,
  vencimento,
}: {
  status: string | null
  vencimento: string | null
}) {
  const normalized = normalizeStatus(status)

  if (normalized === "paid") {
    return <StatusBadge label="Paga" tone="success" />
  }

  if (normalized === "pending" && isPastDate(vencimento)) {
    return <StatusBadge label="Vencida" tone="danger" />
  }

  if (normalized === "pending") {
    return <StatusBadge label="Aberta" tone="warning" />
  }

  if (normalized === "overdue") {
    return <StatusBadge label="Vencida" tone="danger" />
  }

  if (normalized === "error") {
    return <StatusBadge label="Erro" tone="danger" />
  }

  if (normalized === "canceled") {
    return <StatusBadge label="Cancelada" tone="neutral" />
  }

  return <StatusBadge label={getStatusLabel(status, vencimento)} />
}

function OverviewCard({
  title,
  value,
  tone = "default",
  active = false,
  onClick,
  rows,
}: {
  title: string
  value: number
  tone?: "default" | "danger" | "success" | "warning" | "blue" | "neutral"
  active?: boolean
  onClick: () => void
  rows?: Array<{
    label: string
    value: number
    onClick?: () => void
  }>
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
    <Card
      className={[
        "rounded-[24px] p-4 shadow-[0_14px_34px_rgba(15,23,42,0.035)]",
        className,
        active ? "ring-2 ring-[#002198] ring-offset-2" : "",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
          {title}
        </p>

        <p className={["text-3xl font-bold leading-none", valueClass].join(" ")}>
          {numberOrZero(value)}
        </p>
      </button>

      {rows && rows.length > 0 ? (
        <div className="mt-3 space-y-1 border-t border-black/5 pt-3">
          {rows.map((row) => (
            <button
              key={row.label}
              type="button"
              onClick={row.onClick}
              disabled={!row.onClick}
              className={[
                "flex w-full items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-left text-sm transition",
                row.onClick
                  ? "text-neutral-700 hover:bg-white/80"
                  : "text-neutral-600",
              ].join(" ")}
            >
              <span>{row.label}</span>
              <span className="font-bold text-black">
                {numberOrZero(row.value)}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </Card>
  )
}

export default function CobrancasPage() {
  const [items, setItems] = useState<CobrancaItem[]>([])
  const [summary, setSummary] = useState<Summary>(defaultSummary)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [tipo, setTipo] = useState<TipoFilter>("todos")
  const [status, setStatus] = useState<StatusFilter>("pending")
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [processorMessage, setProcessorMessage] = useState<string | null>(null)

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

  const statusTotal = summary.pending + summary.overdue + summary.paid
  const pendenciasTotal = summary.needsAction

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

    params.set("status", status)
    params.set("tipo", tipo)
    params.set("limit", "1000")

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
  }, [dateFrom, dateTo, search, status, tipo])

  const loadCobrancas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/master/cobrancas?${queryString}`, {
        method: "GET",
        cache: "no-store",
      })

      const payload = (await response.json()) as ApiResponse

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.message || "Não foi possível carregar as cobranças.",
        )
      }

      setItems(payload.data ?? [])
      setSummary(normalizeSummary(payload.summary))
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Erro ao carregar cobranças.",
      )
      setItems([])
      setSummary(defaultSummary)
    } finally {
      setLoading(false)
    }
  }, [queryString])

  useEffect(() => {
    void loadCobrancas()
  }, [loadCobrancas])

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
    setTipo("todos")
    setStatus("pending")
    aplicarTudo()
  }

  async function handleSyncCharge(item: CobrancaItem) {
    try {
      setSyncingId(item.id)

      const response = await fetch("/api/master/cobrancas/sincronizar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: item.business_id,
          subscriptionId: item.assinatura_id,
          cobrancaId: item.id,
        }),
      })

      const payload = await response.json()

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.error || "Não foi possível sincronizar a cobrança.",
        )
      }

      await loadCobrancas()
    } catch (syncError) {
      alert(
        syncError instanceof Error
          ? syncError.message
          : "Erro ao sincronizar cobrança.",
      )
    } finally {
      setSyncingId(null)
    }
  }

  async function handleProcessRecurring(dryRun: boolean) {
    try {
      setProcessing(true)
      setProcessorMessage(null)

      const response = await fetch(
        "/api/master/cobrancas/processar-recorrencia",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dryRun,
            limit: 50,
          }),
        },
      )

      const payload = (await response.json()) as ProcessorResponse

      if (!response.ok || payload.success === false) {
        throw new Error(
          payload.error || "Não foi possível processar recorrência.",
        )
      }

      setProcessorMessage(
        dryRun
          ? "Simulação da recorrência executada com sucesso."
          : "Recorrência processada com sucesso.",
      )

      await loadCobrancas()
    } catch (processError) {
      setProcessorMessage(
        processError instanceof Error
          ? processError.message
          : "Erro ao processar recorrência.",
      )
    } finally {
      setProcessing(false)
    }
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Torre de controle"
          title="Cobranças"
          subtitle="Acompanhe a última cobrança de cada cliente, envie links, sincronize pagamentos e acompanhe pendências."
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <OverviewCard
            title="Total"
            value={summary.total}
            active={status === "todos" && tipo === "todos"}
            onClick={() => {
              setStatus("todos")
              setTipo("todos")
            }}
            rows={[
              {
                label: "Renovação",
                value: summary.renovacao,
                onClick: () => {
                  setTipo("renovacao")
                  setStatus("todos")
                },
              },
              {
                label: "Ativação",
                value: summary.ativacao,
                onClick: () => {
                  setTipo("ativacao")
                  setStatus("todos")
                },
              },
              {
                label: "Cancelamento",
                value: summary.cancelamento,
                onClick: () => {
                  setTipo("todos")
                  setStatus("canceled")
                },
              },
            ]}
          />

          <OverviewCard
            title="Status"
            value={statusTotal}
            tone="warning"
            active={
              status === "pending" ||
              status === "overdue" ||
              status === "paid"
            }
            onClick={() => {
              setTipo("todos")
              setStatus("pending")
            }}
            rows={[
              {
                label: "Aberto",
                value: summary.pending,
                onClick: () => setStatus("pending"),
              },
              {
                label: "Vencido",
                value: summary.overdue,
                onClick: () => setStatus("overdue"),
              },
              {
                label: "Pago",
                value: summary.paid,
                onClick: () => setStatus("paid"),
              },
            ]}
          />

          <OverviewCard
            title="Pendências"
            value={pendenciasTotal}
            tone={pendenciasTotal > 0 ? "danger" : "neutral"}
            active={status === "error" || status === "needs_action"}
            onClick={() => setStatus("needs_action")}
            rows={[
              {
                label: "Com erro",
                value: summary.error,
                onClick: () => setStatus("error"),
              },
              {
                label: "Ação manual",
                value: summary.needsAction,
                onClick: () => setStatus("needs_action"),
              },
            ]}
          />
        </div>

        <Card className="overflow-visible rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                Filtros
              </p>

              <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_190px_220px_auto]">
                <div>
                  <label className="text-sm font-medium text-black">
                    Buscar cobrança
                  </label>

                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cliente, responsável, e-mail, WhatsApp, Bling ou competência"
                    className="mt-2 h-11"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-black">Tipo</label>

                  <select
                    value={tipo}
                    onChange={(event) =>
                      setTipo(event.target.value as TipoFilter)
                    }
                    className="mt-2 h-11 w-full rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm text-black outline-none transition focus:border-[#002198] focus:ring-2 focus:ring-[#002198]/10"
                  >
                    <option value="todos">Todos</option>
                    <option value="ativacao">Ativação</option>
                    <option value="renovacao">Renovação</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-black">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as StatusFilter)
                    }
                    className="mt-2 h-11 w-full rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm text-black outline-none transition focus:border-[#002198] focus:ring-2 focus:ring-[#002198]/10"
                  >
                    <option value="todos">Todos</option>
                    <option value="pending">Aberta</option>
                    <option value="overdue">Vencida</option>
                    <option value="paid">Paga</option>
                    <option value="error">Erro</option>
                    <option value="canceled">Cancelada</option>
                    <option value="needs_action">Ação manual</option>
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
                          onClick={() => {
                            const mesAtual = formatarMesInputLocal(new Date())
                            setRascunhoPeriodo("mes")
                            setRascunhoMes(rascunhoMes || mesAtual)
                          }}
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
                    Usa a data em que a cobrança foi gerada.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                Rotina automática
              </p>

              <h2 className="mt-1 text-xl font-bold text-black">
                Processamento de recorrência
              </h2>

              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Use a simulação para conferir o que o app faria. Use o
                processamento real apenas quando quiser acionar manualmente a
                mesma rotina automática do GitHub Actions.
              </p>

              {processorMessage ? (
                <p className="mt-3 text-sm font-semibold text-[#002198]">
                  {processorMessage}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void handleProcessRecurring(true)}
                disabled={processing}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#002198] bg-white px-4 text-sm font-semibold text-[#002198] transition hover:bg-[#eef3ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Simular rotina
              </button>

              <button
                type="button"
                onClick={() => void handleProcessRecurring(false)}
                disabled={processing}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#002198] px-4 text-sm font-semibold text-white transition hover:bg-[#00166f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processing ? "Processando..." : "Processar agora"}
              </button>
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
              Carregando cobranças...
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Estou organizando a visão financeira da Torre.
            </p>
          </Card>
        ) : items.length === 0 ? (
          <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <p className="text-base font-semibold text-black">
              Nenhuma cobrança encontrada.
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Ajuste os filtros ou limpe a busca.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-[#dfe7f7] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <div className="hidden grid-cols-[1.25fr_0.8fr_0.75fr_0.75fr_0.85fr_0.9fr_0.95fr] gap-4 border-b border-[#dfe7f7] bg-[#f8fbff] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:grid">
              <span>Cliente</span>
              <span>Tipo</span>
              <span>Status</span>
              <span>Valor</span>
              <span>Vencimento</span>
              <span>Bling</span>
              <span className="text-right">Ação</span>
            </div>

            <div className="divide-y divide-[#dfe7f7]">
              {items.map((item) => {
                const whatsappChargeLink = buildWhatsAppChargeLink(item)

                return (
                  <div
                    key={item.id}
                    className="grid gap-4 px-5 py-5 xl:grid-cols-[1.25fr_0.8fr_0.75fr_0.75fr_0.85fr_0.9fr_0.95fr] xl:items-start"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Cliente
                      </p>

                      <p className="mt-1 text-sm font-semibold text-black">
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
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Tipo
                      </p>

                      <p className="mt-1 text-sm font-semibold text-black">
                        {item.tipo_label}
                      </p>

                      <p className="mt-2 text-xs text-neutral-500">
                        Criada em {formatDate(item.data_criacao)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Status
                      </p>

                      <div className="mt-1">
                        <ChargeStatusBadge
                          status={item.status}
                          vencimento={item.vencimento}
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Valor
                      </p>

                      <p className="mt-1 text-sm font-semibold text-black">
                        {formatMoney(item.valor)}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Competência: {item.competencia || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Vencimento
                      </p>

                      <p className="mt-1 text-sm text-neutral-700">
                        {formatDate(item.vencimento)}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Pago em: {formatDate(item.pago_em)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Bling
                      </p>

                      <p className="mt-1 break-all text-xs text-neutral-700">
                        ID: {item.bling_cobranca_id || "—"}
                      </p>

                      <p className="mt-1 break-all text-xs text-neutral-500">
                        Doc.: {item.bling_numero_documento || "—"}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Última consulta:{" "}
                        {formatDateTime(item.ultima_consulta_bling_em)}
                      </p>

                      {item.sync_error ? (
                        <p className="mt-2 text-xs font-semibold text-rose-700">
                          {item.sync_error}
                        </p>
                      ) : null}
                    </div>

                    <div className="xl:text-right">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Ação
                      </p>

                      {item.needs_action ? (
                        <div className="mb-2">
                          <StatusBadge label="Ação manual" tone="danger" />
                        </div>
                      ) : null}

                      {item.bling_link_pagamento ? (
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              item.bling_link_pagamento || "",
                              "_blank",
                            )
                          }
                          className="mb-2 inline-flex w-full items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-3 py-2 text-xs font-semibold text-[#002198] transition hover:bg-[#eef3ff] xl:w-auto"
                        >
                          Abrir cobrança
                        </button>
                      ) : null}

                      {whatsappChargeLink ? (
                        <button
                          type="button"
                          onClick={() =>
                            window.open(whatsappChargeLink, "_blank")
                          }
                          className="mb-2 inline-flex w-full items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-3 py-2 text-xs font-semibold text-[#002198] transition hover:bg-[#eef3ff] xl:w-auto"
                        >
                          Enviar cobrança
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => void handleSyncCharge(item)}
                        disabled={syncingId === item.id}
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-[#002198] bg-[#002198] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#00166f] disabled:cursor-not-allowed disabled:opacity-60 xl:w-auto"
                      >
                        {syncingId === item.id
                          ? "Sincronizando..."
                          : "Sincronizar"}
                      </button>
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