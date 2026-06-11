// src/app/(master)/torre-controle/assinaturas/page.tsx

"use client"

import { useEffect, useMemo, useState } from "react"

type StatusFilter =
  | "todos"
  | "trialing"
  | "active"
  | "awaiting_payment"
  | "frozen"
  | "canceled"

type MasterCliente = Record<string, unknown>

const TRIAL_LIMIT_DAYS = 7
const TRIAL_LIMIT_TRANSACTIONS = 30
const DAY_IN_MS = 1000 * 60 * 60 * 24

function getString(item: MasterCliente, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = item[key]

    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }

    if (typeof value === "number") {
      return String(value)
    }
  }

  return fallback
}

function getNumber(item: MasterCliente, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = item[key]

    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }

    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value)
    }
  }

  return fallback
}

function getDateString(item: MasterCliente, keys: string[]) {
  for (const key of keys) {
    const value = item[key]

    if (typeof value === "string" && value.trim()) {
      return value
    }
  }

  return null
}

function formatDate(value: string | null) {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return date.toLocaleDateString("pt-BR")
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function calcularDiasRestantes(trialEndsAt: string | null) {
  if (!trialEndsAt) return null

  const end = new Date(trialEndsAt)

  if (Number.isNaN(end.getTime())) return null

  const diff = end.getTime() - Date.now()

  return Math.max(0, Math.min(TRIAL_LIMIT_DAYS, Math.ceil(diff / DAY_IN_MS)))
}

function normalizarStatus(item: MasterCliente) {
  const status = getString(item, [
    "assinatura_status",
    "subscription_status",
    "status_assinatura",
    "status",
  ]).toLowerCase()

  const trialEndsAt = getDateString(item, [
    "trial_ends_at",
    "assinatura_trial_ends_at",
    "subscription_trial_ends_at",
  ])

  const totalLancamentos = getNumber(item, [
    "total_lancamentos",
    "transaction_count",
    "transactions_count",
    "uso_trial",
    "trial_usage",
  ])

  const diasRestantes = calcularDiasRestantes(trialEndsAt)

  const trialCongelado =
    (status === "trialing" || status === "trial") &&
    (diasRestantes === 0 || totalLancamentos >= TRIAL_LIMIT_TRANSACTIONS)

  if (trialCongelado) return "frozen"

  if (status === "trial") return "trialing"

  if (
    status === "active" ||
    status === "trialing" ||
    status === "awaiting_payment" ||
    status === "canceled" ||
    status === "frozen"
  ) {
    return status
  }

  return "sem_assinatura"
}

function getStatusLabel(status: string) {
  if (status === "active") return "Ativa"
  if (status === "trialing") return "Trial"
  if (status === "awaiting_payment") return "Aguardando pagamento"
  if (status === "frozen") return "Congelada"
  if (status === "canceled") return "Cancelada"
  return "Sem assinatura"
}

function getStatusClass(status: string) {
  if (status === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (status === "trialing") {
    return "border-blue-200 bg-blue-50 text-blue-700"
  }

  if (status === "awaiting_payment") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }

  if (status === "frozen") {
    return "border-orange-200 bg-orange-50 text-orange-700"
  }

  if (status === "canceled") {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  return "border-slate-200 bg-slate-50 text-slate-600"
}

function extrairListaClientes(payload: unknown): MasterCliente[] {
  if (!payload || typeof payload !== "object") return []

  const data = payload as Record<string, unknown>

  const candidates = [
    data.clientes,
    data.clients,
    data.data,
    data.items,
    data.users,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(
        (item): item is MasterCliente =>
          !!item && typeof item === "object" && !Array.isArray(item),
      )
    }
  }

  return []
}

function buildWhatsAppLink(whatsapp: string) {
  const digits = whatsapp.replace(/\D/g, "")

  if (!digits) return null

  const normalized = digits.startsWith("55") ? digits : `55${digits}`

  return `https://wa.me/${normalized}`
}

export default function TorreAssinaturasPage() {
  const [clientes, setClientes] = useState<MasterCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos")

  async function loadClientes() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/master/clientes", {
        method: "GET",
        cache: "no-store",
      })

      const payload = await response.json()

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error ?? "Não foi possível carregar as assinaturas.")
      }

      setClientes(extrairListaClientes(payload))
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadClientes()
  }, [])

  const assinaturas = useMemo(() => {
    return clientes.map((cliente) => {
      const status = normalizarStatus(cliente)
      const trialEndsAt = getDateString(cliente, [
        "trial_ends_at",
        "assinatura_trial_ends_at",
        "subscription_trial_ends_at",
      ])

      const totalLancamentos = getNumber(cliente, [
        "total_lancamentos",
        "transaction_count",
        "transactions_count",
        "uso_trial",
        "trial_usage",
      ])

      return {
        raw: cliente,
        id: getString(cliente, ["business_id", "id", "empresa_id"]),
        empresa: getString(cliente, [
          "empresa",
          "business_name",
          "name",
          "nome_empresa",
          "nome_fantasia",
          "razao_social",
        ], "Empresa sem nome"),
        responsavel: getString(cliente, [
          "responsavel",
          "nome_responsavel",
          "owner_name",
          "cliente_nome",
        ], "—"),
        email: getString(cliente, [
          "email",
          "email_financeiro",
          "financeiro_email",
          "owner_email",
        ], "—"),
        whatsapp: getString(cliente, [
          "whatsapp",
          "telefone",
          "celular",
        ]),
        plano: getString(cliente, [
          "plano",
          "assinatura_plano",
          "subscription_plan",
        ], "Plano Lucro Real"),
        valor: getNumber(cliente, [
          "valor",
          "assinatura_valor",
          "subscription_value",
        ], 29.9),
        status,
        trialEndsAt,
        diasRestantes: calcularDiasRestantes(trialEndsAt),
        totalLancamentos,
        cobrancaStatus: getString(cliente, [
          "cobranca_status",
          "charge_status",
          "ultima_cobranca_status",
        ], "—"),
        vencimento: getDateString(cliente, [
          "vencimento",
          "cobranca_vencimento",
          "ultima_cobranca_vencimento",
        ]),
        paymentLink: getString(cliente, [
          "bling_link_pagamento",
          "payment_link",
          "link_pagamento",
          "bling_link_boleto",
        ]),
      }
    })
  }, [clientes])

  const filtered = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase()

    return assinaturas.filter((assinatura) => {
      const matchesStatus =
        statusFilter === "todos" || assinatura.status === statusFilter

      const matchesSearch =
        !cleanSearch ||
        assinatura.empresa.toLowerCase().includes(cleanSearch) ||
        assinatura.responsavel.toLowerCase().includes(cleanSearch) ||
        assinatura.email.toLowerCase().includes(cleanSearch)

      return matchesStatus && matchesSearch
    })
  }, [assinaturas, search, statusFilter])

  const summary = useMemo(() => {
    return {
      total: assinaturas.length,
      trialing: assinaturas.filter((item) => item.status === "trialing").length,
      active: assinaturas.filter((item) => item.status === "active").length,
      awaitingPayment: assinaturas.filter((item) => item.status === "awaiting_payment").length,
      frozen: assinaturas.filter((item) => item.status === "frozen").length,
      canceled: assinaturas.filter((item) => item.status === "canceled").length,
    }
  }, [assinaturas])

  return (
    <main className="min-h-screen bg-[#F8FBFF] px-6 py-8 text-[#07122F]">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#002198]">
              Torre de Controle
            </p>

            <h1 className="mt-2 text-3xl font-bold text-[#07122F]">
              Assinaturas
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Acompanhe trial, clientes ativos, congelados, aguardando pagamento e cancelamentos do Caixa Inteligente.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadClientes()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#002198] px-5 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#00196F] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Atualizando..." : "Atualizar dados"}
          </button>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <ResumoCard label="Total" value={summary.total} />
          <ResumoCard label="Trial" value={summary.trialing} />
          <ResumoCard label="Ativas" value={summary.active} />
          <ResumoCard label="Aguardando" value={summary.awaitingPayment} />
          <ResumoCard label="Congeladas" value={summary.frozen} />
          <ResumoCard label="Canceladas" value={summary.canceled} />
        </section>

        <section className="rounded-[28px] border border-[#DFE7F7] bg-white p-5 shadow-xl shadow-blue-900/5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por empresa, responsável ou e-mail..."
              className="h-11 w-full rounded-2xl border border-[#DFE7F7] bg-white px-4 text-sm outline-none transition focus:border-[#002198] lg:max-w-md"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="h-11 rounded-2xl border border-[#DFE7F7] bg-white px-4 text-sm outline-none transition focus:border-[#002198]"
            >
              <option value="todos">Todos os status</option>
              <option value="trialing">Trial</option>
              <option value="active">Ativas</option>
              <option value="awaiting_payment">Aguardando pagamento</option>
              <option value="frozen">Congeladas</option>
              <option value="canceled">Canceladas</option>
            </select>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1100px] border-separate border-spacing-y-3 text-left">
              <thead>
                <tr className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  <th className="px-4">Cliente</th>
                  <th className="px-4">Plano</th>
                  <th className="px-4">Status</th>
                  <th className="px-4">Trial</th>
                  <th className="px-4">Uso</th>
                  <th className="px-4">Cobrança</th>
                  <th className="px-4">Vencimento</th>
                  <th className="px-4 text-right">Ações</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="rounded-2xl bg-[#F8FBFF] p-6 text-center text-sm text-slate-500">
                      Carregando assinaturas...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="rounded-2xl bg-[#F8FBFF] p-6 text-center text-sm text-slate-500">
                      Nenhuma assinatura encontrada.
                    </td>
                  </tr>
                ) : (
                  filtered.map((assinatura) => {
                    const whatsappLink = buildWhatsAppLink(assinatura.whatsapp)

                    return (
                      <tr key={assinatura.id || assinatura.email} className="rounded-2xl bg-[#F8FBFF] text-sm">
                        <td className="rounded-l-2xl px-4 py-4">
                          <div className="font-semibold text-[#07122F]">
                            {assinatura.empresa}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {assinatura.responsavel}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {assinatura.email}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-semibold text-[#07122F]">
                            {assinatura.plano}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {formatCurrency(assinatura.valor)}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(assinatura.status)}`}>
                            {getStatusLabel(assinatura.status)}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          {assinatura.diasRestantes === null ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <div>
                              <div className="font-semibold text-[#07122F]">
                                {assinatura.diasRestantes} dias
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                até {formatDate(assinatura.trialEndsAt)}
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-semibold text-[#07122F]">
                            {assinatura.totalLancamentos}/{TRIAL_LIMIT_TRANSACTIONS}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            lançamentos
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-semibold text-[#07122F]">
                            {assinatura.cobrancaStatus}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {formatDate(assinatura.vencimento)}
                        </td>

                        <td className="rounded-r-2xl px-4 py-4">
                          <div className="flex justify-end gap-2">
                            {assinatura.paymentLink && (
                              <a
                                href={assinatura.paymentLink}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-[#DFE7F7] bg-white px-3 py-2 text-xs font-semibold text-[#002198] transition hover:border-[#002198]"
                              >
                                Pagamento
                              </a>
                            )}

                            {whatsappLink && (
                              <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-[#DFE7F7] bg-white px-3 py-2 text-xs font-semibold text-[#002198] transition hover:border-[#002198]"
                              >
                                WhatsApp
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}

function ResumoCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-[24px] border border-[#DFE7F7] bg-white p-5 shadow-lg shadow-blue-900/5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold text-[#07122F]">
        {value}
      </p>
    </div>
  )
}