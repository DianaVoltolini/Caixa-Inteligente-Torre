// src/features/torre-controle/components/LeadsFilters.tsx

"use client"

import { Input } from "@/components/ui"

type Props = {
  search: string
  status: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
}

export default function LeadsFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="space-y-2">
        <label className="text-sm font-medium text-black">
          Buscar lead
        </label>
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Busque por nome, email ou WhatsApp"
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-black">
          Filtrar por status
        </label>

        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-11 w-full rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm text-black outline-none transition focus:border-[#002198] focus:ring-2 focus:ring-[#002198]/10"
        >
          <option value="todos">Todos</option>
          <option value="novo">Novo</option>
          <option value="contatado">Contatado</option>
          <option value="no_grupo">No grupo</option>
          <option value="engajado">Engajado</option>
          <option value="nao_respondeu">Não respondeu</option>
        </select>
      </div>
    </div>
  )
}