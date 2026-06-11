// src/features/torre-controle/components/LeadsTable.tsx

"use client"

import { useState } from "react"

import { Button } from "@/components/ui"
import LeadStatusBadge from "@/features/torre-controle/components/LeadStatusBadge"
import type {
  LeadRow,
  LeadStatus,
} from "@/features/torre-controle/services/leads.service"

type Props = {
  leads: LeadRow[]
  savingLeadId: string | null
  onOpenDetail?: (lead: LeadRow) => void
  onUpdateStatus: (
    leadId: string,
    status: LeadStatus
  ) => Promise<{ success: boolean; error?: string }>
}

function formatDate(value: string) {
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

const STATUS_OPTIONS: Array<{ value: LeadStatus; label: string }> = [
  { value: "novo", label: "Novo" },
  { value: "contatado", label: "Contatado" },
  { value: "no_grupo", label: "No grupo" },
  { value: "engajado", label: "Engajado" },
  { value: "nao_respondeu", label: "Não respondeu" },
]

export default function LeadsTable({
  leads,
  savingLeadId,
  onOpenDetail,
  onUpdateStatus,
}: Props) {
  const [rowError, setRowError] = useState<string | null>(null)

  async function handleChangeStatus(leadId: string, status: string) {
    setRowError(null)

    const result = await onUpdateStatus(leadId, status)

    if (!result.success) {
      setRowError(result.error || "Não consegui atualizar o status do lead.")
    }
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-[28px] border border-[#dfe7f7] bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
        <p className="text-base font-semibold text-black">
          Nenhum lead encontrado
        </p>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Ajuste os filtros ou aguarde novas entradas do formulário.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {rowError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-medium text-rose-700">{rowError}</p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[28px] border border-[#dfe7f7] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
        <div className="hidden border-b border-[#e8eefc] bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_55%,#eef3ff_100%)] px-6 py-4 lg:grid lg:grid-cols-[1.1fr_1fr_0.8fr_0.9fr_0.9fr_1fr_0.8fr] lg:gap-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
            Lead
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
            Contato
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
            Origem
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
            Dificuldade
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
            Status atual
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
            Atualizar status
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
            Ação
          </span>
        </div>

        <div className="divide-y divide-[#eef2f7]">
          {leads.map((lead) => {
            const isSaving = savingLeadId === lead.id

            return (
              <div
                key={lead.id}
                className="grid gap-4 px-5 py-5 lg:grid-cols-[1.1fr_1fr_0.8fr_0.9fr_0.9fr_1fr_0.8fr] lg:items-start lg:gap-4 lg:px-6"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] lg:hidden">
                    Lead
                  </p>
                  <p className="mt-1 text-sm font-semibold text-black">
                    {lead.nome || "Sem nome"}
                  </p>
                  <p className="mt-1 break-all text-sm text-neutral-600">
                    {lead.email || "Sem email"}
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    Entrada em {formatDate(lead.created_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] lg:hidden">
                    Contato
                  </p>
                  <p className="mt-1 text-sm font-medium text-black">
                    {lead.whatsapp || "Sem WhatsApp"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] lg:hidden">
                    Origem
                  </p>
                  <p className="mt-1 text-sm text-neutral-700">
                    {lead.origem || "Não informada"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] lg:hidden">
                    Dificuldade
                  </p>
                  <p className="mt-1 text-sm leading-6 text-neutral-700">
                    {lead.dificuldade || "Não informada"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] lg:hidden">
                    Status atual
                  </p>
                  <div className="mt-1">
                    <LeadStatusBadge status={lead.status} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] lg:hidden">
                    Atualizar status
                  </p>

                  <div className="mt-1 space-y-2">
                    <select
                      value={lead.status || "novo"}
                      disabled={isSaving}
                      onChange={(e) =>
                        void handleChangeStatus(lead.id, e.target.value)
                      }
                      className="h-11 w-full rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm text-black outline-none transition focus:border-[#002198] focus:ring-2 focus:ring-[#002198]/10 disabled:cursor-not-allowed disabled:bg-neutral-50"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {isSaving ? (
                      <p className="text-xs text-neutral-500">
                        Salvando status...
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] lg:hidden">
                    Ação
                  </p>

                  <div className="mt-1">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => onOpenDetail?.(lead)}
                      className="w-full lg:w-auto"
                    >
                      Ver detalhe
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}