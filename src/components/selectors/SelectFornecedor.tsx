// src/components/selectors/SelectFornecedor.tsx

"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useBusiness } from "@/contexts/BusinessContext"

const supabase = createClient()

interface Fornecedor {
  id: string
  name: string
}

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function SelectFornecedor({
  value,
  onChange
}: Props) {

  const { businessId } = useBusiness()

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)

  async function carregarFornecedores() {

    if (!businessId) return

    setLoading(true)

    const { data, error } = await supabase
      .from("ci_contacts")
      .select("id, name")
      .eq("business_id", businessId)
      .eq("type", "supplier")
      .is("deleted_at", null)
      .order("name")

    if (error) {

      console.error(
        "Erro ao carregar fornecedores:",
        error
      )

      setLoading(false)
      return

    }

    setFornecedores(data || [])
    setLoading(false)

  }

  useEffect(() => {
    carregarFornecedores()
  }, [businessId])

  if (loading) {

    return (
      <div className="text-sm text-slate-400">
        Carregando fornecedores...
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
        Selecionar fornecedor
      </option>

      {fornecedores.length === 0 && (

        <option disabled>
          Nenhum fornecedor cadastrado
        </option>

      )}

      {fornecedores.map((fornecedor) => (

        <option
          key={fornecedor.id}
          value={fornecedor.id}
        >
          {fornecedor.name}
        </option>

      ))}

    </select>

  )

}