// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\(master)\painel\page.tsx

"use client"

import Link from "next/link"

import PageContainer from "@/components/layout/PageContainer"
import PageHeader from "@/components/layout/PageHeader"
import { Card } from "@/components/ui"

function OverviewCard({
  eyebrow,
  title,
  description,
  href,
  tone = "default",
}: {
  eyebrow: string
  title: string
  description: string
  href: string
  tone?: "default" | "blue" | "success" | "warning"
}) {
  const toneClass =
    tone === "blue"
      ? "border-[#cfd8ff] bg-[#eef3ff]"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50"
        : tone === "warning"
          ? "border-amber-200 bg-amber-50"
          : "border-[#dfe7f7] bg-white"

  return (
    <Link href={href} className="block">
      <Card
        className={[
          "h-full rounded-[28px] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(15,23,42,0.08)] sm:p-8",
          toneClass,
        ].join(" ")}
      >
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
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Área master"
          title="Torre de Controle"
          subtitle="Visão geral do Meu Caixa Inteligente para acompanhar operação, clientes, assinaturas, cobranças, financeiro e integrações."
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <OverviewCard
            eyebrow="Financeiro"
            title="Financeiro"
            description="Veja o resumo financeiro atual: valores em aberto, recebidos, vencidos, erros e cobranças que exigem atenção."
            href="/financeiro"
            tone="warning"
          />

          <OverviewCard
            eyebrow="Cobranças"
            title="Cobranças"
            description="Acompanhe cobranças abertas, pagas, vencidas, erros, links de pagamento e sincronização com o Bling."
            href="/cobrancas"
            tone="blue"
          />

          <OverviewCard
            eyebrow="Assinaturas"
            title="Assinaturas"
            description="Controle o acesso dos clientes: teste, assinatura ativa, aguardando pagamento, bloqueios e cancelamentos."
            href="/assinaturas"
            tone="success"
          />

          <OverviewCard
            eyebrow="Clientes"
            title="Central de clientes"
            description="Consulte cadastro, responsável, e-mail, WhatsApp e identificação interna dos clientes do SaaS."
            href="/clientes"
          />

          <OverviewCard
            eyebrow="Integração"
            title="Integração Bling"
            description="Verifique se a conexão com o Bling está ativa para criar contatos e cobranças reais."
            href="/integracoes/bling"
          />

          <OverviewCard
            eyebrow="Auditoria"
            title="Logs"
            description="Acompanhe eventos operacionais do sistema: cobranças, assinaturas, clientes, erros e alertas."
            href="/logs"
          />

          <OverviewCard
            eyebrow="Consulta operacional"
            title="Consulta de CNPJ"
            description="Consulte dados públicos de uma empresa para apoiar cadastros, validações e conferências internas."
            href="/consulta-cnpj"
          />

          <OverviewCard
            eyebrow="Comercial"
            title="Leads"
            description="Acompanhe entradas comerciais, filtros e contatos quando houver captação ativa de leads."
            href="/leads"
          />
        </div>

        <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
            Como usar a Torre
          </p>

          <h2 className="mt-2 text-2xl font-bold text-black">
            Ordem segura de acompanhamento
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[22px] border border-[#dfe7f7] bg-[#f8fbff] p-4">
              <p className="text-sm font-bold text-black">1. Financeiro</p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Veja a saúde financeira atual.
              </p>
            </div>

            <div className="rounded-[22px] border border-[#dfe7f7] bg-[#f8fbff] p-4">
              <p className="text-sm font-bold text-black">2. Cobranças</p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Resolva pagamentos abertos, vencidos ou com erro.
              </p>
            </div>

            <div className="rounded-[22px] border border-[#dfe7f7] bg-[#f8fbff] p-4">
              <p className="text-sm font-bold text-black">3. Assinaturas</p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Confira acesso, trial, bloqueio e status do cliente.
              </p>
            </div>

            <div className="rounded-[22px] border border-[#dfe7f7] bg-[#f8fbff] p-4">
              <p className="text-sm font-bold text-black">4. Logs</p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Confira o histórico quando precisar auditar algo.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
