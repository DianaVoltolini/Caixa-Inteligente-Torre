// src/features/relatorios/components/RelatorioFluxoTabela.tsx

"use client"

import { Card } from "@/components/ui"
import { formatCurrency } from "@/lib/formatters"

type FluxoItem = {
  data: string
  receitas: number
  despesas: number
  saldo: number
}

type Props = {
  dados: FluxoItem[]
}

export function RelatorioFluxoTabela({ dados }: Props) {
  let saldoAcumulado = 0

  return (
    <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">

      {/* Header */}
      <div className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
          Fluxo de caixa
        </p>

        <h2 className="mt-2 text-xl font-bold text-black">
          Caminho do seu dinheiro no período
        </h2>

        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Aqui você consegue acompanhar como o saldo foi se formando dia após dia.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e8eefc] bg-[#fafbfd]">
            <tr className="text-left text-neutral-600">
              <th className="p-3">Data</th>
              <th className="p-3 text-right">Entrou</th>
              <th className="p-3 text-right">Saiu</th>
              <th className="p-3 text-right">Saldo do dia</th>
              <th className="p-3 text-right">Como ficou o caixa</th>
            </tr>
          </thead>

          <tbody>
            {dados.map((item, index) => {
              saldoAcumulado += item.saldo

              return (
                <tr
                  key={`${item.data}-${index}`}
                  className="border-b border-[#eef2f7] hover:bg-[#fafbfd]"
                >
                  <td className="p-3 text-black">
                    {new Date(item.data).toLocaleDateString("pt-BR")}
                  </td>

                  <td className="p-3 text-right font-medium text-emerald-600">
                    {formatCurrency(item.receitas)}
                  </td>

                  <td className="p-3 text-right font-medium text-rose-600">
                    {formatCurrency(item.despesas)}
                  </td>

                  <td className="p-3 text-right font-medium text-black">
                    {formatCurrency(item.saldo)}
                  </td>

                  <td className="p-3 text-right font-bold text-black">
                    {formatCurrency(saldoAcumulado)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}