// src/store/DashboardStore.tsx

"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { TransactionWithServices } from "@/types/lancamentos"

type DashboardState = {
  lancamentos: TransactionWithServices[]
  setLancamentos: (data: TransactionWithServices[]) => void
}

const DashboardContext = createContext<DashboardState | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {

  const [lancamentos, setLancamentos] = useState<TransactionWithServices[]>([])

  return (

    <DashboardContext.Provider
      value={{
        lancamentos,
        setLancamentos
      }}
    >
      {children}
    </DashboardContext.Provider>

  )

}

export function useDashboard() {

  const context = useContext(DashboardContext)

  if (!context) {
    throw new Error("useDashboard must be used inside DashboardProvider")
  }

  return context

}