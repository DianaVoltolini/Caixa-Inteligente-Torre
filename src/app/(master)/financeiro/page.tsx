// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\(master)\financeiro\page.tsx

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import PageContainer from "@/components/layout/PageContainer"
import PageHeader from "@/components/layout/PageHeader"
import { Card, Input } from "@/components/ui"

type StatusFilter =
  | "todos"
  | "a_receber"
  | "paid"
  | "vencido"
  | "error"
  | "needs_action"

type FinanceiroItem = {
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
  valor: number
  vencimento: string | null
  status: string | null
  sync_status: string | null
  sync_error: string | null
  ciclo_tipo: string | null
  competencia: string | null
  created_at: string | null
  pago_em: string | null
  bling_cobranca_id: string | null
  bling_numero_documento: string | null
  bling_link_pagamento: string | null
  bling_status_raw: string | null
  ultima_consulta_bling_em: string | null
  needs_action: boolean
}

type FinanceiroResponse = {
  ok: boolean
  message?: string
  summary?: {
    totalCobrancas: number
    totalPeriodo: number
    aReceber: number
    recebido: number
    vencido: number
    erros: number
    acaoManual: number
  }
  data?: FinanceiroItem[]
}

const emptySummary = {
  totalCobrancas: 0,
  totalPeriodo: 0,
  aReceber: 0,
  recebido: 0,
  vencido: 0,
  erros: 0,
  acaoManual: 0,
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function onlyNumbers(value: string | null) {
  return String(value ?? "").replace(/\D/g, "")
}

function getCurrentMonthStart() {
  const date = new Date()
  date.setDate(1)
  return date.toISOString().substring(0, 10)
}

function getToday() {
  return new Date().toISOString().substring(0, 10)
}

function getCurrentCompetencia() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${date.getFullYear()}-${month}`
}

function formatDate(value: string | null) {
  if (!value) return "—"

  const cleanValue = String(value).substring(0, 10)
  const [year, month, day] = cleanValue.split("-")

  if (!year || !month || !day) return "—"

  return `${day}/${month}/${year}`
}

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0))
}

function getStatusLabel(value: string | null) {
  const status = normalizeText(value)

  if (status === "pending") return "Aberta"
  if (status === "paid") return "Paga"
  if (status === "overdue") return "Vencida"
  if (status === "error") return "Erro"
  if (status === "canceled") return "Cancelada"

  return value || "Sem status"
}

function getStatusClass(value: string | null) {
  const status = normalizeText(value)

  if (status === "paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }

  if (status === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-900"
  }

  if (status === "overdue" || status === "error") {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  return "border-[#dfe7f7] bg-[#f8fbff] text-[#002198]"
}

function getCycleLabel(value: string | null) {
  const normalized = normalizeText(value)

  if (normalized === "first_charge") return "Ativação"
  if (normalized === "recurring") return "Renovação"
  if (normalized === "recurrence") return "Renovação"
  if (normalized === "mensalidade") return "Renovação"

  return value || "—"
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
  tone?: "default" | "success" | "warning" | "danger" | "blue"
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
        "rounded-[28px] p-5 text-left shadow-[0_18px_45px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(15,23,42,0.08)]",
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
  const [summary, setSummary] = useState(emptySummary)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("todos")
  const [dateFrom, setDateFrom] = useState(getCurrentMonthStart())
  const [dateTo, setDateTo] = useState(getToday())
  const [competencia, setCompetencia] = useState("")
  const [useCompetencia, setUseCompetencia] = useState(false)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()

    params.set("limit", "500")
    params.set("status", status)

    if (search.trim()) {
      params.set("search", search.trim())
    }

    if (useCompetencia && competencia.trim()) {
      params.set("competencia", competencia.trim())
    } else {
      params.set("dateFrom", dateFrom)
      params.set("dateTo", dateTo)
    }

    return params.toString()
  }, [competencia, dateFrom, dateTo, search, status, useCompetencia])

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
      setSummary(payload.summary ?? emptySummary)
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

  function applyCurrentMonth() {
    setUseCompetencia(false)
    setDateFrom(getCurrentMonthStart())
    setDateTo(getToday())
    setCompetencia("")
  }

  function applyCurrentCompetencia() {
    setUseCompetencia(true)
    setCompetencia(getCurrentCompetencia())
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Torre de controle"
          title="Financeiro"
          subtitle="Coração financeiro do SaaS: recebidos, a receber, vencidos, erros e envio manual de cobrança."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <SummaryCard
            label="Cobranças"
            value={summary.totalCobrancas}
            helper="Total no filtro atual."
            active={status === "todos"}
            onClick={() => setStatus("todos")}
          />

          <SummaryCard
            label="Total previsto"
            value={formatMoney(summary.totalPeriodo)}
            helper="Tudo no período, sem canceladas."
            tone="blue"
            active={status === "todos"}
            onClick={() => setStatus("todos")}
          />

          <SummaryCard
            label="A receber"
            value={formatMoney(summary.aReceber)}
            helper="Abertas e vencidas."
            tone="warning"
            active={status === "a_receber"}
            onClick={() => setStatus("a_receber")}
          />

          <SummaryCard
            label="Recebido"
            value={formatMoney(summary.recebido)}
            helper="Pagas no filtro atual."
            tone="success"
            active={status === "paid"}
            onClick={() => setStatus("paid")}
          />

          <SummaryCard
            label="Vencido"
            value={formatMoney(summary.vencido)}
            helper="Vencidas no filtro atual."
            tone={summary.vencido > 0 ? "danger" : "default"}
            active={status === "vencido"}
            onClick={() => setStatus("vencido")}
          />

          <SummaryCard
            label="Ação manual"
            value={summary.acaoManual}
            helper="Exigem conferência."
            tone={summary.acaoManual > 0 ? "danger" : "default"}
            active={status === "needs_action"}
            onClick={() => setStatus("needs_action")}
          />
        </div>

        <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="grid gap-4 xl:grid-cols-[1fr_180px_180px_190px]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">
                Buscar no financeiro
              </label>

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cliente, responsável, e-mail, Bling ou competência"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">De</label>

              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => {
                  setDateFrom(event.target.value)
                  setUseCompetencia(false)
                }}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Até</label>

              <Input
                type="date"
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.target.value)
                  setUseCompetencia(false)
                }}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">
                Competência
              </label>

              <Input
                type="month"
                value={competencia}
                onChange={(event) => {
                  setCompetencia(event.target.value)
                  setUseCompetencia(Boolean(event.target.value))
                }}
                className="h-11"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[260px_1fr_auto_auto_auto]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">
                Situação
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as StatusFilter)
                }
                className="h-11 w-full rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm text-black outline-none transition focus:border-[#002198] focus:ring-2 focus:ring-[#002198]/10"
              >
                <option value="todos">Todos</option>
                <option value="a_receber">A receber</option>
                <option value="paid">Recebido</option>
                <option value="vencido">Vencido</option>
                <option value="error">Com erro</option>
                <option value="needs_action">Ação manual</option>
              </select>
            </div>

            <div className="flex items-end">
              <p className="pb-3 text-xs leading-5 text-neutral-500">
                {useCompetencia
                  ? `Filtro por competência: ${
                      competencia || "não informada"
                    }`
                  : `Filtro por vencimento: ${formatDate(
                      dateFrom,
                    )} até ${formatDate(dateTo)}`}
              </p>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={applyCurrentMonth}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm font-semibold text-[#002198] transition hover:bg-[#eef3ff]"
              >
                Mês atual
              </button>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={applyCurrentCompetencia}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm font-semibold text-[#002198] transition hover:bg-[#eef3ff]"
              >
                Competência atual
              </button>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => void loadFinanceiro()}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#002198] px-4 text-sm font-semibold text-white transition hover:bg-[#00166f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Atualizando..." : "Atualizar"}
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
              Carregando financeiro...
            </p>
          </Card>
        ) : items.length === 0 ? (
          <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <p className="text-base font-semibold text-black">
              Nenhum registro financeiro encontrado.
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Ajuste período, competência ou situação.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-[#dfe7f7] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <div className="hidden grid-cols-[1.1fr_0.75fr_0.75fr_0.85fr_0.9fr_1fr] gap-4 border-b border-[#dfe7f7] bg-[#f8fbff] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:grid">
              <span>Cliente</span>
              <span>Situação</span>
              <span>Valor</span>
              <span>Vencimento</span>
              <span>Bling</span>
              <span className="text-right">Ação</span>
            </div>

            <div className="divide-y divide-[#dfe7f7]">
              {items.map((item) => {
                const whatsappChargeUrl = buildWhatsAppChargeUrl(item)

                return (
                  <div
                    key={item.id}
                    className="grid gap-4 px-5 py-5 xl:grid-cols-[1.1fr_0.75fr_0.75fr_0.85fr_0.9fr_1fr] xl:items-start"
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
                      <span
                        className={[
                          "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                          getStatusClass(item.status),
                        ].join(" ")}
                      >
                        {getStatusLabel(item.status)}
                      </span>

                      <p className="mt-2 text-xs text-neutral-500">
                        {getCycleLabel(item.ciclo_tipo)}
                      </p>

                      {item.needs_action ? (
                        <p className="mt-2 text-xs font-semibold text-rose-700">
                          Ação manual
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-black">
                        {formatMoney(item.valor)}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Competência: {item.competencia || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-neutral-700">
                        {formatDate(item.vencimento)}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Pago em: {formatDate(item.pago_em)}
                      </p>
                    </div>

                    <div>
                      <p className="break-all text-xs text-neutral-700">
                        ID: {item.bling_cobranca_id || "—"}
                      </p>

                      <p className="mt-1 break-all text-xs text-neutral-500">
                        Doc.: {item.bling_numero_documento || "—"}
                      </p>
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
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-400 xl:w-auto"
                        >
                          Sem WhatsApp/link
                        </button>
                      )}

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