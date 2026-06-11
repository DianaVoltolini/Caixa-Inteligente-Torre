// src/features/lancamentos/components/ServicoSelect.tsx

"use client"

import { ChangeEvent } from "react"

type ServiceOption = {
  id: string
  name: string
  price: number
}

interface Props {
  services: ServiceOption[]
  onSelect: (service: ServiceOption) => void
}

export function ServicoSelect({
  services,
  onSelect,
}: Props) {
  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const serviceId = e.target.value

    if (!serviceId) return

    const service = services.find((s) => s.id === serviceId)

    if (service) {
      onSelect(service)
    }

    e.target.value = ""
  }

  return (
    <select
      onChange={handleChange}
      className="w-full rounded-2xl border border-[#d9d9d9] bg-white px-3 py-2.5 text-sm text-black focus:border-[#bfd0fb] focus:outline-none focus:ring-0"
      defaultValue=""
    >
      <option value="">Selecionar serviço</option>

      {services.map((service) => (
        <option
          key={service.id}
          value={service.id}
        >
          {service.name}
        </option>
      ))}
    </select>
  )
}