// src/features/relatorios/components/RelatorioFornecedoresTabela.tsx

"use client"

import { Card } from "@/components/ui"
import { formatCurrency } from "@/lib/formatters"

type MovimentoItem = {
  data: string | null
  categoria: string
}

type Item = {
  fornecedor: string
  total: number
  movimentos?: MovimentoItem[]
}

type Props = {
  dados: Item[]
}

function formatarData(valor: string | null) {
  if (!valor) return "-"
  return new Date(valor).toLocaleDateString("pt-BR")
}

export function RelatorioFornecedoresTabela({ dados }: Props) {
  return (
    <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">

      <div className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
          Fornecedores
        </p>

        <h2 className="mt-2 text-xl font-bold text-black">
          Fornecedores que mais pesaram no seu caixa
        </h2>

        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Aqui você vê com quem mais gastou, em quais datas e em qual categoria esse valor entrou.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e8eefc] bg-[#fafbfd]">
            <tr className="text-left text-neutral-600">
              <th className="w-[28%] p-3">Fornecedor</th>
              <th className="w-[52%] p-3">Datas e categorias</th>
              <th className="w-[20%] p-3 text-right">Total gasto</th>
            </tr>
          </thead>

          <tbody>
            {dados.map((item, index) => {
              const movimentos = item.movimentos || []

              return (
                <tr
                  key={`${item.fornecedor}-${index}`}
                  className="border-b border-[#eef2f7] hover:bg-[#fafbfd]"
                >
                  <td className="p-3 font-medium text-black">
                    {item.fornecedor}
                  </td>

                  <td className="p-3">
                    <div className="space-y-2">
                      {movimentos.length > 0 ? (
                        movimentos.map((mov, i) => (
                          <p key={i} className="text-sm text-neutral-600">
                            <span className="font-medium text-black">
                              {formatarData(mov.data)}
                            </span>{" "}
                            - {mov.categoria || "Sem categoria"}
                          </p>
                        ))
                      ) : (
                        <span className="text-sm text-neutral-500">
                          Nenhum lançamento encontrado.
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-3 text-right font-medium text-rose-600">
                    {formatCurrency(item.total)}
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