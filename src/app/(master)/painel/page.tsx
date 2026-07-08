// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\(master)\painel\page.tsx

"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"

import PageContainer from "@/components/layout/PageContainer"
import PageHeader from "@/components/layout/PageHeader"
import { Card } from "@/components/ui"

type GenericRecord = Record<string, unknown>

type ApiPayload = {
  ok?: boolean
  success?: boolean
  message?: string
  error?: string
  data?: unknown
  items?: unknown
  clientes?: unknown
  cobrancas?: unknown
  assinaturas?: unknown
  summary?: unknown
  resumo?: unknown
}

type ClienteItem = {
  business_id?: string | null
  documento_cliente?: string | null
  razao_social?: string | null
  nome_cliente?: string | null
  negocio?: string | null
  name?: string | null
  email_financeiro?: string | null
  whatsapp?: string | null
  assinatura_status_code?: string | null
  assinatura_status_label?: string | null
  plano_label?: string | null
  assinatura_valor?: number | null
  data_ativacao?: string | null
  cliente_criado_em?: string | null
}

type CobrancaItem = {
  id?: string | null
  business_id?: string | null
  cliente?: string | null
  cliente_nome?: string | null
  razao_social?: string | null
  nome_cliente?: string | null
  valor?: number | null
  vencimento?: string | null
  pago_em?: string | null
  status?: string | null
  sync_status?: string | null
  ciclo_tipo?: string | null
  tipo?: string | null
  tipo_label?: string | null
  created_at?: string | null
  bling_cobranca_id?: string | null
  bling_link_pagamento?: string | null
}

type FinanceiroItem = {
  business_id?: string | null
  valor?: number | null
  status?: string | null
  vencimento?: string | null
  pago_em?: string | null
}

type AssinaturaItem = {
  business_id?: string | null
  status?: string | null
  assinatura_status_code?: string | null
  plano_label?: string | null
}

type BlingStatus = {
  connected?: boolean
  isConnected?: boolean
  status?: string | null
  token_expires_at?: string | null
  expires_at?: string | null
  data?: {
    connected?: boolean
    isConnected?: boolean
    status?: string | null
    token_expires_at?: string | null
    expires_at?: string | null
  }
}

type DashboardData = {
  clientes: ClienteItem[]
  cobrancas: CobrancaItem[]
  financeiro: FinanceiroItem[]
  assinaturas: AssinaturaItem[]
  bling: BlingStatus | null
}

const initialDashboardData: DashboardData = {
  clientes: [],
  cobrancas: [],
  financeiro: [],
  assinaturas: [],
  bling: null,
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function getNumber(value: unknown) {
  const numberValue = Number(value ?? 0)

  return Number.isFinite(numberValue) ? numberValue : 0
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—"

  const cleanValue = String(value).substring(0, 10)
  const [year, month, day] = cleanValue.split("-")

  if (!year || !month || !day) return "—"

  return `${day}/${month}/${year}`
}

function getDateTime(value: string | null | undefined) {
  if (!value) return 0

  const date = new Date(value)

  return Number.isFinite(date.getTime()) ? date.getTime() : 0
}

function isPastDate(value: string | null | undefined) {
  if (!value) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const date = new Date(`${String(value).substring(0, 10)}T00:00:00`)
  date.setHours(0, 0, 0, 0)

  return Number.isFinite(date.getTime()) && date < today
}

function asRecord(value: unknown): GenericRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as GenericRecord
  }

  return {}
}

function extractArray<T>(payload: ApiPayload, keys: string[]): T[] {
  const payloadRecord = asRecord(payload)

  for (const key of keys) {
    const value = payloadRecord[key]

    if (Array.isArray(value)) {
      return value as T[]
    }
  }

  if (Array.isArray(payload.data)) {
    return payload.data as T[]
  }

  return []
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    })

    const payload = (await response.json()) as ApiPayload

    if (!response.ok || payload?.ok === false || payload?.success === false) {
      return null
    }

    return payload as T
  } catch {
    return null
  }
}

function getLatestCobrancaByBusiness(cobrancas: CobrancaItem[]) {
  const map = new Map<string, CobrancaItem>()

  cobrancas.forEach((cobranca) => {
    const businessId =
      cobranca.business_id ||
      cobranca.id ||
      `${cobranca.cliente_nome || cobranca.cliente || "cliente"}-${cobranca.vencimento || ""}`

    const current = map.get(businessId)

    if (!current) {
      map.set(businessId, cobranca)
      return
    }

    const currentDate = getDateTime(current.created_at || current.vencimento)
    const newDate = getDateTime(cobranca.created_at || cobranca.vencimento)

    if (newDate >= currentDate) {
      map.set(businessId, cobranca)
    }
  })

  return Array.from(map.values())
}

function isPaidStatus(status: unknown) {
  return normalizeText(status) === "paid" || normalizeText(status) === "paga"
}

function isPendingStatus(status: unknown) {
  const normalized = normalizeText(status)

  return normalized === "pending" || normalized === "aberta" || normalized === "open"
}

function isOverdueStatus(status: unknown) {
  const normalized = normalizeText(status)

  return normalized === "overdue" || normalized === "vencida"
}

function isCanceledStatus(status: unknown) {
  const normalized = normalizeText(status)

  return normalized === "canceled" || normalized === "cancelada" || normalized === "cancelled"
}

function isErrorStatus(status: unknown, syncStatus?: unknown) {
  return normalizeText(status) === "error" || normalizeText(syncStatus) === "error"
}

function isTrialCliente(cliente: ClienteItem) {
  const status = normalizeText(cliente.assinatura_status_code)
  const plano = normalizeText(cliente.plano_label)

  return plano === "trial" || status.startsWith("trial_")
}

function isPlanoCliente(cliente: ClienteItem) {
  return !isTrialCliente(cliente)
}

function getClienteDisplayName(cliente: ClienteItem) {
  return (
    cliente.razao_social ||
    cliente.nome_cliente ||
    cliente.negocio ||
    cliente.name ||
    "Cliente sem nome"
  )
}

function getCobrancaDisplayName(cobranca: CobrancaItem) {
  return (
    cobranca.razao_social ||
    cobranca.nome_cliente ||
    cobranca.cliente_nome ||
    cobranca.cliente ||
    "Cliente não identificado"
  )
}

function getBlingConnected(bling: BlingStatus | null) {
  if (!bling) return false

  const nested = bling.data

  if (typeof bling.connected === "boolean") return bling.connected
  if (typeof bling.isConnected === "boolean") return bling.isConnected
  if (typeof nested?.connected === "boolean") return nested.connected
  if (typeof nested?.isConnected === "boolean") return nested.isConnected

  const status = normalizeText(bling.status || nested?.status)

  return status === "connected" || status === "conectado" || status === "ativo"
}

function getBlingExpiration(bling: BlingStatus | null) {
  if (!bling) return null

  return (
    bling.token_expires_at ||
    bling.expires_at ||
    bling.data?.token_expires_at ||
    bling.data?.expires_at ||
    null
  )
}

function MetricBlock({
  title,
  value,
  subtitle,
  href,
}: {
  title: string
  value: string | number
  subtitle?: string
  href?: string
}) {
  const content = (
    <Card className="h-full rounded-[24px] border border-[#dfe7f7] bg-white p-5 shadow-[0_16px_38px_rgba(15,23,42,0.04)] transition hover:shadow-[0_20px_48px_rgba(15,23,42,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-black">{value}</p>

          {subtitle ? (
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              {subtitle}
            </p>
          ) : null}
        </div>

        {href ? (
          <span className="rounded-full border border-[#dfe7f7] px-3 py-1 text-xs font-semibold text-[#002198]">
            Abrir
          </span>
        ) : null}
      </div>
    </Card>
  )

  if (!href) return content

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  )
}

function SectionCard({
  title,
  subtitle,
  children,
  href,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  href?: string
}) {
  return (
    <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
            {title}
          </p>

          {subtitle ? (
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              {subtitle}
            </p>
          ) : null}
        </div>

        {href ? (
          <Link
            href={href}
            className="shrink-0 rounded-full border border-[#dfe7f7] bg-white px-4 py-2 text-sm font-semibold text-[#002198] transition hover:bg-[#eef3ff]"
          >
            Abrir
          </Link>
        ) : null}
      </div>

      <div className="mt-5">{children}</div>
    </Card>
  )
}

function SimpleLine({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string | number
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#eef3ff] py-2 last:border-b-0">
      <span className="text-sm text-neutral-600">{label}</span>
      <span
        className={[
          "text-sm",
          strong ? "font-bold text-black" : "font-semibold text-neutral-800",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  )
}

function AlertLine({
  label,
  value,
  href,
}: {
  label: string
  value: number
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-2xl border border-[#dfe7f7] bg-[#f8fbff] px-4 py-3 transition hover:bg-[#eef3ff]"
    >
      <span className="text-sm font-medium text-black">{label}</span>

      <span
        className={[
          "rounded-full px-3 py-1 text-sm font-bold",
          value > 0
            ? "bg-amber-100 text-amber-800"
            : "bg-emerald-100 text-emerald-800",
        ].join(" ")}
      >
        {value}
      </span>
    </Link>
  )
}

function ActionButton({
  href,
  title,
  subtitle,
}: {
  href: string
  title: string
  subtitle: string
}) {
  return (
    <Link
      href={href}
      className="rounded-[22px] border border-[#dfe7f7] bg-white p-4 transition hover:-translate-y-0.5 hover:bg-[#f8fbff] hover:shadow-[0_16px_35px_rgba(15,23,42,0.06)]"
    >
      <p className="text-sm font-bold text-black">{title}</p>
      <p className="mt-1 text-sm leading-6 text-neutral-600">{subtitle}</p>
    </Link>
  )
}

export default function TorreControlePage() {
  const [dashboardData, setDashboardData] =
    useState<DashboardData>(initialDashboardData)
  const [loading, setLoading] = useState(true)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  const loadDashboard = useCallback(async () => {
    setLoading(true)

    const [
      clientesPayload,
      cobrancasPayload,
      financeiroPayload,
      assinaturasPayload,
      blingPayload,
    ] = await Promise.all([
      fetchJson<ApiPayload>("/api/master/clientes"),
      fetchJson<ApiPayload>("/api/master/cobrancas"),
      fetchJson<ApiPayload>("/api/master/financeiro"),
      fetchJson<ApiPayload>("/api/master/assinaturas"),
      fetchJson<BlingStatus>("/api/bling/status"),
    ])

    setDashboardData({
      clientes: clientesPayload
        ? extractArray<ClienteItem>(clientesPayload, ["data", "clientes", "items"])
        : [],
      cobrancas: cobrancasPayload
        ? extractArray<CobrancaItem>(cobrancasPayload, [
            "data",
            "cobrancas",
            "items",
          ])
        : [],
      financeiro: financeiroPayload
        ? extractArray<FinanceiroItem>(financeiroPayload, [
            "data",
            "financeiro",
            "items",
          ])
        : [],
      assinaturas: assinaturasPayload
        ? extractArray<AssinaturaItem>(assinaturasPayload, [
            "data",
            "assinaturas",
            "items",
          ])
        : [],
      bling: blingPayload,
    })

    setLastUpdatedAt(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const resumo = useMemo(() => {
    const clientes = dashboardData.clientes
    const cobrancasAtuais = getLatestCobrancaByBusiness(dashboardData.cobrancas)

    const totalClientes = clientes.length
    const clientesTrial = clientes.filter(isTrialCliente).length
    const clientesPlano = clientes.filter(isPlanoCliente).length

    const planosAtivos = clientes.filter(
      (cliente) => cliente.assinatura_status_code === "assinante_ativo",
    ).length

    const planosBloqueados = clientes.filter(
      (cliente) => cliente.assinatura_status_code === "assinante_bloqueado",
    ).length

    const planosEncerrados = clientes.filter(
      (cliente) => cliente.assinatura_status_code === "assinante_encerrado",
    ).length

    const trialAtivo = clientes.filter(
      (cliente) => cliente.assinatura_status_code === "trial_ativo",
    ).length

    const trialCongelado = clientes.filter(
      (cliente) => cliente.assinatura_status_code === "trial_congelado",
    ).length

    const trialEncerrado = clientes.filter(
      (cliente) => cliente.assinatura_status_code === "trial_encerrado",
    ).length

    const cobrancasAbertas = cobrancasAtuais.filter((cobranca) =>
      isPendingStatus(cobranca.status),
    ).length

    const cobrancasPagas = cobrancasAtuais.filter((cobranca) =>
      isPaidStatus(cobranca.status),
    ).length

    const cobrancasVencidas = cobrancasAtuais.filter((cobranca) => {
      if (isPaidStatus(cobranca.status) || isCanceledStatus(cobranca.status)) {
        return false
      }

      return isOverdueStatus(cobranca.status) || isPastDate(cobranca.vencimento)
    }).length

    const cobrancasComErro = cobrancasAtuais.filter((cobranca) =>
      isErrorStatus(cobranca.status, cobranca.sync_status),
    ).length

    const valorRecebido = cobrancasAtuais.reduce((acc, cobranca) => {
      if (!isPaidStatus(cobranca.status)) return acc

      return acc + getNumber(cobranca.valor)
    }, 0)

    const valorAReceber = cobrancasAtuais.reduce((acc, cobranca) => {
      if (
        isPaidStatus(cobranca.status) ||
        isCanceledStatus(cobranca.status) ||
        isErrorStatus(cobranca.status, cobranca.sync_status)
      ) {
        return acc
      }

      return acc + getNumber(cobranca.valor)
    }, 0)

    const valorVencido = cobrancasAtuais.reduce((acc, cobranca) => {
      if (
        isPaidStatus(cobranca.status) ||
        isCanceledStatus(cobranca.status) ||
        isErrorStatus(cobranca.status, cobranca.sync_status)
      ) {
        return acc
      }

      if (isOverdueStatus(cobranca.status) || isPastDate(cobranca.vencimento)) {
        return acc + getNumber(cobranca.valor)
      }

      return acc
    }, 0)

    const semCobranca = clientes.filter((cliente) => {
      return !cobrancasAtuais.some(
        (cobranca) => cobranca.business_id === cliente.business_id,
      )
    }).length

    const acaoManual =
      cobrancasComErro + cobrancasVencidas + planosBloqueados + semCobranca

    const blingConectado = getBlingConnected(dashboardData.bling)
    const blingExpiraEm = getBlingExpiration(dashboardData.bling)

    return {
      totalClientes,
      clientesTrial,
      clientesPlano,
      planosAtivos,
      planosBloqueados,
      planosEncerrados,
      trialAtivo,
      trialCongelado,
      trialEncerrado,
      cobrancasAtuais,
      cobrancasAbertas,
      cobrancasPagas,
      cobrancasVencidas,
      cobrancasComErro,
      valorRecebido,
      valorAReceber,
      valorVencido,
      semCobranca,
      acaoManual,
      blingConectado,
      blingExpiraEm,
    }
  }, [dashboardData])

  const proximasAcoes = useMemo(() => {
    const cobrancasAtuais = resumo.cobrancasAtuais

    return cobrancasAtuais
      .filter((cobranca) => {
        if (isPaidStatus(cobranca.status) || isCanceledStatus(cobranca.status)) {
          return false
        }

        return (
          isPendingStatus(cobranca.status) ||
          isOverdueStatus(cobranca.status) ||
          isPastDate(cobranca.vencimento) ||
          isErrorStatus(cobranca.status, cobranca.sync_status)
        )
      })
      .sort((a, b) => getDateTime(a.vencimento) - getDateTime(b.vencimento))
      .slice(0, 5)
  }, [resumo.cobrancasAtuais])

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <PageHeader
            eyebrow="Área master"
            title="Torre de Controle"
            subtitle="Visão geral do SaaS para acompanhar clientes, assinaturas, financeiro, cobranças, alertas e integrações."
          />

          <div className="flex flex-col items-start gap-2 xl:items-end">
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="rounded-full bg-[#002198] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#00166f]"
            >
              Atualizar painel
            </button>

            <p className="text-xs text-neutral-500">
              {loading
                ? "Atualizando informações..."
                : `Atualizado em ${lastUpdatedAt?.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricBlock
            title="Clientes"
            value={resumo.totalClientes}
            subtitle={`${resumo.clientesTrial} trial · ${resumo.clientesPlano} planos`}
            href="/clientes"
          />

          <MetricBlock
            title="A receber"
            value={formatMoney(resumo.valorAReceber)}
            subtitle={`${resumo.cobrancasAbertas} cobranças abertas`}
            href="/financeiro"
          />

          <MetricBlock
            title="Recebido"
            value={formatMoney(resumo.valorRecebido)}
            subtitle={`${resumo.cobrancasPagas} cobranças pagas`}
            href="/financeiro"
          />

          <MetricBlock
            title="Ação necessária"
            value={resumo.acaoManual}
            subtitle="Pendências que pedem conferência"
            href="/logs"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <SectionCard
            title="Assinaturas"
            subtitle="Resumo de trial, planos ativos, bloqueios e encerramentos."
            href="/assinaturas"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-[22px] border border-[#dfe7f7] bg-[#f8fbff] p-4">
                <SimpleLine label="Trial ativo" value={resumo.trialAtivo} />
                <SimpleLine
                  label="Trial congelado"
                  value={resumo.trialCongelado}
                />
                <SimpleLine
                  label="Trial encerrado"
                  value={resumo.trialEncerrado}
                />
              </div>

              <div className="rounded-[22px] border border-[#dfe7f7] bg-[#f8fbff] p-4">
                <SimpleLine label="Planos ativos" value={resumo.planosAtivos} />
                <SimpleLine
                  label="Bloqueados"
                  value={resumo.planosBloqueados}
                />
                <SimpleLine
                  label="Encerrados"
                  value={resumo.planosEncerrados}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Cobranças"
            subtitle="Situação atual das cobranças por cliente."
            href="/cobrancas"
          >
            <div className="rounded-[22px] border border-[#dfe7f7] bg-[#f8fbff] p-4">
              <SimpleLine
                label="Abertas"
                value={resumo.cobrancasAbertas}
                strong
              />
              <SimpleLine label="Pagas" value={resumo.cobrancasPagas} />
              <SimpleLine label="Vencidas" value={resumo.cobrancasVencidas} />
              <SimpleLine label="Com erro" value={resumo.cobrancasComErro} />
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <SectionCard
            title="Alertas operacionais"
            subtitle="Pontos que podem travar cobrança, acesso ou atendimento."
          >
            <div className="grid gap-3">
              <AlertLine
                label="Cobranças vencidas"
                value={resumo.cobrancasVencidas}
                href="/cobrancas"
              />

              <AlertLine
                label="Cobranças com erro"
                value={resumo.cobrancasComErro}
                href="/cobrancas"
              />

              <AlertLine
                label="Clientes sem cobrança atual"
                value={resumo.semCobranca}
                href="/clientes"
              />

              <AlertLine
                label="Planos bloqueados"
                value={resumo.planosBloqueados}
                href="/assinaturas"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Integração Bling"
            subtitle="Conexão usada para contatos, cobranças reais e continuidade financeira."
            href="/integracoes/bling"
          >
            <div className="rounded-[22px] border border-[#dfe7f7] bg-[#f8fbff] p-4">
              <SimpleLine
                label="Status"
                value={resumo.blingConectado ? "Conectado" : "A revisar"}
                strong
              />
              <SimpleLine
                label="Token expira em"
                value={formatDate(resumo.blingExpiraEm)}
              />
              <SimpleLine
                label="Cobranças com ID Bling"
                value={
                  resumo.cobrancasAtuais.filter(
                    (cobranca) => cobranca.bling_cobranca_id,
                  ).length
                }
              />
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Próximas conferências"
          subtitle="Cobranças abertas, vencidas ou com erro que merecem atenção primeiro."
          href="/cobrancas"
        >
          {proximasAcoes.length === 0 ? (
            <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">
                Nenhuma pendência crítica encontrada agora.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[22px] border border-[#dfe7f7]">
              <div className="grid grid-cols-[1.6fr_0.8fr_0.7fr_0.7fr] gap-4 border-b border-[#dfe7f7] bg-[#f8fbff] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#002198]">
                <span>Cliente</span>
                <span>Situação</span>
                <span>Vencimento</span>
                <span className="text-right">Valor</span>
              </div>

              <div className="divide-y divide-[#dfe7f7]">
                {proximasAcoes.map((cobranca, index) => (
                  <div
                    key={cobranca.id || `${cobranca.business_id}-${index}`}
                    className="grid grid-cols-[1.6fr_0.8fr_0.7fr_0.7fr] gap-4 px-4 py-3 text-sm text-neutral-700"
                  >
                    <span>{getCobrancaDisplayName(cobranca)}</span>
                    <span>
                      {isErrorStatus(cobranca.status, cobranca.sync_status)
                        ? "Com erro"
                        : isPastDate(cobranca.vencimento)
                          ? "Vencida"
                          : "Aberta"}
                    </span>
                    <span>{formatDate(cobranca.vencimento)}</span>
                    <span className="text-right">
                      {formatMoney(getNumber(cobranca.valor))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Ações rápidas">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ActionButton
              href="/financeiro"
              title="Financeiro"
              subtitle="Ver recebido, a receber e vencido."
            />

            <ActionButton
              href="/cobrancas"
              title="Cobranças"
              subtitle="Abrir, sincronizar ou enviar cobrança."
            />

            <ActionButton
              href="/assinaturas"
              title="Assinaturas"
              subtitle="Conferir trial, plano, bloqueio e status."
            />

            <ActionButton
              href="/clientes"
              title="Clientes"
              subtitle="Consultar cadastro, contato e endereço."
            />
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  )
}