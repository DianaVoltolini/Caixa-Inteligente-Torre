// src/features/torre-controle/components/LeadDetailModal.tsx

"use client"

import { Button, Card } from "@/components/ui"
import LeadStatusBadge from "@/features/torre-controle/components/LeadStatusBadge"
import type { LeadRow } from "@/features/torre-controle/services/leads.service"

type Props = {
  lead: LeadRow | null
  open: boolean
  onClose: () => void
}

function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="grid gap-2 border-b border-[#eef2f7] py-3 last:border-b-0 last:pb-0 md:grid-cols-[180px_minmax(0,1fr)] md:gap-6">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
        {label}
      </div>

      <div className="min-w-0 break-words text-sm leading-6 text-black">
        {value}
      </div>
    </div>
  )
}

export default function LeadDetailModal({
  lead,
  open,
  onClose,
}: Props) {
  if (!open || !lead) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]">
      <div className="flex min-h-dvh items-center justify-center p-4">
        <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-[#dfe7f7] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="border-b border-[#e8eefc] bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_55%,#eef3ff_100%)] px-6 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                  Detalhe do lead
                </p>

                <h2 className="mt-2 text-2xl font-bold text-black">
                  {lead.nome || "Sem nome"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Veja os dados principais do lead sem sair da Torre de Controle.
                </p>
              </div>

              <div className="shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-5 px-6 py-6">
            <Card
              variant="soft"
              className="rounded-2xl border-[#cfd8ff] bg-[#eeeeee] p-4 shadow-none"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#002198]">
                    Status atual do lead
                  </p>
                  <p className="mt-1 text-xs text-neutral-600">
                    Acompanhe rapidamente em que etapa esse lead está.
                  </p>
                </div>

                <div>
                  <LeadStatusBadge status={lead.status} />
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-[#e8eefc] bg-white p-5 shadow-none">
              <div className="space-y-1">
                <DetailRow label="Nome" value={lead.nome || "Não informado"} />
                <DetailRow label="Email" value={lead.email || "Não informado"} />
                <DetailRow
                  label="WhatsApp"
                  value={lead.whatsapp || "Não informado"}
                />
                <DetailRow
                  label="Origem"
                  value={lead.origem || "Não informada"}
                />
                <DetailRow
                  label="Entrada"
                  value={formatDateTime(lead.created_at)}
                />
                <DetailRow
                  label="Dificuldade"
                  value={lead.dificuldade || "Não informada"}
                />
              </div>
            </Card>

            <div className="rounded-2xl border border-[#e8eefc] bg-[#f8fbff] p-4">
              <p className="text-sm font-semibold text-black">
                Leitura rápida
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Use esse detalhe para entender o contexto antes de chamar a pessoa
                no WhatsApp, mover de status ou acompanhar a evolução dentro do
                funil.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}