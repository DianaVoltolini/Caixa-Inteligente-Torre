// src/features/torre-controle/hooks/useLeadsList.ts

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  getLeadsList,
  updateLeadStatus,
  type LeadRow,
  type LeadStatus,
} from "@/features/torre-controle/services/leads.service"

type UseLeadsListResult = {
  leads: LeadRow[]
  filteredCount: number
  totalCount: number
  loading: boolean
  error: string | null
  search: string
  status: string
  savingLeadId: string | null
  setSearch: (value: string) => void
  setStatus: (value: string) => void
  reload: () => Promise<void>
  updateStatus: (
    leadId: string,
    status: LeadStatus
  ) => Promise<{ success: boolean; error?: string }>
  summary: {
    novos: number
    contatados: number
    noGrupo: number
    engajados: number
  }
}

export function useLeadsList(): UseLeadsListResult {
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("todos")
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await getLeadsList({
        search,
        status,
      })

      setLeads(data)
    } catch (loadError: any) {
      console.error(loadError)
      setError(
        loadError?.message || "Não consegui carregar a lista de leads agora."
      )
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    void load()
  }, [load])

  const updateStatus = useCallback(
    async (leadId: string, newStatus: LeadStatus) => {
      try {
        setSavingLeadId(leadId)
        setError(null)

        await updateLeadStatus(leadId, newStatus)

        setLeads((currentLeads) =>
          currentLeads.map((lead) =>
            lead.id === leadId ? { ...lead, status: newStatus } : lead
          )
        )

        return { success: true }
      } catch (updateError: any) {
        console.error(updateError)

        return {
          success: false,
          error:
            updateError?.message ||
            "Não consegui atualizar o status do lead agora.",
        }
      } finally {
        setSavingLeadId(null)
      }
    },
    []
  )

  const summary = useMemo(() => {
    return {
      novos: leads.filter((lead) => lead.status === "novo").length,
      contatados: leads.filter((lead) => lead.status === "contatado").length,
      noGrupo: leads.filter((lead) => lead.status === "no_grupo").length,
      engajados: leads.filter((lead) => lead.status === "engajado").length,
    }
  }, [leads])

  return {
    leads,
    filteredCount: leads.length,
    totalCount: leads.length,
    loading,
    error,
    search,
    status,
    savingLeadId,
    setSearch,
    setStatus,
    reload: load,
    updateStatus,
    summary,
  }
}