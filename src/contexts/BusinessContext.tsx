// src/contexts/BusinessContext.tsx

"use client"

import { createContext, useContext, useMemo } from "react"
import { useAccount } from "@/contexts/AccountContext"

type BusinessContextType = {
  businessId: string | null
  businessName: string | null
  onboardingCompleted: boolean
  loading: boolean
  refresh: () => Promise<void>
}

const BusinessContext = createContext<BusinessContextType>({
  businessId: null,
  businessName: null,
  onboardingCompleted: false,
  loading: true,
  refresh: async () => {},
})

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { business, loading, refreshAccount } = useAccount()

  const value = useMemo<BusinessContextType>(() => {
    const resolvedBusinessId =
      typeof business?.id === "string" && business.id.trim()
        ? business.id
        : null

    const resolvedBusinessName =
      typeof business?.name === "string" && business.name.trim()
        ? business.name
        : null

    return {
      businessId: resolvedBusinessId,
      businessName: resolvedBusinessName,
      onboardingCompleted: Boolean(business?.onboarding_completed),
      loading,
      refresh: refreshAccount,
    }
  }, [business, loading, refreshAccount])

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  return useContext(BusinessContext)
}