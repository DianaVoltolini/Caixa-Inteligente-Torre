// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\(master)\clientes\page.tsx

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import PageContainer from "@/components/layout/PageContainer"
import PageHeader from "@/components/layout/PageHeader"
import { Card, Input } from "@/components/ui"

type StatusFilter =
  | "todos"
  | "com_email"
  | "com_whatsapp"
  | "sem_contato"
  | "sem_responsavel"
  | "recentes"

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

const defaultSummary = {
  total: 0,
  comEmail: 0,
  comWhatsapp: 0,
  semContato: 0,
  semResponsavel: 0,
  recentes: 0,
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—"

  const cleanValue = String(value).substring(0, 10)
  const [year, month, day] = cleanValue.split("-")

  if (!year || !month || !day) return "—"

  return `${day}/${month}/${year}`
}

function getClienteNome(cliente: MasterCliente) {
  return cliente.negocio || cliente.name || "Cliente sem nome"
}

function getResponsavel(cliente: MasterCliente) {
  return cliente.nome_responsavel || "Responsável não informado"
}

function getEmail(cliente: MasterCliente) {
  return cliente.email_financeiro || ""
}

function getWhatsapp(cliente: MasterCliente) {
  return cliente.whatsapp || ""
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "")
}

function buildWhatsAppLink(whatsapp: string) {
  const digits = onlyDigits(whatsapp)

  if (!digits) return null

  const normalized = digits.startsWith("55") ? digits : `55${digits}`

  return `https://wa.me/${normalized}`
}

function buildMailTo(email: string) {
  const cleanEmail = email.trim()

  if (!cleanEmail) return null

  return `mailto:${cleanEmail}`
}

function isRecent(value: string | null | undefined) {
  if (!value) return false

  const createdAt = new Date(value)

  if (Number.isNaN(createdAt.getTime())) return false

  const now = new Date()
  const diffInDays = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
  )

  return diffInDays <= 7
}

function matchesStatusFilter(cliente: MasterCliente, filter: StatusFilter) {
  const email = getEmail(cliente)
  const whatsapp = getWhatsapp(cliente)
  const responsavel = cliente.nome_responsavel?.trim() || ""

  if (filter === "todos") return true
  if (filter === "com_email") return Boolean(email)
  if (filter === "com_whatsapp") return Boolean(onlyDigits(whatsapp))
  if (filter === "sem_contato") return !email && !onlyDigits(whatsapp)
  if (filter === "sem_responsavel") return !responsavel
  if (filter === "recentes") return isRecent(cliente.cliente_criado_em)

  return true
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

export default function ClientesPage() {
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
            "Não foi possível carregar a Central de clientes.",
        )
      }

      setClientes(payload.data ?? payload.clientes ?? [])
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Erro desconhecido ao carregar clientes.",
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadClientes()
  }, [loadClientes])

  const summary = useMemo(() => {
    return clientes.reduce(
      (acc, cliente) => {
        const email = getEmail(cliente)
        const whatsapp = getWhatsapp(cliente)
        const responsavel = cliente.nome_responsavel?.trim() || ""

        acc.total += 1

        if (email) acc.comEmail += 1
        if (onlyDigits(whatsapp)) acc.comWhatsapp += 1
        if (!email && !onlyDigits(whatsapp)) acc.semContato += 1
        if (!responsavel) acc.semResponsavel += 1
        if (isRecent(cliente.cliente_criado_em)) acc.recentes += 1

        return acc
      },
      { ...defaultSummary },
    )
  }, [clientes])

  const filteredClientes = useMemo(() => {
    const cleanSearch = normalizeText(search)

    return clientes.filter((cliente) => {
      const matchesFilter = matchesStatusFilter(cliente, statusFilter)

      const searchable = normalizeText([
        getClienteNome(cliente),
        getResponsavel(cliente),
        getEmail(cliente),
        getWhatsapp(cliente),
        cliente.business_id,
      ].join(" "))

      const matchesSearch = !cleanSearch || searchable.includes(cleanSearch)

      return matchesFilter && matchesSearch
    })
  }, [clientes, search, statusFilter])

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Torre de controle"
          title="Central de clientes"
          subtitle="Base cadastral dos clientes do Caixa Inteligente. Use esta tela para localizar cliente, responsável, contato e identificação interna."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <SummaryCard
            label="Clientes"
            value={summary.total}
            active={statusFilter === "todos"}
            onClick={() => setStatusFilter("todos")}
          />

          <SummaryCard
            label="Com e-mail"
            value={summary.comEmail}
            tone="blue"
            active={statusFilter === "com_email"}
            onClick={() => setStatusFilter("com_email")}
          />

          <SummaryCard
            label="Com WhatsApp"
            value={summary.comWhatsapp}
            tone="success"
            active={statusFilter === "com_whatsapp"}
            onClick={() => setStatusFilter("com_whatsapp")}
          />

          <SummaryCard
            label="Sem contato"
            value={summary.semContato}
            tone={summary.semContato > 0 ? "danger" : "default"}
            active={statusFilter === "sem_contato"}
            onClick={() => setStatusFilter("sem_contato")}
          />

          <SummaryCard
            label="Sem responsável"
            value={summary.semResponsavel}
            tone={summary.semResponsavel > 0 ? "warning" : "default"}
            active={statusFilter === "sem_responsavel"}
            onClick={() => setStatusFilter("sem_responsavel")}
          />

          <SummaryCard
            label="Novos 7 dias"
            value={summary.recentes}
            tone="blue"
            active={statusFilter === "recentes"}
            onClick={() => setStatusFilter("recentes")}
          />
        </div>

        <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px_auto]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">
                Buscar cliente
              </label>

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Empresa, responsável, e-mail, WhatsApp ou ID interno"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">
                Situação cadastral
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="h-11 w-full rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm text-black outline-none transition focus:border-[#002198] focus:ring-2 focus:ring-[#002198]/10"
              >
                <option value="todos">Todos</option>
                <option value="com_email">Com e-mail</option>
                <option value="com_whatsapp">Com WhatsApp</option>
                <option value="sem_contato">Sem contato</option>
                <option value="sem_responsavel">Sem responsável</option>
                <option value="recentes">Novos nos últimos 7 dias</option>
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
              Carregando clientes...
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Estou organizando a base cadastral da Torre.
            </p>
          </Card>
        ) : filteredClientes.length === 0 ? (
          <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <p className="text-base font-semibold text-black">
              Nenhum cliente encontrado.
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Ajuste a busca ou os filtros para consultar a base.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-[#dfe7f7] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <div className="hidden grid-cols-[1.15fr_1fr_0.9fr_0.9fr_0.9fr_0.8fr] gap-4 border-b border-[#dfe7f7] bg-[#f8fbff] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:grid">
              <span>Cliente</span>
              <span>Responsável</span>
              <span>Contato</span>
              <span>Cadastro</span>
              <span>ID interno</span>
              <span className="text-right">Ação</span>
            </div>

            <div className="divide-y divide-[#dfe7f7]">
              {filteredClientes.map((cliente) => {
                const nome = getClienteNome(cliente)
                const responsavel = getResponsavel(cliente)
                const email = getEmail(cliente)
                const whatsapp = getWhatsapp(cliente)
                const whatsappLink = buildWhatsAppLink(whatsapp)
                const mailTo = buildMailTo(email)

                return (
                  <div
                    key={cliente.business_id || `${nome}-${email}`}
                    className="grid gap-4 px-5 py-5 xl:grid-cols-[1.15fr_1fr_0.9fr_0.9fr_0.9fr_0.8fr] xl:items-start"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Cliente
                      </p>

                      <p className="mt-1 text-sm font-semibold text-black">
                        {nome}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Negócio cadastrado no app
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Responsável
                      </p>

                      <p className="mt-1 text-sm text-neutral-700">
                        {responsavel}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Contato
                      </p>

                      <p className="mt-1 break-all text-xs text-neutral-700">
                        {email || "E-mail não informado"}
                      </p>

                      <p className="mt-1 text-xs text-neutral-600">
                        {whatsapp || "WhatsApp não informado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Cadastro
                      </p>

                      <p className="mt-1 text-sm text-neutral-700">
                        {formatDate(cliente.cliente_criado_em)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        ID interno
                      </p>

                      <p className="mt-1 break-all text-xs text-neutral-500">
                        {cliente.business_id || "—"}
                      </p>
                    </div>

                    <div className="xl:text-right">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Ação
                      </p>

                      <div className="flex flex-col gap-2 xl:items-end">
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

                        {mailTo ? (
                          <a
                            href={mailTo}
                            className="inline-flex w-full items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-3 py-2 text-xs font-semibold text-[#002198] transition hover:bg-[#eef3ff] xl:w-auto"
                          >
                            E-mail
                          </a>
                        ) : null}

                        <a
                          href="/assinaturas"
                          className="inline-flex w-full items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-3 py-2 text-xs font-semibold text-[#002198] transition hover:bg-[#eef3ff] xl:w-auto"
                        >
                          Ver assinatura
                        </a>

                        <a
                          href="/cobrancas"
                          className="inline-flex w-full items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-3 py-2 text-xs font-semibold text-[#002198] transition hover:bg-[#eef3ff] xl:w-auto"
                        >
                          Ver cobranças
                        </a>
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