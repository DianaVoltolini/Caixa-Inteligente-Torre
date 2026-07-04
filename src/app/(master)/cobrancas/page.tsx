// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\(master)\cobrancas\page.tsx

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

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

type ApiResponse = {
  ok: boolean
  message?: string
  summary?: {
    total: number
    pending: number
    overdue: number
    paid: number
    error: number
    canceled: number
    needsAction: number
  }
  data?: CobrancaItem[]
}

type ProcessorResponse = {
  success?: boolean
  error?: string
  payload?: unknown
}

const defaultSummary = {
  total: 0,
  pending: 0,
  overdue: 0,
  paid: 0,
  error: 0,
  canceled: 0,
  needsAction: 0,
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

function getStatusLabel(status: string | null) {
  const normalized = normalizeStatus(status)

  if (normalized === "pending") return "Aberta"
  if (normalized === "overdue") return "Vencida"
  if (normalized === "paid") return "Paga"
  if (normalized === "error") return "Erro"
  if (normalized === "canceled") return "Cancelada"

  return status || "Sem status"
}

function getAssinaturaLabel(status: string | null) {
  const normalized = normalizeStatus(status)

  if (normalized === "trialing") return "Em teste"
  if (normalized === "awaiting_payment") return "Aguardando pagamento"
  if (normalized === "active") return "Ativa"
  if (normalized === "grace_period") return "Tolerância"
  if (normalized === "overdue") return "Vencida"
  if (normalized === "blocked") return "Bloqueada"
  if (normalized === "canceled") return "Cancelada"

  return status || "Sem assinatura"
}

function getPaymentMethodLabel(value: string | null) {
  const normalized = normalizeStatus(value)

  if (normalized === "pix") return "Pix"
  if (normalized === "boleto") return "Boleto"

  return value || "—"
}

function getCycleLabel(value: string | null) {
  const normalized = normalizeStatus(value)

  if (normalized === "first_charge") return "Ativação"
  if (normalized === "recurring") return "Renovação"
  if (normalized === "recurrence") return "Renovação"
  if (normalized === "mensalidade") return "Renovação"

  return value || "—"
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

function ChargeStatusBadge({ status }: { status: string | null }) {
  const normalized = normalizeStatus(status)

  if (normalized === "paid") {
    return <StatusBadge label="Paga" tone="success" />
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

  return <StatusBadge label={getStatusLabel(status)} />
}

function AssinaturaBadge({ status }: { status: string | null }) {
  const normalized = normalizeStatus(status)

  if (normalized === "active") {
    return <StatusBadge label="Ativa" tone="success" />
  }

  if (normalized === "trialing") {
    return <StatusBadge label="Em teste" tone="blue" />
  }

  if (normalized === "awaiting_payment") {
    return <StatusBadge label="Aguardando pagamento" tone="warning" />
  }

  if (
    normalized === "overdue" ||
    normalized === "blocked" ||
    normalized === "canceled"
  ) {
    return <StatusBadge label={getAssinaturaLabel(status)} tone="danger" />
  }

  return <StatusBadge label={getAssinaturaLabel(status)} />
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: number
  tone?: "default" | "danger" | "success" | "warning"
}) {
  const className =
    tone === "danger"
      ? "border border-rose-200 bg-rose-50"
      : tone === "success"
        ? "border border-emerald-200 bg-emerald-50"
        : tone === "warning"
          ? "border border-amber-200 bg-amber-50"
          : "border border-[#dfe7f7] bg-white"

  const textClass =
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
        "rounded-[28px] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]",
        className,
      ].join(" ")}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
        {label}
      </p>

      <p className={["mt-3 text-3xl font-bold", textClass].join(" ")}>
        {value}
      </p>
    </Card>
  )
}

export default function CobrancasPage() {
  const [items, setItems] = useState<CobrancaItem[]>([])
  const [summary, setSummary] = useState(defaultSummary)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("todos")
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [processorMessage, setProcessorMessage] = useState<string | null>(null)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()

    params.set("status", status)
    params.set("limit", "300")

    if (search.trim()) {
      params.set("search", search.trim())
    }

    return params.toString()
  }, [search, status])

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
      setSummary(payload.summary ?? defaultSummary)
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
          subtitle="Acompanhe cobranças abertas, vencidas, pagas, canceladas e falhas de sincronização com o Bling."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <SummaryCard label="Total" value={summary.total} />
          <SummaryCard
            label="Abertas"
            value={summary.pending}
            tone="warning"
          />
          <SummaryCard
            label="Vencidas"
            value={summary.overdue}
            tone="danger"
          />
          <SummaryCard
            label="Pagas"
            value={summary.paid}
            tone="success"
          />
          <SummaryCard label="Erros" value={summary.error} tone="danger" />
          <SummaryCard
            label="Ação manual"
            value={summary.needsAction}
            tone={summary.needsAction > 0 ? "danger" : "default"}
          />
        </div>

        <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px_auto]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">
                Buscar cobrança
              </label>

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cliente, responsável, email, ID Bling ou competência"
                className="h-11"
              />
            </div>

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
                <option value="todos">Todas</option>
                <option value="pending">Abertas</option>
                <option value="overdue">Vencidas</option>
                <option value="paid">Pagas</option>
                <option value="error">Com erro</option>
                <option value="canceled">Canceladas</option>
                <option value="needs_action">Ação manual</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 xl:items-end xl:justify-end">
              <button
                type="button"
                onClick={() => void loadCobrancas()}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm font-semibold text-[#002198] transition hover:bg-[#eef3ff]"
              >
                Atualizar
              </button>
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
              Ajuste os filtros ou atualize a tela.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-[#dfe7f7] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <div className="hidden grid-cols-[1.25fr_0.85fr_0.8fr_0.8fr_0.8fr_0.9fr_0.9fr] gap-4 border-b border-[#dfe7f7] bg-[#f8fbff] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:grid">
              <span>Cliente</span>
              <span>Assinatura</span>
              <span>Cobrança</span>
              <span>Valor</span>
              <span>Vencimento</span>
              <span>Bling</span>
              <span className="text-right">Ação</span>
            </div>

            <div className="divide-y divide-[#dfe7f7]">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 px-5 py-5 xl:grid-cols-[1.25fr_0.85fr_0.8fr_0.8fr_0.8fr_0.9fr_0.9fr] xl:items-start"
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
                      {item.email_financeiro || "Email não informado"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                      Assinatura
                    </p>

                    <div className="mt-1">
                      <AssinaturaBadge status={item.assinatura_status} />
                    </div>

                    <p className="mt-2 text-xs text-neutral-500">
                      {item.plano || "Plano não informado"}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      {getPaymentMethodLabel(item.forma_pagamento)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                      Cobrança
                    </p>

                    <div className="mt-1">
                      <ChargeStatusBadge status={item.status} />
                    </div>

                    <p className="mt-2 text-xs text-neutral-500">
                      {getCycleLabel(item.ciclo_tipo)}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      Criada em {formatDate(item.created_at)}
                    </p>
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
                          window.open(item.bling_link_pagamento || "", "_blank")
                        }
                        className="mb-2 inline-flex w-full items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-3 py-2 text-xs font-semibold text-[#002198] transition hover:bg-[#eef3ff] xl:w-auto"
                      >
                        Abrir cobrança
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
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}