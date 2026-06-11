// src/app/master/torre-controle/leads/page.tsx

"use client"

import { useState } from "react"

import PageContainer from "@/components/layout/PageContainer"
import PageHeader from "@/components/layout/PageHeader"
import { Card } from "@/components/ui"

import LeadDetailModal from "@/features/torre-controle/components/LeadDetailModal"
import LeadsFilters from "@/features/torre-controle/components/LeadsFilters"
import LeadsTable from "@/features/torre-controle/components/LeadsTable"
import { useLeadsList } from "@/features/torre-controle/hooks/useLeadsList"
import type { LeadRow } from "@/features/torre-controle/services/leads.service"

function SummaryCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold text-black">{value}</p>
    </Card>
  )
}

export default function TorreControleLeadsPage() {
  const {
    leads,
    loading,
    error,
    search,
    status,
    savingLeadId,
    setSearch,
    setStatus,
    filteredCount,
    summary,
    updateStatus,
  } = useLeadsList()

  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null)

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Torre de controle"
          title="Leads"
          subtitle="Acompanhe quem entrou no desafio, filtre por status e organize sua operação comercial."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Leads filtrados" value={filteredCount} />
          <SummaryCard label="Novos" value={summary.novos} />
          <SummaryCard label="Contatados" value={summary.contatados} />
          <SummaryCard label="Engajados" value={summary.engajados} />
        </div>

        <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                Filtros
              </p>
              <h2 className="mt-2 text-xl font-bold text-black">
                Encontre o lead certo com rapidez
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Busque por nome, email ou WhatsApp e refine a lista pelo status atual.
              </p>
            </div>

            <LeadsFilters
              search={search}
              status={status}
              onSearchChange={setSearch}
              onStatusChange={setStatus}
            />
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
              Carregando leads...
            </p>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Estou organizando a sua lista para você.
            </p>
          </Card>
        ) : (
          <LeadsTable
            leads={leads}
            savingLeadId={savingLeadId}
            onOpenDetail={setSelectedLead}
            onUpdateStatus={updateStatus}
          />
        )}
      </div>

      <LeadDetailModal
        lead={selectedLead}
        open={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
      />
    </PageContainer>
  )
}