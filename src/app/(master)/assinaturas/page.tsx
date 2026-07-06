// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\(master)\assinaturas\page.tsx

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import PageContainer from "@/components/layout/PageContainer"
import PageHeader from "@/components/layout/PageHeader"
import { Card, Input } from "@/components/ui"

type StatusFilter =
  | "todos"
  | "atencao"
  | "trial_ativo"
  | "trial_congelado"
  | "trial_encerrado"
  | "assinante_ativo"
  | "assinante_bloqueado"
  | "assinante_encerrado"

type AssinaturaItem = {
  id: string
  business_id: string
  data_cadastro: string | null
  cliente: string
  responsavel: string | null
  email: string | null
  whatsapp: string | null
  assinatura_tipo: "Trial" | "Assinante"
  data_ativacao: string | null
  status_code:
    | "trial_ativo"
    | "trial_congelado"
    | "trial_encerrado"
    | "assinante_ativo"
    | "assinante_bloqueado"
    | "assinante_encerrado"
  status_label: string
  status_raw: string | null
  plano: string | null
  valor: number | null
  trial_started_at: string | null
  trial_ends_at: string | null
  tolerancia_dias: number
  proximo_vencimento: string | null
  cobranca_id: string | null
  cobranca_status: string | null
  cobranca_label: string
  cobranca_valor: number | null
  cobranca_vencimento: string | null
  cobranca_link: string | null
  cobranca_bling_id: string | null
  cobranca_documento: string | null
  precisa_atencao: boolean
}

type ApiResponse = {
  ok: boolean
  message?: string
  summary?: {
    total: number
    trialAtivo: number
    trialCongelado: number
    trialEncerrado: number
    assinanteAtivo: number
    assinanteBloqueado: number
    assinanteEncerrado: number
    atencao: number
  }
  data?: AssinaturaItem[]
}

const emptySummary = {
  total: 0,
  trialAtivo: 0,
  trialCongelado: 0,
  trialEncerrado: 0,
  assinanteAtivo: 0,
  assinanteBloqueado: 0,
  assinanteEncerrado: 0,
  atencao: 0,
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

function onlyNumbers(value: string | null) {
  return String(value ?? "").replace(/\D/g, "")
}

function buildWhatsAppLink(whatsapp: string | null) {
  const digits = onlyNumbers(whatsapp)

  if (!digits) return null

  const normalized = digits.startsWith("55") ? digits : `55${digits}`

  return `https://wa.me/${normalized}`
}

function getAssinaturaClass(tipo: AssinaturaItem["assinatura_tipo"]) {
  if (tipo === "Assinante") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }

  return "border-[#cfd8ff] bg-[#eef3ff] text-[#002198]"
}

function getStatusClass(status: AssinaturaItem["status_code"]) {
  if (status === "assinante_ativo" || status === "trial_ativo") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }

  if (status === "trial_congelado") {
    return "border-amber-200 bg-amber-50 text-amber-900"
  }

  if (
    status === "trial_encerrado" ||
    status === "assinante_bloqueado"
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  if (status === "assinante_encerrado") {
    return "border-neutral-200 bg-neutral-50 text-neutral-700"
  }

  return "border-[#dfe7f7] bg-[#f8fbff] text-[#002198]"
}

function getCobrancaClass(status: string | null) {
  const value = String(status ?? "").toLowerCase()

  if (value === "paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }

  if (value === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-900"
  }

  if (value === "overdue" || value === "error") {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  if (value === "canceled") {
    return "border-neutral-200 bg-neutral-50 text-neutral-700"
  }

  return "border-[#dfe7f7] bg-[#f8fbff] text-[#002198]"
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
  tone?: "default" | "danger" | "success" | "warning" | "blue" | "neutral"
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
        "rounded-[28px] p-5 text-left shadow-[0_18px_45px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(15,23,42,0.08)]",
        className,
        active ? "ring-2 ring-[#002198] ring-offset-2" : "",
      ].join(" ")}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
        {label}
      </p>

      <p className={["mt-3 text-3xl font-bold", valueClass].join(" ")}>
        {value}
      </p>
    </button>
  )
}

export default function TorreAssinaturasPage() {
  const [items, setItems] = useState<AssinaturaItem[]>([])
  const [summary, setSummary] = useState(emptySummary)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos")

  const queryString = useMemo(() => {
    const params = new URLSearchParams()

    params.set("status", statusFilter)

    if (search.trim()) {
      params.set("search", search.trim())
    }

    return params.toString()
  }, [search, statusFilter])

  const loadAssinaturas = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/master/assinaturas?${queryString}`, {
        method: "GET",
        cache: "no-store",
      })

      const payload = (await response.json()) as ApiResponse

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.message || "Não foi possível carregar as assinaturas.",
        )
      }

      setItems(payload.data ?? [])
      setSummary(payload.summary ?? emptySummary)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Erro desconhecido ao carregar assinaturas.",
      )

      setItems([])
      setSummary(emptySummary)
    } finally {
      setLoading(false)
    }
  }, [queryString])

  useEffect(() => {
    void loadAssinaturas()
  }, [loadAssinaturas])

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Torre de controle"
          title="Assinaturas"
          subtitle="Acompanhe cada cliente por tipo de assinatura, fase atual, cobrança e datas principais."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          <SummaryCard
            label="Total"
            value={summary.total}
            active={statusFilter === "todos"}
            onClick={() => setStatusFilter("todos")}
          />

          <SummaryCard
            label="Trial ativo"
            value={summary.trialAtivo}
            tone="success"
            active={statusFilter === "trial_ativo"}
            onClick={() => setStatusFilter("trial_ativo")}
          />

          <SummaryCard
            label="Trial congelado"
            value={summary.trialCongelado}
            tone="warning"
            active={statusFilter === "trial_congelado"}
            onClick={() => setStatusFilter("trial_congelado")}
          />

          <SummaryCard
            label="Trial encerrado"
            value={summary.trialEncerrado}
            tone={summary.trialEncerrado > 0 ? "danger" : "default"}
            active={statusFilter === "trial_encerrado"}
            onClick={() => setStatusFilter("trial_encerrado")}
          />

          <SummaryCard
            label="Ativos"
            value={summary.assinanteAtivo}
            tone="success"
            active={statusFilter === "assinante_ativo"}
            onClick={() => setStatusFilter("assinante_ativo")}
          />

          <SummaryCard
            label="Bloqueados"
            value={summary.assinanteBloqueado}
            tone={summary.assinanteBloqueado > 0 ? "danger" : "default"}
            active={statusFilter === "assinante_bloqueado"}
            onClick={() => setStatusFilter("assinante_bloqueado")}
          />

          <SummaryCard
            label="Encerrados"
            value={summary.assinanteEncerrado}
            tone="neutral"
            active={statusFilter === "assinante_encerrado"}
            onClick={() => setStatusFilter("assinante_encerrado")}
          />
        </div>

        <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px_auto]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">
                Buscar assinatura
              </label>

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cliente, responsável, e-mail, WhatsApp, assinatura ou status"
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
                <option value="atencao">Ação necessária</option>
                <option value="trial_ativo">Trial ativo</option>
                <option value="trial_congelado">Trial congelado</option>
                <option value="trial_encerrado">Trial encerrado</option>
                <option value="assinante_ativo">Assinante ativo</option>
                <option value="assinante_bloqueado">Assinante bloqueado</option>
                <option value="assinante_encerrado">Assinante encerrado</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 xl:items-end xl:justify-end">
              <button
                type="button"
                onClick={() => void loadAssinaturas()}
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
          </Card>
        ) : items.length === 0 ? (
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
            <div className="hidden grid-cols-[0.75fr_1fr_1fr_0.75fr_0.85fr_0.85fr_0.9fr_0.75fr] gap-4 border-b border-[#dfe7f7] bg-[#f8fbff] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:grid">
              <span>Data</span>
              <span>Cliente</span>
              <span>Contato</span>
              <span>Assinatura</span>
              <span>Data de ativação</span>
              <span>Status</span>
              <span>Cobrança</span>
              <span className="text-right">Ação</span>
            </div>

            <div className="divide-y divide-[#dfe7f7]">
              {items.map((item) => {
                const whatsappLink = buildWhatsAppLink(item.whatsapp)

                return (
                  <div
                    key={item.id}
                    className="grid gap-4 px-5 py-5 xl:grid-cols-[0.75fr_1fr_1fr_0.75fr_0.85fr_0.85fr_0.9fr_0.75fr] xl:items-start"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Data
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Cadastro
                      </p>

                      <p className="mt-1 text-sm font-semibold text-black">
                        {formatDate(item.data_cadastro)}
                      </p>
                    </div>

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
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Contato
                      </p>

                      <p className="mt-1 break-all text-xs text-neutral-500">
                        {item.email || "E-mail não informado"}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {item.whatsapp || "WhatsApp não informado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Assinatura
                      </p>

                      <span
                        className={[
                          "mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                          getAssinaturaClass(item.assinatura_tipo),
                        ].join(" ")}
                      >
                        {item.assinatura_tipo}
                      </span>

                      <p className="mt-2 text-xs text-neutral-500">
                        {item.plano || "Plano não informado"}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {formatMoney(item.valor)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Data de ativação
                      </p>

                      <p className="mt-1 text-sm font-semibold text-black">
                        {formatDate(item.data_ativacao)}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Primeiro pagamento
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Status
                      </p>

                      <span
                        className={[
                          "mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                          getStatusClass(item.status_code),
                        ].join(" ")}
                      >
                        {item.status_label}
                      </span>

                      {item.status_code.startsWith("trial") ? (
                        <p className="mt-2 text-xs text-neutral-500">
                          Trial até {formatDate(item.trial_ends_at)}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-neutral-500">
                          Próx. venc.: {formatDate(item.proximo_vencimento)}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Cobrança
                      </p>

                      <span
                        className={[
                          "mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                          getCobrancaClass(item.cobranca_status),
                        ].join(" ")}
                      >
                        {item.cobranca_label}
                      </span>

                      <p className="mt-2 text-xs text-neutral-500">
                        Venc.: {formatDate(item.cobranca_vencimento)}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {formatMoney(item.cobranca_valor)}
                      </p>
                    </div>

                    <div className="xl:text-right">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Ação
                      </p>

                      <div className="mt-2 flex flex-col gap-2">
                        <a
                          href="/cobrancas"
                          className="inline-flex w-full items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-3 py-2 text-xs font-semibold text-[#002198] transition hover:bg-[#eef3ff] xl:w-auto"
                        >
                          Ver cobranças
                        </a>

                        {item.cobranca_link ? (
                          <a
                            href={item.cobranca_link}
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