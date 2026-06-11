// src/components/layout/AppHeader.tsx

"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Menu } from "lucide-react"

import { useAccount } from "@/contexts/AccountContext"

type SubscriptionStatus =
  | "trial"
  | "trialing"
  | "pending"
  | "active"
  | "overdue"
  | "canceled"
  | null

function getPlanLabel(status: SubscriptionStatus) {
  if (status === "active") return "Plano Lucro Real"
  if (status === "pending") return "Pagamento em andamento"
  if (status === "overdue") return "Pagamento pendente"
  if (status === "canceled") return "Assinatura cancelada"

  return "Plano Lucro Real - Trial"
}

export function AppHeader() {
  const router = useRouter()

  const dropdownRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)

  const {
    user,
    business,
    subscription,
    loading,
  } = useAccount()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  function handleOpenSidebar() {
    window.dispatchEvent(new Event("ci:open-sidebar"))
  }

  async function handleLogout() {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    })

    if (response.ok) {
      router.replace("/login")
      router.refresh()
    }
  }

  if (loading) {
    return (
      <header className="sticky top-0 z-30 h-16 border-b border-[#dfe7f7] bg-white">
        <div className="flex h-full items-center justify-between px-4 md:px-6">
          <div className="h-10 w-48 animate-pulse rounded-2xl bg-[#eef3ff]" />

          <div className="h-10 w-32 animate-pulse rounded-2xl bg-[#eef3ff]" />
        </div>
      </header>
    )
  }

  const nomeUsuario =
    user?.user_metadata?.full_name?.trim() ||
    "Usuário"

  const inicial =
    nomeUsuario.charAt(0).toUpperCase()

  const empresa =
    business?.name?.trim() ||
    "Minha empresa"

  const plano = getPlanLabel(
    (subscription?.status as SubscriptionStatus) ?? "trial"
  )

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[#dfe7f7] bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-full items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={handleOpenSidebar}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#dfe7f7] bg-[#f8fbff] text-[#002198] shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:bg-[#eef3ff] lg:hidden"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-[#002198] md:text-[11px]">
              Caixa Inteligente
            </p>

            <h2 className="truncate text-sm font-bold text-black md:text-base">
              {empresa}
            </h2>

            <p className="hidden text-sm text-neutral-600 md:block">
              Sistema financeiro da sua empresa
            </p>
          </div>
        </div>

        <div
          ref={dropdownRef}
          className="relative flex items-center gap-3"
        >
          <div className="hidden rounded-2xl border border-[#dfe7f7] bg-[#f8fbff] px-4 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.04)] md:block">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#002198]">
              Seu plano
            </p>

            <p className="mt-1 text-sm font-semibold text-black">
              {plano}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-3 rounded-2xl border border-[#dfe7f7] bg-white px-2.5 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:bg-[#f8fbff] md:px-3"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-black">
                {nomeUsuario}
              </p>

              <p className="text-xs text-neutral-600">
                Minha conta
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef3ff] text-sm font-bold text-[#002198] ring-1 ring-[#dfe7f7]">
              {inicial}
            </div>
          </button>

          {open && (
            <div className="absolute right-0 top-14 w-64 rounded-[24px] border border-[#dfe7f7] bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
              <div className="rounded-2xl px-3 py-2 sm:hidden">
                <p className="text-sm font-semibold text-black">
                  {nomeUsuario}
                </p>

                <p className="mt-1 text-xs text-neutral-600">
                  {plano}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  router.push("/assinaturas")
                }}
                className="w-full rounded-2xl px-4 py-2 text-left text-sm font-medium text-black transition hover:bg-[#f8fbff]"
              >
                Assinaturas
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  router.push("/configuracoes")
                }}
                className="w-full rounded-2xl px-4 py-2 text-left text-sm font-medium text-black transition hover:bg-[#f8fbff]"
              >
                Configurações
              </button>

              <div className="my-2 h-px bg-[#dfe7f7]" />

              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-2xl px-4 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}