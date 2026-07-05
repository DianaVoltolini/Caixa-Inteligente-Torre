// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\(master)\assinaturas\page.tsx

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import PageContainer from "@/components/layout/PageContainer"
import PageHeader from "@/components/layout/PageHeader"
import { Card, Input } from "@/components/ui"

type StatusFilter =
  | "todos"
  | "attention"
  | "trialing"
  | "trial_ended"
  | "active"
  | "awaiting_payment"
  | "grace_period"
  | "overdue_or_blocked"
  | "canceled"
  | "sem_assinatura"

type MasterCliente = {
  business_id?: string | null
  negocio?: string | null
  name?: string | null
  nome_responsavel?: string | null
  email_financeiro?: string | null
  whatsapp?: string | null
  cliente_criado_em?: string | null

  assinatura_id?: string | null
  assinatura_status?: string | null
  plano?: string | null
  assinatura_valor?: number | null
  trial_started_at?: string | null
  trial_ends_at?: string | null
  proximo_vencimento?: string | null
  forma_pagamento?: string | null
  assinatura_criada_em?: string | null

  total_lancamentos?: number | null

  cobranca_id?: string | null
  cobranca_status?: string | null
  cobranca_valor?: number | null
  cobranca_vencimento?: string | null
  cobranca_sync_status?: string | null
  cobranca_ciclo_tipo?: string | null
  cobranca_bling_id?: string | null
  cobranca_link_pagamento?: string | null

  alerta_financeiro?: string | null
}

type ApiResponse = {
  ok?: boolean
  success?: boolean
  message?: string
  error?: string
  data?: MasterCliente[]
  clientes?: MasterCliente[]
}

type AssinaturaView = {
  id: string
  businessId: string
  cliente: string
  responsavel: string
  email: string
  whatsapp: string
  plano: string
  valor: number
  status: string
  rawStatus: string
  statusLabel: string
  trialStartedAt: string | null
  trialEndsAt: string | null
  diasRestantes: number | null
  totalLancamentos: number
  proximoVencimento: string | null
  formaPagamento: string
  cobrancaStatus: string
  cobrancaVencimento: string | null
  cobrancaValor: number | null
  cobrancaLink: string | null
  alertaFinanceiro: string
  precisaAtencao: boolean
}

const TRIAL_LIMIT_DAYS = 7
const TRIAL_LIMIT_TRANSACTIONS = 30
const DAY_IN_MS = 1000 * 60 * 60 * 24

const defaultSummary = {
  total: 0,
  attention: 0,
  trialing: 0,
  active: 0,
  awaitingPayment: 0,
  overdueOrBlocked: 0,
  canceled: 0,
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

  if (status === "trial") return "trialing"
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
  if (value === null || value === undefined) return "—"

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value))
}

function calcularDiasRestantes(trialEndsAt: string | null) {
  if (!trialEndsAt) return null

  const end = new Date(`${String(trialEndsAt).substring(0, 10)}T23:59:59`)
  const diff = end.getTime() - Date.now()

  if (!Number.isFinite(diff)) return null

  return Math.max(0, Math.min(TRIAL_LIMIT_DAYS, Math.ceil(diff / DAY_IN_MS)))
}

function buildWhatsAppLink(whatsapp: string) {
  const digits = whatsapp.replace(/\D/g, "")

  if (!digits) return null

  const normalized = digits.startsWith("55") ? digits : `55${digits}`

  return `https://wa.me/${normalized}`
}

function getPaymentMethodLabel(value: string) {
  const normalized = normalizeStatus(value)

  if (normalized === "pix") return "Pix"
  if (normalized === "boleto") return "Boleto"

  return value || "—"
}

function getChargeStatusLabel(value: string) {
  const normalized = normalizeStatus(value)

  if (normalized === "pending") return "Aberta"
  if (normalized === "overdue") return "Vencida"
  if (normalized === "paid") return "Paga"
  if (normalized === "canceled") return "Cancelada"
  if (normalized === "error") return "Erro"

  return value || "Sem cobrança"
}

function getStatusLabel(status: string) {
  if (status === "active") return "Ativa"
  if (status === "trialing") return "Em teste"
  if (status === "trial_ended") return "Teste encerrado"
  if (status === "awaiting_payment") return "Aguardando pagamento"
  if (status === "grace_period") return "Em tolerância"
  if (status === "overdue") return "Vencida"
  if (status === "blocked") return "Bloqueada"
  if (status === "canceled") return "Cancelada"

  return "Sem assinatura"
}

function getStatusClass(status: string) {
  if (status === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }

  if (status === "trialing") {
    return "border-[#cfd8ff] bg-[#eef3ff] text-[#002198]"
  }

  if (status === "awaiting_payment" || status === "grace_period") {
    return "border-amber-200 bg-amber-50 text-amber-800"
  }

  if (status === "trial_ended" || status === "overdue" || status === "blocked") {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  if (status === "canceled") {
    return "border-neutral-200 bg-neutral-50 text-neutral-700"
  }

  return "border-slate-200 bg-slate-50 text-slate-600"
}

function isAttentionStatus(status: string) {
  return (
    status === "trial_ended" ||
    status === "awaiting_payment" ||
    status === "grace_period" ||
    status === "overdue" ||
    status === "blocked"
  )
}

function resolveStatus(cliente: MasterCliente) {
  const rawStatus = normalizeStatus(cliente.assinatura_status)
  const diasRestantes = calcularDiasRestantes(cliente.trial_ends_at ?? null)
  const totalLancamentos = Number(cliente.total_lancamentos ?? 0)

  const trialEndedByRule =
    rawStatus === "trialing" &&
    (diasRestantes === 0 || totalLancamentos >= TRIAL_LIMIT_TRANSACTIONS)

  if (trialEndedByRule) return "trial_ended"

  if (
    rawStatus === "trialing" ||
    rawStatus === "active" ||
    rawStatus === "awaiting_payment" ||
    rawStatus === "grace_period" ||
    rawStatus === "overdue" ||
    rawStatus === "blocked" ||
    rawStatus === "canceled"
  ) {
    return rawStatus
  }

  return "sem_assinatura"
}

function mapClienteToAssinatura(cliente: MasterCliente): AssinaturaView {
  const status = resolveStatus(cliente)
  const rawStatus = normalizeStatus(cliente.assinatura_status)

  return {
    id:
      cliente.assinatura_id ||
      cliente.business_id ||
      cliente.email_financeiro ||
      crypto.randomUUID(),
    businessId: cliente.business_id || "",
    cliente: cliente.negocio || cliente.name || "Cliente sem nome",
    responsavel: cliente.nome_responsavel || "Responsável não informado",
    email: cliente.email_financeiro || "Email não informado",
    whatsapp: cliente.whatsapp || "",
    plano: cliente.plano || "Plano Lucro Real",
    valor: Number(cliente.assinatura_valor ?? 29.9),
    status,
    rawStatus,
    statusLabel: getStatusLabel(status),
    trialStartedAt: cliente.trial_started_at || null,
    trialEndsAt: cliente.trial_ends_at || null,
    diasRestantes: calcularDiasRestantes(cliente.trial_ends_at ?? null),
    totalLancamentos: Number(cliente.total_lancamentos ?? 0),
    proximoVencimento: cliente.proximo_vencimento || null,
    formaPagamento: getPaymentMethodLabel(cliente.forma_pagamento || ""),
    cobrancaStatus: getChargeStatusLabel(cliente.cobranca_status || ""),
    cobrancaVencimento: cliente.cobranca_vencimento || null,
    cobrancaValor: cliente.cobranca_valor ?? null,
    cobrancaLink: cliente.cobranca_link_pagamento || null,
    alertaFinanceiro: cliente.alerta_financeiro || "sem_cobranca",
    precisaAtencao: isAttentionStatus(status),
  }
}

function matchesStatusFilter(item: AssinaturaView, statusFilter: StatusFilter) {
  if (statusFilter === "todos") return true
  if (statusFilter === "attention") return item.precisaAtencao

  if (statusFilter === "overdue_or_blocked") {
    return item.status === "overdue" || item.status === "blocked"
  }

  return item.status === statusFilter
}

function SummaryCard({
  label,
  value,
  tone = "default",
  active = false,
  onClick,
}: {
  label: string
  value: number
  tone?: "default" | "danger" | "success" | "warning" | "blue"
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

  const textClass =
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

      <p className={["mt-3 text-3xl font-bold", textClass].join(" ")}>
        {value}
      </p>
    </button>
  )
}

export default function TorreAssinaturasPage() {
  const [clientes, setClientes] = useState<MasterCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos")

  const loadClientes = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/master/clientes", {
        method: "GET",
        cache: "no-store",
      })

      const payload = (await response.json()) as ApiResponse

      if (!response.ok || payload?.ok === false || payload?.success === false) {
        throw new Error(
          payload?.message ||
            payload?.error ||
            "Não foi possível carregar as assinaturas.",
        )
      }

      setClientes(payload.data ?? payload.clientes ?? [])
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Erro desconhecido ao carregar assinaturas.",
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadClientes()
  }, [loadClientes])

  const assinaturas = useMemo(() => {
    return clientes.map(mapClienteToAssinatura)
  }, [clientes])

  const summary = useMemo(() => {
    return assinaturas.reduce(
      (acc, assinatura) => {
        acc.total += 1

        if (assinatura.precisaAtencao) acc.attention += 1
        if (assinatura.status === "trialing") acc.trialing += 1
        if (assinatura.status === "active") acc.active += 1
        if (assinatura.status === "awaiting_payment") acc.awaitingPayment += 1

        if (
          assinatura.status === "overdue" ||
          assinatura.status === "blocked" ||
          assinatura.status === "trial_ended"
        ) {
          acc.overdueOrBlocked += 1
        }

        if (assinatura.status === "canceled") acc.canceled += 1

        return acc
      },
      { ...defaultSummary },
    )
  }, [assinaturas])

  const filtered = useMemo(() => {
    const cleanSearch = normalizeText(search)

    return assinaturas.filter((assinatura) => {
      const matchesStatus = matchesStatusFilter(assinatura, statusFilter)

      const searchable = normalizeText([
        assinatura.cliente,
        assinatura.responsavel,
        assinatura.email,
        assinatura.plano,
        assinatura.statusLabel,
        assinatura.formaPagamento,
        assinatura.cobrancaStatus,
      ].join(" "))

      const matchesSearch = !cleanSearch || searchable.includes(cleanSearch)

      return matchesStatus && matchesSearch
    })
  }, [assinaturas, search, statusFilter])

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Torre de controle"
          title="Assinaturas"
          subtitle="Acompanhe o acesso dos clientes: teste, assinatura ativa, aguardando pagamento, bloqueios e cancelamentos."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <SummaryCard
            label="Total"
            value={summary.total}
            active={statusFilter === "todos"}
            onClick={() => setStatusFilter("todos")}
          />

          <SummaryCard
            label="Ação necessária"
            value={summary.attention}
            tone={summary.attention > 0 ? "danger" : "default"}
            active={statusFilter === "attention"}
            onClick={() => setStatusFilter("attention")}
          />

          <SummaryCard
            label="Em teste"
            value={summary.trialing}
            tone="blue"
            active={statusFilter === "trialing"}
            onClick={() => setStatusFilter("trialing")}
          />

          <SummaryCard
            label="Ativas"
            value={summary.active}
            tone="success"
            active={statusFilter === "active"}
            onClick={() => setStatusFilter("active")}
          />

          <SummaryCard
            label="Aguardando"
            value={summary.awaitingPayment}
            tone="warning"
            active={statusFilter === "awaiting_payment"}
            onClick={() => setStatusFilter("awaiting_payment")}
          />

          <SummaryCard
            label="Bloqueios"
            value={summary.overdueOrBlocked}
            tone={summary.overdueOrBlocked > 0 ? "danger" : "default"}
            active={statusFilter === "overdue_or_blocked"}
            onClick={() => setStatusFilter("overdue_or_blocked")}
          />
        </div>

        <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px_auto]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">
                Buscar assinatura
              </label>

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cliente, responsável, e-mail, plano ou status"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Status</label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="h-11 w-full rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm text-black outline-none transition focus:border-[#002198] focus:ring-2 focus:ring-[#002198]/10"
              >
                <option value="todos">Todos</option>
                <option value="attention">Ação necessária</option>
                <option value="trialing">Em teste</option>
                <option value="trial_ended">Teste encerrado</option>
                <option value="active">Ativas</option>
                <option value="awaiting_payment">Aguardando pagamento</option>
                <option value="grace_period">Em tolerância</option>
                <option value="overdue_or_blocked">Vencidas/Bloqueadas</option>
                <option value="canceled">Canceladas</option>
                <option value="sem_assinatura">Sem assinatura</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 xl:items-end xl:justify-end">
              <button
                type="button"
                onClick={() => void loadClientes()}
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
              Carregando assinaturas...
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Estou conferindo o acesso dos clientes.
            </p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <p className="text-base font-semibold text-black">
              Nenhuma assinatura encontrada.
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Ajuste os filtros ou atualize a tela.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-[#dfe7f7] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <div className="hidden grid-cols-[1.2fr_0.85fr_0.75fr_0.85fr_0.85fr_0.9fr_0.8fr] gap-4 border-b border-[#dfe7f7] bg-[#f8fbff] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:grid">
              <span>Cliente</span>
              <span>Assinatura</span>
              <span>Teste</span>
              <span>Próximo vencimento</span>
              <span>Cobrança</span>
              <span>Contato</span>
              <span className="text-right">Ação</span>
            </div>

            <div className="divide-y divide-[#dfe7f7]">
              {filtered.map((assinatura) => {
                const whatsappLink = buildWhatsAppLink(assinatura.whatsapp)

                return (
                  <div
                    key={assinatura.id}
                    className="grid gap-4 px-5 py-5 xl:grid-cols-[1.2fr_0.85fr_0.75fr_0.85fr_0.85fr_0.9fr_0.8fr] xl:items-start"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Cliente
                      </p>

                      <p className="mt-1 text-sm font-semibold text-black">
                        {assinatura.cliente}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {assinatura.responsavel}
                      </p>

                      <p className="mt-1 break-all text-xs text-neutral-500">
                        {assinatura.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Assinatura
                      </p>

                      <span
                        className={[
                          "mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                          getStatusClass(assinatura.status),
                        ].join(" ")}
                      >
                        {assinatura.statusLabel}
                      </span>

                      <p className="mt-2 text-xs text-neutral-500">
                        {assinatura.plano}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {formatMoney(assinatura.valor)} ·{" "}
                        {assinatura.formaPagamento}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Teste
                      </p>

                      {assinatura.diasRestantes === null ? (
                        <p className="mt-1 text-sm text-neutral-500">—</p>
                      ) : (
                        <>
                          <p className="mt-1 text-sm font-semibold text-black">
                            {assinatura.diasRestantes} dias
                          </p>

                          <p className="mt-1 text-xs text-neutral-500">
                            {assinatura.totalLancamentos}/
                            {TRIAL_LIMIT_TRANSACTIONS} lançamentos
                          </p>

                          <p className="mt-1 text-xs text-neutral-500">
                            até {formatDate(assinatura.trialEndsAt)}
                          </p>
                        </>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Próximo vencimento
                      </p>

                      <p className="mt-1 text-sm text-neutral-700">
                        {formatDate(assinatura.proximoVencimento)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Cobrança
                      </p>

                      <p className="mt-1 text-sm font-semibold text-black">
                        {assinatura.cobrancaStatus}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Venc.: {formatDate(assinatura.cobrancaVencimento)}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {formatMoney(assinatura.cobrancaValor)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Contato
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {assinatura.whatsapp || "WhatsApp não informado"}
                      </p>
                    </div>

                    <div className="xl:text-right">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Ação
                      </p>

                      {assinatura.precisaAtencao ? (
                        <span className="mb-2 inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                          Ação necessária
                        </span>
                      ) : null}

                      <div className="mt-2 flex flex-col gap-2">
                        <a
                          href="/cobrancas"
                          className="inline-flex w-full items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-3 py-2 text-xs font-semibold text-[#002198] transition hover:bg-[#eef3ff] xl:w-auto"
                        >
                          Ver cobranças
                        </a>

                        {assinatura.cobrancaLink ? (
                          <a
                            href={assinatura.cobrancaLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-full items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-3 py-2 text-xs font-semibold text-[#002198] transition hover:bg-[#eef3ff] xl:w-auto"
                          >
                            Abrir cobrança
                          </a>
                        ) : null}

                        {whatsappLink ? (
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#002198] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#00166f] xl:w-auto"
                          >
                            WhatsApp
                          </a>
                        ) : null}
                      </div>
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