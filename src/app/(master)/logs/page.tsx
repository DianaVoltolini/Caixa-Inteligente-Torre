// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\(master)\logs\page.tsx

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import PageContainer from "@/components/layout/PageContainer"
import PageHeader from "@/components/layout/PageHeader"
import { Card, Input } from "@/components/ui"

type LogItem = {
  id: string
  created_at: string | null
  modulo: "assinatura" | "cobranca" | "bling" | "cliente" | "sistema"
  tipo: string
  status: "sucesso" | "erro" | "alerta" | "info"
  cliente: string
  email: string | null
  descricao: string
  detalhes: string | null
  business_id: string | null
}

type LogsResponse = {
  ok: boolean
  message?: string
  summary?: {
    total: number
    sucesso: number
    erro: number
    alerta: number
    cobranca: number
    assinatura: number
    cliente: number
  }
  data?: LogItem[]
}

type ModuloFilter =
  | "todos"
  | "cobranca"
  | "assinatura"
  | "cliente"
  | "bling"
  | "sistema"

type StatusFilter = "todos" | "sucesso" | "erro" | "alerta" | "info"

const defaultSummary = {
  total: 0,
  sucesso: 0,
  erro: 0,
  alerta: 0,
  cobranca: 0,
  assinatura: 0,
  cliente: 0,
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

function getModuloLabel(value: LogItem["modulo"]) {
  if (value === "cobranca") return "Cobrança"
  if (value === "assinatura") return "Assinatura"
  if (value === "cliente") return "Cliente"
  if (value === "bling") return "Bling"
  if (value === "sistema") return "Sistema"

  return value
}

function getStatusLabel(value: LogItem["status"]) {
  if (value === "sucesso") return "Sucesso"
  if (value === "erro") return "Erro"
  if (value === "alerta") return "Alerta"

  return "Info"
}

function getStatusClass(value: LogItem["status"]) {
  if (value === "sucesso") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }

  if (value === "erro") {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  if (value === "alerta") {
    return "border-amber-200 bg-amber-50 text-amber-900"
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
  tone?: "default" | "success" | "danger" | "warning" | "blue"
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

export default function LogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [summary, setSummary] = useState(defaultSummary)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [modulo, setModulo] = useState<ModuloFilter>("todos")
  const [status, setStatus] = useState<StatusFilter>("todos")

  const queryString = useMemo(() => {
    const params = new URLSearchParams()

    params.set("limit", "200")
    params.set("modulo", modulo)
    params.set("status", status)

    if (search.trim()) {
      params.set("search", search.trim())
    }

    return params.toString()
  }, [modulo, search, status])

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/master/logs?${queryString}`, {
        method: "GET",
        cache: "no-store",
      })

      const payload = (await response.json()) as LogsResponse

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Não foi possível carregar os logs.")
      }

      setLogs(payload.data ?? [])
      setSummary(payload.summary ?? defaultSummary)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Erro ao carregar logs.",
      )
      setLogs([])
      setSummary(defaultSummary)
    } finally {
      setLoading(false)
    }
  }, [queryString])

  useEffect(() => {
    void loadLogs()
  }, [loadLogs])

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Torre de controle"
          title="Logs"
          subtitle="Auditoria operacional do sistema: cobranças, assinaturas, clientes, erros e alertas."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <SummaryCard
            label="Total"
            value={summary.total}
            active={modulo === "todos" && status === "todos"}
            onClick={() => {
              setModulo("todos")
              setStatus("todos")
            }}
          />

          <SummaryCard
            label="Sucesso"
            value={summary.sucesso}
            tone="success"
            active={status === "sucesso"}
            onClick={() => {
              setModulo("todos")
              setStatus("sucesso")
            }}
          />

          <SummaryCard
            label="Erros"
            value={summary.erro}
            tone={summary.erro > 0 ? "danger" : "default"}
            active={status === "erro"}
            onClick={() => {
              setModulo("todos")
              setStatus("erro")
            }}
          />

          <SummaryCard
            label="Alertas"
            value={summary.alerta}
            tone={summary.alerta > 0 ? "warning" : "default"}
            active={status === "alerta"}
            onClick={() => {
              setModulo("todos")
              setStatus("alerta")
            }}
          />

          <SummaryCard
            label="Cobranças"
            value={summary.cobranca}
            tone="blue"
            active={modulo === "cobranca"}
            onClick={() => {
              setModulo("cobranca")
              setStatus("todos")
            }}
          />

          <SummaryCard
            label="Assinaturas"
            value={summary.assinatura}
            tone="blue"
            active={modulo === "assinatura"}
            onClick={() => {
              setModulo("assinatura")
              setStatus("todos")
            }}
          />
        </div>

        <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">
                Buscar log
              </label>

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cliente, e-mail, tipo, detalhe ou ID interno"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">
                Módulo
              </label>

              <select
                value={modulo}
                onChange={(event) =>
                  setModulo(event.target.value as ModuloFilter)
                }
                className="h-11 w-full rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm text-black outline-none transition focus:border-[#002198] focus:ring-2 focus:ring-[#002198]/10"
              >
                <option value="todos">Todos</option>
                <option value="cobranca">Cobrança</option>
                <option value="assinatura">Assinatura</option>
                <option value="cliente">Cliente</option>
                <option value="bling">Bling</option>
                <option value="sistema">Sistema</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as StatusFilter)
                }
                className="h-11 w-full rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm text-black outline-none transition focus:border-[#002198] focus:ring-2 focus:ring-[#002198]/10"
              >
                <option value="todos">Todos</option>
                <option value="sucesso">Sucesso</option>
                <option value="erro">Erro</option>
                <option value="alerta">Alerta</option>
                <option value="info">Info</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 xl:items-end xl:justify-end">
              <button
                type="button"
                onClick={() => void loadLogs()}
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
              Carregando logs...
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Estou conferindo os eventos operacionais da Torre.
            </p>
          </Card>
        ) : logs.length === 0 ? (
          <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <p className="text-base font-semibold text-black">
              Nenhum log encontrado.
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Ajuste os filtros ou aguarde novos eventos do sistema.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-[#dfe7f7] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <div className="hidden grid-cols-[0.75fr_0.7fr_0.8fr_1fr_1.2fr_1.2fr] gap-4 border-b border-[#dfe7f7] bg-[#f8fbff] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:grid">
              <span>Data</span>
              <span>Módulo</span>
              <span>Status</span>
              <span>Cliente</span>
              <span>Evento</span>
              <span>Detalhes</span>
            </div>

            <div className="divide-y divide-[#dfe7f7]">
              {logs.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 px-5 py-5 xl:grid-cols-[0.75fr_0.7fr_0.8fr_1fr_1.2fr_1.2fr] xl:items-start"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                      Data
                    </p>

                    <p className="mt-1 text-sm text-neutral-700">
                      {formatDateTime(item.created_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                      Módulo
                    </p>

                    <p className="mt-1 text-sm font-semibold text-black">
                      {getModuloLabel(item.modulo)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                      Status
                    </p>

                    <span
                      className={[
                        "mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                        getStatusClass(item.status),
                      ].join(" ")}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                      Cliente
                    </p>

                    <p className="mt-1 text-sm font-semibold text-black">
                      {item.cliente}
                    </p>

                    <p className="mt-1 break-all text-xs text-neutral-500">
                      {item.email || "E-mail não informado"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                      Evento
                    </p>

                    <p className="mt-1 text-sm font-semibold text-black">
                      {item.tipo}
                    </p>

                    <p className="mt-1 text-xs text-neutral-600">
                      {item.descricao}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                      Detalhes
                    </p>

                    <p className="mt-1 break-words text-xs leading-5 text-neutral-500">
                      {item.detalhes || "—"}
                    </p>

                    {item.business_id ? (
                      <p className="mt-2 break-all text-[11px] text-neutral-400">
                        ID: {item.business_id}
                      </p>
                    ) : null}
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