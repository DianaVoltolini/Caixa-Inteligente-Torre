// src/app/master/torre-controle/page.tsx

"use client"

import Link from "next/link"

import PageContainer from "@/components/layout/PageContainer"
import PageHeader from "@/components/layout/PageHeader"
import { Card } from "@/components/ui"

export default function TorreControlePage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Área master"
          title="Torre de Controle"
          subtitle="Central operacional do SaaS para acompanhar leads, assinaturas, cobranças e operação interna."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <Link href="/torre-controle/leads" className="block">
            <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(15,23,42,0.08)] sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                Operação comercial
              </p>

              <h2 className="mt-2 text-2xl font-bold text-black">Leads</h2>

              <p className="mt-3 text-sm leading-7 text-neutral-600">
                Veja quem entrou no desafio, filtre por status e acompanhe sua
                base de captação.
              </p>
            </Card>
          </Link>

          <Link href="/torre-controle/clientes" className="block">
            <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(15,23,42,0.08)] sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                Acesso interno
              </p>

              <h2 className="mt-2 text-2xl font-bold text-black">
  	        Central de clientes
	      </h2>

              <p className="mt-3 text-sm leading-7 text-neutral-600">
                Acompanhe clientes, acessos, assinaturas e situação financeira de quem usa o Caixa Inteligente.
              </p>
            </Card>
          </Link>

          <Link href="/torre-controle/consulta-cnpj" className="block">
            <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(15,23,42,0.08)] sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                Consulta operacional
              </p>

              <h2 className="mt-2 text-2xl font-bold text-black">
                Consulta de CNPJ
              </h2>

              <p className="mt-3 text-sm leading-7 text-neutral-600">
                Consulte dados públicos de uma empresa para apoiar cadastros,
                validações e conferências internas.
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </PageContainer>
  )
}