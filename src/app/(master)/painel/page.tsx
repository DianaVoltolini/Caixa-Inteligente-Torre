// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\(master)\painel\page.tsx

"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

import PageContainer from "@/components/layout/PageContainer"
import PageHeader from "@/components/layout/PageHeader"
import { Card } from "@/components/ui"

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

type PainelAction = {
  id: string
  type: string
  title: string
  cliente: string
  email: string | null
  description: string
  href: string
  createdAt: string | null
}

type RecentClient = {
  id: string
  cliente: string
  responsavel: string | null
  email: string | null
  whatsapp: string | null
  createdAt: string | null
  href: string
}

type PainelData = {
  summary: PainelSummary
  actions: PainelAction[]
  recentClients: RecentClient[]
  updatedAt: string
}

type ApiResponse = {
  ok: boolean
  message?: string
  data?: PainelData
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
  const [data, setData] = useState<PainelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPainel = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/master/painel", {
        method: "GET",
        cache: "no-store",
      })

      const payload = (await response.json()) as ApiResponse

      if (!response.ok || payload.ok === false || !payload.data) {
        throw new Error(
          payload.message || "Não foi possível carregar o painel da Torre.",
        )
      }

      setData(payload.data)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Erro ao carregar painel.",
      )
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPainel()
  }, [loadPainel])

  const summary = data?.summary ?? emptySummary

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
                : data?.updatedAt
                  ? `Atualizado em ${formatDateTime(data.updatedAt)}`
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
            ) : data?.actions?.length ? (
              <div className="mt-5 divide-y divide-[#dfe7f7]">
                {data.actions.map((item) => (
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
                      {item.description}
                    </p>

                    {item.email ? (
                      <p className="mt-1 break-all text-xs text-neutral-500">
                        {item.email}
                      </p>
                    ) : null}
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
            ) : data?.recentClients?.length ? (
              <div className="mt-5 divide-y divide-[#dfe7f7]">
                {data.recentClients.map((client) => (
                  <Link
                    key={client.id}
                    href={client.href}
                    className="block py-4 transition hover:bg-[#f8fbff]"
                  >
                    <p className="text-sm font-semibold text-black">
                      {client.cliente}
                    </p>

                    <p className="mt-1 text-sm text-neutral-700">
                      {client.responsavel || "Responsável não informado"}
                    </p>

                    <p className="mt-1 break-all text-xs text-neutral-500">
                      {client.email || "E-mail não informado"}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      Cadastro: {formatDateTime(client.createdAt)}
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