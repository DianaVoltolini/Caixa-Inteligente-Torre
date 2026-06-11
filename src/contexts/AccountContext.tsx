// src/contexts/AccountContext.tsx

"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { User } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/client"
import {
  getSubscription,
  type Subscription,
} from "@/lib/subscription/getSubscription"

type BusinessRow = {
  id: string
  name: string | null
  onboarding_completed?: boolean | null
  [key: string]: any
} | null

type AccountContextType = {
  user: User | null
  business: BusinessRow
  subscription: Subscription | null
  loading: boolean
  refreshAccount: () => Promise<void>
}

const AccountContext = createContext<AccountContextType>({
  user: null,
  business: null,
  subscription: null,
  loading: true,
  refreshAccount: async () => {},
})

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [business, setBusiness] = useState<BusinessRow>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const clearAccountState = useCallback(() => {
    setUser(null)
    setBusiness(null)
    setSubscription(null)
  }, [])

  const loadAccount = useCallback(async () => {
    try {
      setLoading(true)

      const {
        data: { user: authenticatedUser },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !authenticatedUser) {
        clearAccountState()
        return
      }

      setUser(authenticatedUser)

      const { data: businesses, error: businessError } = await supabase
        .from("ci_business")
        .select("*")
        .eq("owner_user_id", authenticatedUser.id)
        .order("created_at", { ascending: false })
        .limit(1)

      if (businessError) {
        console.error("Erro ao buscar empresa no AccountContext:", businessError)
        clearAccountState()
        return
      }

      const businessData = (businesses?.[0] as BusinessRow) ?? null
      setBusiness(businessData)

      if (!businessData?.id) {
        setSubscription(null)
        return
      }

      const subscriptionData = await getSubscription(businessData.id)
      setSubscription(subscriptionData)
    } catch (error) {
      console.error("Erro geral no AccountContext:", error)
      clearAccountState()
    } finally {
      setLoading(false)
    }
  }, [supabase, clearAccountState])

  const refreshAccount = useCallback(async () => {
    await loadAccount()
  }, [loadAccount])

  useEffect(() => {
    void loadAccount()

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadAccount()
    })

    return () => {
      authSubscription.unsubscribe()
    }
  }, [loadAccount, supabase])

  const value = useMemo(
    () => ({
      user,
      business,
      subscription,
      loading,
      refreshAccount,
    }),
    [user, business, subscription, loading, refreshAccount],
  )

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  )
}

export function useAccount() {
  return useContext(AccountContext)
}