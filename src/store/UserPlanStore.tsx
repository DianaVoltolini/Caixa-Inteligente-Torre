// src/store/UserPlanStore.tsx

"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

type PlanType = "free" | "premium"

type ContextType = {
  plan: PlanType | null
  loading: boolean
}

const UserPlanContext = createContext<ContextType>({
  plan: null,
  loading: true
})

export function UserPlanProvider({ children }: { children: ReactNode }) {

  const supabase = createClient()

  const [plan, setPlan] = useState<PlanType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    async function loadPlan() {

      try {

        const {
          data: { user }
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        const { data: profile } = await supabase
          .from("ci_profiles")
          .select("plan")
          .eq("id", user.id)
          .single()

        if (profile?.plan) {
          setPlan(profile.plan)
        }

      } catch (error) {

        console.error("Erro ao carregar plano:", error)

      } finally {

        setLoading(false)

      }

    }

    loadPlan()

  }, [])

  return (

    <UserPlanContext.Provider
      value={{
        plan,
        loading
      }}
    >
      {children}
    </UserPlanContext.Provider>

  )

}

export function useUserPlan() {
  return useContext(UserPlanContext)
}