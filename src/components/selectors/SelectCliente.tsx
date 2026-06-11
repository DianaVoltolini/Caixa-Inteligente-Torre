// src/components/selectors/SelectCliente.tsx

"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useBusiness } from "@/contexts/BusinessContext"

const supabase = createClient()

interface Cliente {
  id: string
  name: string
}

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function SelectCliente({
  value,
  onChange
}: Props) {

  const { businessId } = useBusiness()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  async function carregarClientes() {

    if (!businessId) return

    setLoading(true)

    const { data, error } = await supabase
      .from("ci_contacts")
      .select("id, name")
      .eq("business_id", businessId)
      .eq("type", "client")
      .is("deleted_at", null)
      .order("name")

    if (error) {

      console.error(
        "Erro ao carregar clientes:",
        error
      )

      setLoading(false)
      return

    }

    setClientes(data || [])
    setLoading(false)

  }

  useEffect(() => {
    carregarClientes()
  }, [businessId])

  if (loading) {

    return (
      <div className="text-sm text-slate-400">
        Carregando clientes...
      </div>
    )

  }

  return (

    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="
        w-full
        border
        border-slate-200
        rounded-xl
        px-3
        py-2
        text-sm
      "
    >

      <option value="">
        Selecionar cliente
      </option>

      {clientes.length === 0 && (

        <option disabled>
          Nenhum cliente cadastrado
        </option>

      )}

      {clientes.map((cliente) => (

        <option
          key={cliente.id}
          value={cliente.id}
        >
          {cliente.name}
        </option>

      ))}

    </select>

  )

}