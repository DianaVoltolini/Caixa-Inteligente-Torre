// src/features/relatorios/components/RelatorioClientesTabela.tsx

"use client"

import { Card } from "@/components/ui"
import { formatCurrency } from "@/lib/formatters"

type AtendimentoItem = {
  data: string | null
  servicos: string[]
}

type ClienteItem = {
  cliente: string
  total_pago: number
  atendimentos?: AtendimentoItem[]
}

type Props = {
  dados: ClienteItem[]
}

function formatarData(valor: string | null) {
  if (!valor) return "-"
  return new Date(valor).toLocaleDateString("pt-BR")
}

export function RelatorioClientesTabela({ dados }: Props) {
  return (
    <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-6">

      {/* Header */}
      <div className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
          Clientes
        </p>

        <h2 className="mt-2 text-xl font-bold text-black">
          Clientes que mais movimentaram seu caixa
        </h2>

        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Aqui você vê quem mais comprou com você, quanto entrou e quais serviços foram feitos em cada data.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e8eefc] bg-[#fafbfd]">
            <tr className="text-left text-neutral-600">
              <th className="w-[28%] p-3">Cliente</th>
              <th className="w-[52%] p-3">Datas e serviços</th>
              <th className="w-[20%] p-3 text-right">Total recebido</th>
            </tr>
          </thead>

          <tbody>
            {dados.map((item, index) => {
              const atendimentos = item.atendimentos || []

              return (
                <tr
                  key={`${item.cliente}-${index}`}
                  className="border-b border-[#eef2f7] align-top hover:bg-[#fafbfd]"
                >
                  <td className="p-3 font-medium text-black">
                    {item.cliente}
                  </td>

                  <td className="p-3">
                    <div className="space-y-2">
                      {atendimentos.length > 0 ? (
                        atendimentos.map((atendimento, i) => (
                          <p key={i} className="text-sm text-neutral-600">
                            <span className="font-medium text-black">
                              {formatarData(atendimento.data)}
                            </span>{" "}
                            -{" "}
                            {atendimento.servicos?.join(", ") || "Sem serviço informado"}
                          </p>
                        ))
                      ) : (
                        <span className="text-sm text-neutral-500">
                          Nenhum atendimento encontrado.
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-3 text-right font-medium text-emerald-600">
                    {formatCurrency(item.total_pago)}
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