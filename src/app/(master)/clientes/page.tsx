// src/app/master/torre-controle/clientes/page.tsx

"use client"

import { useState } from "react"

import PageContainer from "@/components/layout/PageContainer"
import PageHeader from "@/components/layout/PageHeader"
import { Card, Input } from "@/components/ui"

import { useMasterUsers } from "@/features/torre-controle/hooks/useMasterUsers"

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: number
  tone?: "default" | "danger"
}) {
  return (
    <Card
      className={[
        "rounded-[28px] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]",
        tone === "danger"
          ? "border border-rose-200 bg-rose-50"
          : "border border-[#dfe7f7] bg-white",
      ].join(" ")}
    >
      <p
        className={[
          "text-[11px] font-bold uppercase tracking-[0.18em]",
          tone === "danger" ? "text-rose-700" : "text-[#002198]",
        ].join(" ")}
      >
        {label}
      </p>

      <p
        className={[
          "mt-3 text-3xl font-bold",
          tone === "danger" ? "text-rose-800" : "text-black",
        ].join(" ")}
      >
        {value}
      </p>
    </Card>
  )
}

function formatDate(value: string | null) {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatMoney(value: number | null) {
  if (value === null || value === undefined) return "—"

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function getAssinaturaLabel(status: string | null) {
  switch (status) {
    case "trialing":
      return "Em teste"
    case "awaiting_payment":
      return "Aguardando pagamento"
    case "canceled":
      return "Cancelada"
    default:
      return status || "Sem assinatura"
  }
}

function getFinanceiroLabel(status: string | null) {
  switch (status) {
    case "pending":
      return "Pendente"
    case "canceled":
      return "Cancelada"
    default:
      return status || "Sem cobrança"
  }
}

function getFormaPagamentoLabel(value: string | null) {
  switch (value) {
    case "boleto":
      return "Boleto"
    case "pix":
      return "Pix"
    default:
      return value || "—"
  }
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

function AssinaturaBadge({ status }: { status: string | null }) {
  if (status === "trialing") {
    return <StatusBadge label="Em teste" tone="blue" />
  }

  if (status === "awaiting_payment") {
    return <StatusBadge label="Aguardando pagamento" tone="warning" />
  }

  if (status === "canceled") {
    return <StatusBadge label="Cancelada" tone="danger" />
  }

  return <StatusBadge label={getAssinaturaLabel(status)} />
}

function FinanceiroBadge({ status }: { status: string | null }) {
  if (status === "pending") {
    return <StatusBadge label="Pendente" tone="warning" />
  }

  if (status === "canceled") {
    return <StatusBadge label="Cancelada" tone="danger" />
  }

  return <StatusBadge label={getFinanceiroLabel(status)} />
}

function AlertaFinanceiroBadge({ alerta }: { alerta: string }) {
  if (alerta === "aguardando_cancelamento_manual") {
    return (
      <StatusBadge
        label="Aguardando cancelamento manual"
        tone="danger"
      />
    )
  }

  if (alerta === "cobranca_pendente") {
    return <StatusBadge label="Cobrança pendente" tone="warning" />
  }

  if (alerta === "cobranca_cancelada") {
    return <StatusBadge label="Cobrança cancelada" tone="neutral" />
  }

  return <StatusBadge label="Sem alerta" tone="success" />
}

export default function ClientesPage() {
  const {
    users,
    loading,
    error,
    search,
    status,
    setSearch,
    setStatus,
    summary,
    reload,
  } = useMasterUsers()

  const [syncingBusinessId, setSyncingBusinessId] = useState<string | null>(
    null
  )

  async function handleSyncCharge(
    businessId: string,
    subscriptionId: string | null,
    cobrancaId: string | null
  ) {
    try {
      setSyncingBusinessId(businessId)

      const response = await fetch("/api/master/cobrancas/sincronizar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          subscriptionId,
          cobrancaId,
        }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.error || "Não foi possível sincronizar a cobrança."
        )
      }

      await reload()
    } catch (error: any) {
      alert(error?.message || "Erro ao sincronizar cobrança.")
    } finally {
      setSyncingBusinessId(null)
    }
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Torre de controle"
          title="Central de clientes"
          subtitle="Acompanhe clientes, acessos, assinaturas e situação financeira de quem usa o Caixa Inteligente."
        />

        {summary.aguardandoCancelamentoManual > 0 ? (
          <Card className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 shadow-[0_18px_45px_rgba(190,18,60,0.08)] sm:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-700">
              Atenção financeira
            </p>

            <h2 className="mt-2 text-xl font-bold text-rose-900">
              Existem cobranças vencidas aguardando atualização operacional.
            </h2>

            <p className="mt-2 text-sm leading-7 text-rose-800">
              Clique em sincronizar para consultar o Bling quando houver vínculo
              ou registrar como cobrança excluída quando ela não possuir ID no
              Bling.
            </p>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard label="Clientes" value={summary.total} />
          <SummaryCard label="Em teste" value={summary.trial} />
          <SummaryCard
            label="Aguardando pagamento"
            value={summary.aguardandoPagamento}
          />
          <SummaryCard label="Cancelados" value={summary.cancelados} />
          <SummaryCard
            label="Atualizar manualmente"
            value={summary.aguardandoCancelamentoManual}
            tone={
              summary.aguardandoCancelamentoManual > 0 ? "danger" : "default"
            }
          />
        </div>

        <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">
                Buscar cliente
              </label>

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Busque por empresa, responsável, email ou WhatsApp"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">
                Filtrar por situação
              </label>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-11 w-full rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm text-black outline-none transition focus:border-[#002198] focus:ring-2 focus:ring-[#002198]/10"
              >
                <option value="todos">Todos</option>
                <option value="trialing">Em teste</option>
                <option value="awaiting_payment">
                  Aguardando pagamento
                </option>
                <option value="pending_charge">Cobrança pendente</option>
                <option value="manual_cancel_required">
                  Atualização manual
                </option>
                <option value="canceled">Cancelados</option>
              </select>
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
              Estou organizando a visão operacional da sua base.
            </p>
          </Card>
        ) : users.length === 0 ? (
          <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <p className="text-base font-semibold text-black">
              Nenhum cliente encontrado
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Quando novos clientes entrarem no SaaS, eles aparecerão aqui.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-[#dfe7f7] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <div className="hidden border-b border-[#e8eefc] bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_55%,#eef3ff_100%)] px-6 py-4 xl:grid xl:grid-cols-[1.2fr_1.1fr_0.9fr_0.9fr_0.9fr_1.1fr_1.2fr] xl:gap-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                Cliente
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                Contato
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                Assinatura
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                Cobrança
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                Forma
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                Vencimento
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                Ação
              </span>
            </div>

            <div className="divide-y divide-[#eef2f7]">
              {users.map((user) => (
                <div
                  key={user.business_id}
                  className="grid gap-4 px-5 py-5 xl:grid-cols-[1.2fr_1.1fr_0.9fr_0.9fr_0.9fr_1.1fr_1.2fr] xl:items-start xl:px-6"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                      Cliente
                    </p>

                    <p className="mt-1 text-sm font-semibold text-black">
                      {user.negocio}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-neutral-600">
                      {user.nome_responsavel || "Responsável não informado"}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      Cadastro: {formatDate(user.cliente_criado_em)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                      Contato
                    </p>

                    <p className="mt-1 break-all text-sm text-neutral-700">
                      {user.email_financeiro || "Email não informado"}
                    </p>

                    <p className="mt-1 text-sm text-neutral-600">
                      {user.whatsapp || "WhatsApp não informado"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                      Assinatura
                    </p>

                    <div className="mt-1">
                      <AssinaturaBadge status={user.assinatura_status} />
                    </div>

                    <p className="mt-2 text-xs text-neutral-500">
                      {user.plano || "Plano não informado"} ·{" "}
                      {formatMoney(user.assinatura_valor)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                      Cobrança
                    </p>

                    <div className="mt-1">
                      <FinanceiroBadge status={user.cobranca_status} />
                    </div>

                    <p className="mt-2 text-xs text-neutral-500">
                      {formatMoney(user.cobranca_valor)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                      Forma
                    </p>

                    <p className="mt-1 text-sm font-medium text-black">
                      {getFormaPagamentoLabel(user.forma_pagamento)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                      Vencimento
                    </p>

                    <p className="mt-1 text-sm text-neutral-700">
                      Cobrança: {formatDate(user.cobranca_vencimento)}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      Próximo ciclo: {formatDate(user.proximo_vencimento)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                      Ação
                    </p>

                    <div className="mt-1">
                      <AlertaFinanceiroBadge
                        alerta={user.alerta_financeiro}
                      />
                    </div>

                    {user.alerta_financeiro ===
                    "aguardando_cancelamento_manual" ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleSyncCharge(
                            user.business_id,
                            user.assinatura_id,
                            user.cobranca_id
                          )
                        }
                        disabled={syncingBusinessId === user.business_id}
                        className="mt-3 inline-flex items-center rounded-2xl border border-[#002198] bg-white px-3 py-2 text-xs font-semibold text-[#002198] transition hover:bg-[#eef3ff] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {syncingBusinessId === user.business_id
                          ? "Atualizando..."
                          : "Sincronizar cobrança"}
                      </button>
                    ) : null}

                    {user.cobranca_sync_status === "error" ? (
                      <p className="mt-2 text-xs font-medium text-rose-700">
                        Falha de sincronização
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