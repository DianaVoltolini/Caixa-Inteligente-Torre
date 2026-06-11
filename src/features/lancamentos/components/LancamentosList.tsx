// src/features/lancamentos/components/LancamentosList.tsx

"use client"

import { formatCurrency } from "@/lib/formatters"
import { Transaction } from "@/features/lancamentos/hooks/useLancamentos"

interface Props {
  transactions?: Transaction[]
  loading: boolean
  onEdit?: (transaction: Transaction) => void
  onDelete?: (id: string) => void
}

function formatDate(date?: string) {
  if (!date) return ""
  const d = date.substring(0, 10)
  const [year, month, day] = d.split("-")
  return `${day}/${month}/${year}`
}

function formatTime(date?: string) {
  if (!date || date.length < 16) return ""
  return date.substring(11, 16)
}

function formatPhone(phone?: string) {
  if (!phone) return ""

  const clean = phone.replace(/\D/g, "")

  if (clean.length === 11) {
    return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7)}`
  }

  if (clean.length === 10) {
    return `(${clean.substring(0, 2)}) ${clean.substring(2, 6)}-${clean.substring(6)}`
  }

  return phone
}

function whatsappLink(phone?: string) {
  if (!phone) return "#"
  const clean = phone.replace(/\D/g, "")
  return `https://wa.me/55${clean}`
}

function totalServices(services?: Transaction["services"]) {
  if (!services) return 0

  return services.reduce((acc, s) => {
    return acc + Number(s.service_price || 0)
  }, 0)
}

export function LancamentosList({
  transactions,
  loading,
  onEdit,
  onDelete,
}: Props) {
  const list = Array.isArray(transactions) ? transactions : []

  return (
    <div className="rounded-[28px] border border-[#dfe7f7] bg-white shadow-[0_20px_48px_rgba(15,23,42,0.06)]">
      <div className="border-b border-[#eef2f7] px-6 py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
          Seus lançamentos
        </p>

        <h2 className="mt-2 text-lg font-semibold text-black">
          Tudo que entrou e saiu do seu caixa
        </h2>
      </div>

      <div className="divide-y divide-[#eef2f7]">
        {loading && (
          <div className="p-6 text-sm text-neutral-500">
            Carregando lançamentos...
          </div>
        )}

        {!loading && list.length === 0 && (
          <div className="p-6 text-sm text-neutral-500">
            Nenhum lançamento encontrado
          </div>
        )}

        {!loading &&
          list.map((t) => {
            const data = formatDate(t.transaction_date)
            const hora = formatTime(t.transaction_date)

            const totalServ = totalServices(t.services)
            const diferenca = Number(t.amount || 0) - totalServ

            const isReceita = t.type === "income"
            const isDespesa = t.type === "expense"

            return (
              <div
                key={t.id}
                className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-start lg:justify-between"
              >
                <div className="flex-1">
                  <div className="mb-2 text-sm font-medium">
                    {isReceita && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-600">
                        Receita
                      </span>
                    )}

                    {isDespesa && (
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-600">
                        {t.category?.is_fixed ? "Despesa Fixa" : "Despesa"}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-neutral-500">
                    {data}
                    {isReceita && hora && <> • {hora}</>}
                  </div>

                  {t.contact && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 font-medium text-slate-800">
                      <span>{t.contact.name}</span>

                      {t.contact.phone && (
                        <a
                          href={whatsappLink(t.contact.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-[#002198]"
                        >
                          {formatPhone(t.contact.phone)}
                        </a>
                      )}
                    </div>
                  )}

                  {isReceita && t.services && t.services.length > 0 && (
                    <div className="mt-3 text-sm text-neutral-500">
                      {t.services.map((s, i) => (
                        <div key={i}>
                          {s.service_name} ({formatCurrency(s.service_price)})
                        </div>
                      ))}
                    </div>
                  )}

                  {isReceita && diferenca !== 0 && (
                    <div className="mt-2 text-xs text-neutral-400">
                      {diferenca > 0 && <>Acréscimo {formatCurrency(diferenca)}</>}
                      {diferenca < 0 && <>Desconto {formatCurrency(Math.abs(diferenca))}</>}
                    </div>
                  )}

                  {isDespesa && (
                    <div className="mt-2 text-sm text-neutral-500">
                      {t.category?.name || "-"}
                    </div>
                  )}

                  {t.description && (
                    <div className="mt-2 text-xs text-neutral-400">
                      {t.description}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={
                      isReceita
                        ? "font-semibold text-emerald-600"
                        : "font-semibold text-rose-600"
                    }
                  >
                    {formatCurrency(t.amount)}
                  </div>

                  <button onClick={() => onEdit?.(t)}>✏️</button>
                  <button onClick={() => onDelete?.(t.id)}>🗑️</button>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}