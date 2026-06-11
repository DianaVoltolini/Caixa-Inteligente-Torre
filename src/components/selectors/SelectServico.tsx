// src/components/selectors/SelectServico.tsx

"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useBusiness } from "@/contexts/BusinessContext"

const supabase = createClient()

interface Servico {
  id: string
  name: string
  price: number
}

interface Props {
  onSelect: (servico: Servico) => void
}

export default function SelectServico({ onSelect }: Props) {
  const { businessId } = useBusiness()

  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)

  async function carregarServicos() {
    if (!businessId) {
      setServicos([])
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from("ci_services")
      .select("id, name, price")
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .order("name")

    if (error) {
      console.error("Erro ao carregar serviços:", error)
      setLoading(false)
      return
    }

    setServicos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    void carregarServicos()
  }, [businessId])

  if (loading) {
    return (
      <div className="text-sm text-slate-400">
        Carregando serviços...
      </div>
    )
  }

  return (
    <select
      onChange={(e) => {
        const servico = servicos.find((s) => s.id === e.target.value)

        if (servico) {
          onSelect(servico)
        }
      }}
      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
    >
      <option value="">Selecionar serviço</option>

      {servicos.length === 0 && (
        <option disabled>Nenhum serviço cadastrado</option>
      )}

      {servicos.map((servico) => (
        <option key={servico.id} value={servico.id}>
          {servico.name}
        </option>
      ))}
    </select>
  )
}