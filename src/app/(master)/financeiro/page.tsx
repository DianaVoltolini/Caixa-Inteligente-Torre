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
  | "overdue"
  | "error"
  | "needs_action"

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

type CobrancasResponse = {
  ok: boolean
  message?: string
  data?: CobrancaItem[]
}

const emptySummary = {
  clientes: 0,
  valorAtual: 0,
  valorAberto: 0,
  valorRecebido: 0,
  valorVencido: 0,
  valorErro: 0,
  acaoManual: 0,
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function normalizeStatus(value: unknown) {
  const status = normalizeText(value)

  if (status === "cancelled") return "canceled"

  return status
}

function formatDate(value: string | null) {
  if (!value) return "—"

  const cleanValue = String(value).substring(0, 10)
  const [year, month, day] = cleanValue.split("-")

  if (!year || !month || !day) return "—"

  return `${day}/${month}/${year}`
}

function formatMoney(value: number | null | undefined) {
  const numberValue = Number(value ?? 0)

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numberValue)
}

function isPastDate(value: string | null) {
  if (!value) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const date = new Date(`${String(value).substring(0, 10)}T00:00:00`)
  date.setHours(0, 0, 0, 0)

  return Number.isFinite(date.getTime()) && date < today
}

function isAReceber(item: CobrancaItem) {
  const status = normalizeStatus(item.status)

  return status === "pending" || status === "overdue"
}

function isVencida(item: CobrancaItem) {
  const status = normalizeStatus(item.status)

  if (status === "overdue") return true

  return status === "pending" && isPastDate(item.vencimento)
}

function getStatusLabel(value: string | null) {
  const status = normalizeStatus(value)

  if (status === "pending") return "Aberta"
  if (status === "paid") return "Paga"
  if (status === "overdue") return "Vencida"
  if (status === "error") return "Erro"
  if (status === "canceled") return "Cancelada"

  return value || "Sem status"
}

function getStatusClass(value: string | null) {
  const status = normalizeStatus(value)

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

function matchesFilter(item: CobrancaItem, filter: StatusFilter) {
  const status = normalizeStatus(item.status)

  if (filter === "todos") return true
  if (filter === "a_receber") return isAReceber(item)
  if (filter === "overdue") return isVencida(item)
  if (filter === "needs_action") return item.needs_action
  if (filter === "error") return status === "error"

  return status === filter
}

function matchesSearch(item: CobrancaItem, search: string) {
  if (!search) return true

  const content = normalizeText([
    item.cliente,
    item.responsavel,
    item.email_financeiro,
    item.whatsapp,
    item.status,
    item.plano,
    item.competencia,
    item.bling_cobranca_id,
    item.bling_numero_documento,
  ].join(" "))

  return content.includes(search)
}

function getSummary(items: CobrancaItem[]) {
  return items.reduce(
    (summary, item) => {
      const status = normalizeStatus(item.status)
      const valor = Number(item.valor ?? 0)

      summary.clientes += 1

      if (status !== "canceled") {
        summary.valorAtual += valor
      }

      if (isAReceber(item)) {
        summary.valorAberto += valor
      }

      if (status === "paid") {
        summary.valorRecebido += valor
      }

      if (isVencida(item)) {
        summary.valorVencido += valor
      }

      if (status === "error") {
        summary.valorErro += valor
      }

      if (item.needs_action) {
        summary.acaoManual += 1
      }

      return summary
    },
    { ...emptySummary },
  )
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
  const [items, setItems] = useState<CobrancaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<StatusFilter>("todos")

  const loadFinanceiro = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/master/cobrancas?status=todos&limit=300", {
        method: "GET",
        cache: "no-store",
      })

      const payload = (await response.json()) as CobrancasResponse

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.message || "Não foi possível carregar o financeiro.",
        )
      }

      setItems(payload.data ?? [])
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Erro ao carregar financeiro.",
      )
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFinanceiro()
  }, [loadFinanceiro])

  const summary = useMemo(() => getSummary(items), [items])

  const filteredItems = useMemo(() => {
    const cleanSearch = normalizeText(search)

    return items.filter((item) => {
      return matchesFilter(item, filter) && matchesSearch(item, cleanSearch)
    })
  }, [filter, items, search])

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Torre de controle"
          title="Financeiro"
          subtitle="Visão financeira atual do SaaS, considerando uma cobrança atual por cliente."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <SummaryCard
            label="Clientes"
            value={summary.clientes}
            helper="Clientes com cobrança atual."
            active={filter === "todos"}
            onClick={() => setFilter("todos")}
          />

          <SummaryCard
            label="Atual"
            value={formatMoney(summary.valorAtual)}
            helper="Valor total atual, sem canceladas."
            tone="blue"
            active={filter === "todos"}
            onClick={() => setFilter("todos")}
          />

          <SummaryCard
            label="A receber"
            value={formatMoney(summary.valorAberto)}
            helper="Cobranças abertas ou vencidas."
            tone="warning"
            active={filter === "a_receber"}
            onClick={() => setFilter("a_receber")}
          />

          <SummaryCard
            label="Recebido"
            value={formatMoney(summary.valorRecebido)}
            helper="Cobranças atuais pagas."
            tone="success"
            active={filter === "paid"}
            onClick={() => setFilter("paid")}
          />

          <SummaryCard
            label="Vencido"
            value={formatMoney(summary.valorVencido)}
            helper="Cobranças vencidas."
            tone={summary.valorVencido > 0 ? "danger" : "default"}
            active={filter === "overdue"}
            onClick={() => setFilter("overdue")}
          />

          <SummaryCard
            label="Ação manual"
            value={summary.acaoManual}
            helper="Itens que exigem conferência."
            tone={summary.acaoManual > 0 ? "danger" : "default"}
            active={filter === "needs_action"}
            onClick={() => setFilter("needs_action")}
          />
        </div>

        <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px_auto]">
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
              <label className="text-sm font-medium text-black">
                Situação
              </label>

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value as StatusFilter)}
                className="h-11 w-full rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm text-black outline-none transition focus:border-[#002198] focus:ring-2 focus:ring-[#002198]/10"
              >
                <option value="todos">Todos</option>
                <option value="a_receber">A receber</option>
                <option value="paid">Recebido</option>
                <option value="overdue">Vencido</option>
                <option value="error">Com erro</option>
                <option value="needs_action">Ação manual</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 xl:items-end xl:justify-end">
              <button
                type="button"
                onClick={() => void loadFinanceiro()}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm font-semibold text-[#002198] transition hover:bg-[#eef3ff] disabled:cursor-not-allowed disabled:opacity-60"
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
        ) : filteredItems.length === 0 ? (
          <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <p className="text-base font-semibold text-black">
              Nenhum registro financeiro encontrado.
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Ajuste os filtros ou atualize a tela.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-[#dfe7f7] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <div className="hidden grid-cols-[1.15fr_0.75fr_0.75fr_0.8fr_0.9fr_0.9fr] gap-4 border-b border-[#dfe7f7] bg-[#f8fbff] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:grid">
              <span>Cliente</span>
              <span>Situação</span>
              <span>Valor</span>
              <span>Vencimento</span>
              <span>Bling</span>
              <span className="text-right">Ação</span>
            </div>

            <div className="divide-y divide-[#dfe7f7]">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 px-5 py-5 xl:grid-cols-[1.15fr_0.75fr_0.75fr_0.8fr_0.9fr_0.9fr] xl:items-start"
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

                  <div className="xl:text-right">
                    {item.bling_link_pagamento ? (
                      <button
                        type="button"
                        onClick={() =>
                          window.open(item.bling_link_pagamento || "", "_blank")
                        }
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-3 py-2 text-xs font-semibold text-[#002198] transition hover:bg-[#eef3ff] xl:w-auto"
                      >
                        Abrir cobrança
                      </button>
                    ) : (
                      <a
                        href="/cobrancas"
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-3 py-2 text-xs font-semibold text-[#002198] transition hover:bg-[#eef3ff] xl:w-auto"
                      >
                        Ver cobranças
                      </a>
                    )}
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
