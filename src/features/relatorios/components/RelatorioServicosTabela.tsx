// src/features/relatorios/components/RelatorioServicosTabela.tsx

"use client"

import { Card } from "@/components/ui"
import { formatCurrency } from "@/lib/formatters"

type ServicoItem = {
  servico: string
  quantidade: number
  total_valor: number
  ticket_medio: number
}

type Props = {
  dados: ServicoItem[]
}

export function RelatorioServicosTabela({ dados }: Props) {
  return (
    <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">

      <div className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
          Serviços
        </p>

        <h2 className="mt-2 text-xl font-bold text-black">
          Serviços que mais colocam dinheiro no seu caixa
        </h2>

        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Use essa visão para entender o que mais vende e o que vale divulgar mais.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e8eefc] bg-[#fafbfd]">
            <tr className="text-left text-neutral-600">
              <th className="p-3">Serviço</th>
              <th className="p-3 text-right">Qtde</th>
              <th className="p-3 text-right">Quanto gerou</th>
              <th className="p-3 text-right">Média por serviço</th>
            </tr>
          </thead>

          <tbody>
            {dados.map((item, index) => (
              <tr
                key={`${item.servico}-${index}`}
                className="border-b border-[#eef2f7] hover:bg-[#fafbfd]"
              >
                <td className="p-3 font-medium text-black">
                  {item.servico}
                </td>

                <td className="p-3 text-right text-neutral-700">
                  {item.quantidade}
                </td>

                <td className="p-3 text-right font-medium text-emerald-600">
                  {formatCurrency(item.total_valor)}
                </td>

                <td className="p-3 text-right text-neutral-700">
                  {formatCurrency(item.ticket_medio)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}