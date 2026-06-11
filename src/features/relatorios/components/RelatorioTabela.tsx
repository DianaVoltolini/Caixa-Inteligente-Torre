// src/features/relatorios/components/RelatorioTabela.tsx

"use client"

import { formatCurrency } from "@/lib/formatters"

type RelatorioItem = {
  id?: string
  type?: "income" | "expense"
  amount?: number
  description?: string | null
  transaction_date?: string
  contact?: {
    name?: string
  } | null
}

type Props = {
  dados: RelatorioItem[]
}

export function RelatorioTabela({ dados }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-medium text-slate-700">
          Entradas e saídas do período
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Uma visão simples para você bater o olho e entender seu movimento financeiro.
        </p>
      </div>

      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr className="text-left text-slate-600">
            <th className="p-3">Data</th>
            <th className="p-3">Movimento</th>
            <th className="p-3">Detalhe</th>
            <th className="p-3 text-right">Valor</th>
          </tr>
        </thead>

        <tbody>
          {dados.map((item, index) => (
            <tr
              key={item.id ?? index}
              className="border-b border-slate-200 hover:bg-slate-50"
            >
              <td className="p-3">
                {item.transaction_date
                  ? new Date(item.transaction_date).toLocaleDateString("pt-BR")
                  : "-"}
              </td>

              <td className="p-3">
                {item.type === "income" && (
                  <span className="font-medium text-emerald-600">
                    Entrou dinheiro
                  </span>
                )}

                {item.type === "expense" && (
                  <span className="font-medium text-rose-600">
                    Saiu dinheiro
                  </span>
                )}
              </td>

              <td className="p-3 text-slate-700">
                {item.description || item.contact?.name || "-"}
              </td>

              <td className="p-3 text-right font-medium">
                {item.amount !== undefined
                  ? formatCurrency(Number(item.amount))
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}