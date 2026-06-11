// src/components/selectors/SelectCategoria.tsx

"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useBusiness } from "@/contexts/BusinessContext"

const supabase = createClient()

interface Categoria {
  id: string
  name: string
}

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function SelectCategoria({
  value,
  onChange
}: Props) {

  const { businessId } = useBusiness()

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)

  async function carregarCategorias() {

    if (!businessId) return

    setLoading(true)

    const { data, error } = await supabase
      .from("ci_categories")
      .select("id, name")
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .order("name")

    if (error) {

      console.error(
        "Erro ao carregar categorias:",
        error
      )

      setLoading(false)
      return

    }

    setCategorias(data || [])
    setLoading(false)

  }

  useEffect(() => {
    carregarCategorias()
  }, [businessId])

  if (loading) {

    return (
      <div className="text-sm text-slate-400">
        Carregando categorias...
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
        Selecionar categoria
      </option>

      {categorias.length === 0 && (

        <option disabled>
          Nenhuma categoria cadastrada
        </option>

      )}

      {categorias.map((categoria) => (

        <option
          key={categoria.id}
          value={categoria.id}
        >
          {categoria.name}
        </option>

      ))}

    </select>

  )

}