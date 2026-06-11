// src/features/relatorios/components/RelatorioCategoriasTabela.tsx

"use client"

import { Card } from "@/components/ui"
import { formatCurrency } from "@/lib/formatters"

type CategoriaItem = {
  categoria: string
  quantidade: number
  total: number
  media: number
}

type Props = {
  dados: CategoriaItem[]
}

export function RelatorioCategoriasTabela({ dados }: Props) {
  return (
    <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">
      
      {/* Header do card */}
      <div className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
          Categorias
        </p>

        <h2 className="mt-2 text-xl font-bold text-black">
          Categorias que mais pesaram no seu caixa
        </h2>

        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Use essa visão para entender onde você mais pagou e o que vale acompanhar mais de perto.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e8eefc] bg-[#fafbfd]">
            <tr className="text-left text-neutral-600">
              <th className="p-3">Categoria</th>
              <th className="p-3 text-right">Qtde</th>
              <th className="p-3 text-right">Quanto pagou</th>
              <th className="p-3 text-right">Média</th>
            </tr>
          </thead>

          <tbody>
            {dados.map((item, index) => (
              <tr
                key={`${item.categoria}-${index}`}
                className="border-b border-[#eef2f7] hover:bg-[#fafbfd]"
              >
                <td className="p-3 font-medium text-black">
                  {item.categoria}
                </td>

                <td className="p-3 text-right text-neutral-700">
                  {item.quantidade}
                </td>

                <td className="p-3 text-right font-medium text-rose-600">
                  {formatCurrency(item.total)}
                </td>

                <td className="p-3 text-right text-neutral-700">
                  {formatCurrency(item.media)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}