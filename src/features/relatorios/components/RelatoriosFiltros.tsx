// src/features/relatorios/components/RelatoriosFiltros.tsx

"use client"

import { useState } from "react"

type Props = {
  tipoRelatorio: string
  onGerar: (filtros: any) => void
}

export default function RelatoriosFiltros({ tipoRelatorio, onGerar }: Props) {
  const [dataInicial, setDataInicial] = useState("")
  const [dataFinal, setDataFinal] = useState("")
  const [tipo, setTipo] = useState("todos")
  const [contactId, setContactId] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [supplierId, setSupplierId] = useState("")

  function gerar() {
    onGerar({
      dataInicial,
      dataFinal,
      tipo,
      contactId,
      serviceId,
      supplierId
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <div>
          <label className="text-sm text-gray-600">Data inicial</label>
          <input
            type="date"
            className="w-full border rounded-lg px-3 py-2"
            value={dataInicial}
            onChange={(e) => setDataInicial(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Data final</label>
          <input
            type="date"
            className="w-full border rounded-lg px-3 py-2"
            value={dataFinal}
            onChange={(e) => setDataFinal(e.target.value)}
          />
        </div>

        {tipoRelatorio === "financeiro" && (
          <div>
            <label className="text-sm text-gray-600">Tipo</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="todos">Receitas e Despesas</option>
              <option value="receita">Somente Receitas</option>
              <option value="despesa">Somente Despesas</option>
            </select>
          </div>
        )}

        {tipoRelatorio === "clientes" && (
          <div>
            <label className="text-sm text-gray-600">Cliente</label>
            <input
              type="text"
              placeholder="Filtrar cliente"
              className="w-full border rounded-lg px-3 py-2"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
            />
          </div>
        )}

        {tipoRelatorio === "servicos" && (
          <div>
            <label className="text-sm text-gray-600">Serviço</label>
            <input
              type="text"
              placeholder="Filtrar serviço"
              className="w-full border rounded-lg px-3 py-2"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            />
          </div>
        )}

        {tipoRelatorio === "fornecedores" && (
          <div>
            <label className="text-sm text-gray-600">Fornecedor</label>
            <input
              type="text"
              placeholder="Filtrar fornecedor"
              className="w-full border rounded-lg px-3 py-2"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            />
          </div>
        )}

      </div>

      <div>
        <button
          onClick={gerar}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Gerar relatório
        </button>
      </div>

    </div>
  )
}
