// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\(master)\painel\page.tsx

"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"

import PageContainer from "@/components/layout/PageContainer"
import PageHeader from "@/components/layout/PageHeader"
import { Card } from "@/components/ui"

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

type ClientesResponse = {
  ok?: boolean
  success?: boolean
  message?: string
  error?: string
  data?: MasterCliente[]
  clientes?: MasterCliente[]
}

type CobrancasResponse = {
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

type PainelSummary = {
  clientesTotal: number
  clientesNovos7Dias: number
  assinaturasAtivas: number
  emTeste: number
  aguardandoPagamento: number
  bloqueios: number
  cobrancasAbertas: number
  cobrancasVencidas: number
  cobrancasPagas: number
  cobrancasErro: number
  acaoManual: number
}

const emptySummary: PainelSummary = {
  clientesTotal: 0,
  clientesNovos7Dias: 0,
  assinaturasAtivas: 0,
  emTeste: 0,
  aguardandoPagamento: 0,
  bloqueios: 0,
  cobrancasAbertas: 0,
  cobrancasVencidas: 0,
  cobrancasPagas: 0,
  cobrancasErro: 0,
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

  if (status === "trial") return "trialing"
  if (status === "cancelled") return "canceled"

  return status
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—"

  const cleanValue = String(value).substring(0, 10)
  const [year, month, day] = cleanValue.split("-")

  if (!year || !month || !day) return "—"

  return `${day}/${month}/${year}`
}

function formatDateTime(value: string | null | undefined) {
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

function isPastDate(value: string | null | undefined) {
  if (!value) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const date = new Date(`${String(value).substring(0, 10)}T00:00:00`)
  date.setHours(0, 0, 0, 0)

  return Number.isFinite(date.getTime()) && date < today
}

function getClienteNome(cliente: MasterCliente) {
  return cliente.negocio || cliente.name || "Cliente sem nome"
}

function getDiasRestantes(value: string | null | undefined) {
  if (!value) return null

  const end = new Date(`${String(value).substring(0, 10)}T23:59:59`)
  const diff = end.getTime() - Date.now()

  if (!Number.isFinite(diff)) return null

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function isTrialEncerrado(cliente: MasterCliente) {
  const status = normalizeStatus(cliente.assinatura_status)

  if (status !== "trialing") return false

  const diasRestantes = getDiasRestantes(cliente.trial_ends_at)
  const totalLancamentos = Number(cliente.total_lancamentos ?? 0)

  return diasRestantes === 0 || totalLancamentos >= 30
}

function isCobrancaAberta(cobranca: CobrancaItem) {
  const status = normalizeStatus(cobranca.status)

  return status === "pending" || status === "overdue" || status === "error"
}

function isCobrancaVencida(cobranca: CobrancaItem) {
  const status = normalizeStatus(cobranca.status)

  if (status === "overdue") return true

  return status === "pending" && isPastDate(cobranca.vencimento)
}

function getSummary(clientes: MasterCliente[], cobrancas: CobrancaItem[]) {
  const summary = { ...emptySummary }

  summary.clientesTotal = clientes.length
  summary.clientesNovos7Dias = clientes.filter((cliente) =>
    isRecent(cliente.cliente_criado_em),
  ).length

  clientes.forEach((cliente) => {
    const status = normalizeStatus(cliente.assinatura_status)

    if (status === "active") {
      summary.assinaturasAtivas += 1
    }

    if (status === "trialing" && !isTrialEncerrado(cliente)) {
      summary.emTeste += 1
    }

    if (status === "awaiting_payment") {
      summary.aguardandoPagamento += 1
      summary.acaoManual += 1
    }

    if (
      status === "grace_period" ||
      status === "overdue" ||
      status === "blocked" ||
      isTrialEncerrado(cliente)
    ) {
      summary.bloqueios += 1
      summary.acaoManual += 1
    }
  })

  cobrancas.forEach((cobranca) => {
    const status = normalizeStatus(cobranca.status)
    const syncStatus = normalizeStatus(cobranca.sync_status)

    if (isCobrancaAberta(cobranca)) {
      summary.cobrancasAbertas += 1
    }

    if (isCobrancaVencida(cobranca)) {
      summary.cobrancasVencidas += 1
    }

    if (status === "paid") {
      summary.cobrancasPagas += 1
    }

    if (status === "error" || syncStatus === "error") {
      summary.cobrancasErro += 1
    }

    if (cobranca.needs_action || status === "error" || syncStatus === "error") {
      summary.acaoManual += 1
    }
  })

  return summary
}

function SummaryCard({
  label,
  value,
  description,
  href,
  tone = "default",
}: {
  label: string
  value: number
  description: string
  href: string
  tone?: "default" | "success" | "warning" | "danger" | "blue"
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
    <Link href={href} className="block">
      <Card
        className={[
          "h-full rounded-[28px] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(15,23,42,0.08)]",
          className,
        ].join(" ")}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
          {label}
        </p>

        <p className={["mt-3 text-3xl font-bold", valueClass].join(" ")}>
          {value}
        </p>

        <p className="mt-2 text-xs leading-5 text-neutral-600">
          {description}
        </p>
      </Card>
    </Link>
  )
}

function ShortcutCard({
  eyebrow,
  title,
  description,
  href,
}: {
  eyebrow: string
  title: string
  description: string
  href: string
}) {
  return (
    <Link href={href} className="block">
      <Card className="h-full rounded-[28px] border border-[#dfe7f7] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(15,23,42,0.08)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-2xl font-bold text-black">{title}</h2>

        <p className="mt-3 text-sm leading-7 text-neutral-600">
          {description}
        </p>
      </Card>
    </Link>
  )
}

export default function TorreControlePage() {
  const [clientes, setClientes] = useState<MasterCliente[]>([])
  const [cobrancas, setCobrancas] = useState<CobrancaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const loadPainel = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [clientesResponse, cobrancasResponse] = await Promise.all([
        fetch("/api/master/clientes", {
          method: "GET",
          cache: "no-store",
        }),
        fetch("/api/master/cobrancas?status=todos&limit=300", {
          method: "GET",
          cache: "no-store",
        }),
      ])

      const clientesPayload =
        (await clientesResponse.json()) as ClientesResponse

      const cobrancasPayload =
        (await cobrancasResponse.json()) as CobrancasResponse

      if (
        !clientesResponse.ok ||
        clientesPayload?.ok === false ||
        clientesPayload?.success === false
      ) {
        throw new Error(
          clientesPayload?.message ||
            clientesPayload?.error ||
            "Não foi possível carregar os clientes.",
        )
      }

      if (!cobrancasResponse.ok || cobrancasPayload?.ok === false) {
        throw new Error(
          cobrancasPayload?.message ||
            "Não foi possível carregar as cobranças.",
        )
      }

      setClientes(clientesPayload.data ?? clientesPayload.clientes ?? [])
      setCobrancas(cobrancasPayload.data ?? [])
      setUpdatedAt(new Date().toISOString())
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Erro ao carregar painel.",
      )
      setClientes([])
      setCobrancas([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPainel()
  }, [loadPainel])

  const summary = useMemo(() => {
    return getSummary(clientes, cobrancas)
  }, [clientes, cobrancas])

  const actionItems = useMemo(() => {
    const cobrancasComAcao = cobrancas
      .filter((cobranca) => cobranca.needs_action)
      .slice(0, 5)
      .map((cobranca) => ({
        id: `cobranca-${cobranca.id}`,
        title: isCobrancaVencida(cobranca)
          ? "Cobrança vencida"
          : "Cobrança precisa de atenção",
        cliente: cobranca.cliente || "Cliente sem nome",
        detail: `Status: ${cobranca.status || "sem status"} · Vencimento: ${formatDate(
          cobranca.vencimento,
        )}`,
        href: "/cobrancas",
      }))

    const assinaturasComAcao = clientes
      .filter((cliente) => {
        const status = normalizeStatus(cliente.assinatura_status)

        return (
          status === "awaiting_payment" ||
          status === "grace_period" ||
          status === "overdue" ||
          status === "blocked" ||
          isTrialEncerrado(cliente)
        )
      })
      .slice(0, 5)
      .map((cliente) => ({
        id: `assinatura-${cliente.assinatura_id || cliente.business_id}`,
        title: isTrialEncerrado(cliente)
          ? "Teste encerrado"
          : "Assinatura precisa de atenção",
        cliente: getClienteNome(cliente),
        detail: `Status: ${
          cliente.assinatura_status || "sem status"
        } · Próximo vencimento: ${formatDate(cliente.proximo_vencimento)}`,
        href: "/assinaturas",
      }))

    return [...cobrancasComAcao, ...assinaturasComAcao].slice(0, 8)
  }, [clientes, cobrancas])

  const recentClients = useMemo(() => {
    return [...clientes]
      .sort((a, b) => {
        const dateA = new Date(a.cliente_criado_em || 0).getTime()
        const dateB = new Date(b.cliente_criado_em || 0).getTime()

        return dateB - dateA
      })
      .slice(0, 5)
  }, [clientes])

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Operação interna"
          title="Torre de Controle"
          subtitle="Resumo operacional do Caixa Inteligente: clientes, assinaturas, cobranças e pontos que precisam de atenção."
        />

        <div className="flex flex-col gap-3 rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-black">
              Status do painel
            </p>

            <p className="mt-1 text-sm leading-6 text-neutral-600">
              {loading
                ? "Carregando dados operacionais..."
                : updatedAt
                  ? `Atualizado em ${formatDateTime(updatedAt)}`
                  : "Painel carregado."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadPainel()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm font-semibold text-[#002198] transition hover:bg-[#eef3ff] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Atualizando..." : "Atualizar painel"}
          </button>
        </div>

        {error ? (
          <Card className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 shadow-none">
            <p className="text-sm font-semibold text-rose-700">{error}</p>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Clientes"
            value={summary.clientesTotal}
            description="Base total cadastrada no app."
            href="/clientes"
            tone="blue"
          />

          <SummaryCard
            label="Novos 7 dias"
            value={summary.clientesNovos7Dias}
            description="Clientes cadastrados recentemente."
            href="/clientes"
          />

          <SummaryCard
            label="Assinaturas ativas"
            value={summary.assinaturasAtivas}
            description="Clientes com acesso ativo."
            href="/assinaturas"
            tone="success"
          />

          <SummaryCard
            label="Em teste"
            value={summary.emTeste}
            description="Clientes ainda no período de teste."
            href="/assinaturas"
            tone="blue"
          />

          <SummaryCard
            label="Aguardando pagamento"
            value={summary.aguardandoPagamento}
            description="Clientes que precisam concluir a assinatura."
            href="/assinaturas"
            tone={summary.aguardandoPagamento > 0 ? "warning" : "default"}
          />

          <SummaryCard
            label="Bloqueios"
            value={summary.bloqueios}
            description="Trial encerrado, vencidos ou bloqueados."
            href="/assinaturas"
            tone={summary.bloqueios > 0 ? "danger" : "default"}
          />

          <SummaryCard
            label="Cobranças abertas"
            value={summary.cobrancasAbertas}
            description="Cobranças aguardando pagamento."
            href="/cobrancas"
            tone={summary.cobrancasAbertas > 0 ? "warning" : "default"}
          />

          <SummaryCard
            label="Ação manual"
            value={summary.acaoManual}
            description="Itens que precisam de conferência."
            href="/cobrancas"
            tone={summary.acaoManual > 0 ? "danger" : "default"}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                  Prioridade
                </p>

                <h2 className="mt-2 text-2xl font-bold text-black">
                  Ações que precisam de atenção
                </h2>
              </div>

              <Link
                href="/cobrancas"
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm font-semibold text-[#002198] transition hover:bg-[#eef3ff]"
              >
                Ver cobranças
              </Link>
            </div>

            {loading ? (
              <p className="mt-6 text-sm text-neutral-600">
                Carregando ações...
              </p>
            ) : actionItems.length ? (
              <div className="mt-5 divide-y divide-[#dfe7f7]">
                {actionItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="block py-4 transition hover:bg-[#f8fbff]"
                  >
                    <p className="text-sm font-semibold text-black">
                      {item.title}
                    </p>

                    <p className="mt-1 text-sm text-neutral-700">
                      {item.cliente}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                      {item.detail}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[22px] border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-semibold text-emerald-800">
                  Nenhuma ação manual pendente agora.
                </p>

                <p className="mt-1 text-sm leading-6 text-emerald-700">
                  Cobranças, assinaturas e bloqueios não indicaram alerta
                  operacional neste momento.
                </p>
              </div>
            )}
          </Card>

          <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                  Clientes
                </p>

                <h2 className="mt-2 text-2xl font-bold text-black">
                  Últimos cadastros
                </h2>
              </div>

              <Link
                href="/clientes"
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm font-semibold text-[#002198] transition hover:bg-[#eef3ff]"
              >
                Ver clientes
              </Link>
            </div>

            {loading ? (
              <p className="mt-6 text-sm text-neutral-600">
                Carregando clientes...
              </p>
            ) : recentClients.length ? (
              <div className="mt-5 divide-y divide-[#dfe7f7]">
                {recentClients.map((client) => (
                  <Link
                    key={client.business_id || `${getClienteNome(client)}-${client.email_financeiro}`}
                    href="/clientes"
                    className="block py-4 transition hover:bg-[#f8fbff]"
                  >
                    <p className="text-sm font-semibold text-black">
                      {getClienteNome(client)}
                    </p>

                    <p className="mt-1 text-sm text-neutral-700">
                      {client.nome_responsavel || "Responsável não informado"}
                    </p>

                    <p className="mt-1 break-all text-xs text-neutral-500">
                      {client.email_financeiro || "E-mail não informado"}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      Cadastro: {formatDateTime(client.cliente_criado_em)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-neutral-600">
                Nenhum cliente encontrado.
              </p>
            )}
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <ShortcutCard
            eyebrow="Financeiro"
            title="Cobranças"
            description="Acompanhe cobranças abertas, vencidas, pagas, erros e sincronização com o Bling."
            href="/cobrancas"
          />

          <ShortcutCard
            eyebrow="Acesso"
            title="Assinaturas"
            description="Veja clientes em teste, ativos, aguardando pagamento, bloqueados e cancelados."
            href="/assinaturas"
          />

          <ShortcutCard
            eyebrow="Cadastro"
            title="Central de clientes"
            description="Consulte dados cadastrais, responsável, e-mail, WhatsApp e identificação interna."
            href="/clientes"
          />
        </div>
      </div>
    </PageContainer>
  )
}