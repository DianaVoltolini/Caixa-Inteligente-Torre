// src/components/layout/Sidebar.tsx

"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import {
  LayoutDashboard,
  Wallet,
  Folder,
  BarChart3,
  TrendingUp,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import type { LucideIcon } from "lucide-react"

import { createClient } from "@/lib/supabase/client"

const SIDEBAR_WIDTH_EXPANDED = 256
const SIDEBAR_WIDTH_COLLAPSED = 80

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const saved = window.localStorage.getItem("ci:sidebar-collapsed")

    if (saved === "true") {
      setCollapsed(true)
    }

    const initialWidth =
      saved === "true"
        ? `${SIDEBAR_WIDTH_COLLAPSED}px`
        : `${SIDEBAR_WIDTH_EXPANDED}px`

    document.documentElement.style.setProperty("--ci-sidebar-width", initialWidth)
  }, [])

  useEffect(() => {
    function handleOpenSidebar() {
      setMobileOpen(true)
    }

    window.addEventListener("ci:open-sidebar", handleOpenSidebar)

    return () => {
      window.removeEventListener("ci:open-sidebar", handleOpenSidebar)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem("ci:sidebar-collapsed", String(collapsed))

    const width = collapsed
      ? `${SIDEBAR_WIDTH_COLLAPSED}px`
      : `${SIDEBAR_WIDTH_EXPANDED}px`

    document.documentElement.style.setProperty("--ci-sidebar-width", width)
  }, [collapsed])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
      return
    }

    document.body.style.overflow = ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      router.replace("/login")
      router.refresh()
    } catch (error) {
      console.error("Erro ao sair da conta:", error)
      router.replace("/login")
      router.refresh()
    }
  }

  function navItem(href: string, label: string, Icon: LucideIcon) {
    const active = pathname.startsWith(href)
    const isCollapsedDesktop = collapsed && !mobileOpen

    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        title={isCollapsedDesktop ? label : undefined}
        className={[
          "relative flex items-center rounded-2xl text-sm font-semibold transition",
          isCollapsedDesktop ? "justify-center px-3 py-3" : "gap-3 px-4 py-3",
          active
            ? "border border-[#cfd8ff] bg-[#eef3ff] text-[#002198] shadow-[0_8px_24px_rgba(0,33,152,0.08)]"
            : "border border-transparent text-neutral-700 hover:border-[#dfe7f7] hover:bg-[#f8fbff] hover:text-black",
        ].join(" ")}
      >
        {active && !isCollapsedDesktop && (
          <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-md bg-[#002198]" />
        )}

        <Icon size={18} className="shrink-0" />

        {!isCollapsedDesktop && <span>{label}</span>}
      </Link>
    )
  }

  const isCollapsedDesktop = collapsed && !mobileOpen

  return (
    <>
      <div
        aria-hidden={!mobileOpen}
        onClick={() => setMobileOpen(false)}
        className={[
          "fixed inset-0 z-40 bg-black/45 backdrop-blur-[3px] transition-opacity duration-300 lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <aside
        className={[
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-[#dfe7f7] bg-white transition-transform duration-300 ease-out",
          "w-[280px] max-w-[85vw] shadow-[18px_0_45px_rgba(15,23,42,0.06)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "lg:w-20" : "lg:w-64",
          "lg:translate-x-0",
        ].join(" ")}
      >
        <div
          className={[
            "border-b border-[#e8eefc] bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_55%,#eef3ff_100%)]",
            isCollapsedDesktop ? "px-3 py-6" : "px-4 py-5",
          ].join(" ")}
        >
          {isCollapsedDesktop ? (
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white text-[#002198] shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:bg-[#f8fbff] lg:flex"
                aria-label="Expandir menu"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                  Caixa Inteligente
                </p>

                <h1 className="mt-2 text-lg font-bold text-black">
                  Sistema financeiro
                </h1>

                <p className="mt-1 text-xs leading-5 text-neutral-600">
                  Clareza para usar no dia a dia
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#dfe7f7] bg-white text-[#002198] transition hover:bg-[#f8fbff] lg:hidden"
                  aria-label="Fechar menu"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  className="hidden h-8 w-8 items-center justify-center rounded-xl border border-[#dfe7f7] bg-white text-[#002198] transition hover:bg-[#f8fbff] lg:flex"
                  aria-label="Recolher menu"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          className={`flex-1 space-y-2 overflow-y-auto ${
            isCollapsedDesktop ? "p-2" : "p-4"
          }`}
        >
          {navItem("/dashboard", "Dashboard", LayoutDashboard)}
          {navItem("/cadastros", "Cadastros", Folder)}
          {navItem("/lancamentos", "Lançamentos", Wallet)}
          {navItem("/relatorios", "Relatórios", BarChart3)}
          {navItem("/analytics", "Análises", TrendingUp)}

          <div className="mt-4 border-t border-[#e8eefc] pt-4">
            {navItem("/assinaturas", "Assinaturas", CreditCard)}
            {navItem("/configuracoes", "Configurações", Settings)}
          </div>
        </div>

        <div className={`${isCollapsedDesktop ? "p-2" : "p-4"} border-t border-[#e8eefc]`}>
          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsedDesktop ? "Sair" : undefined}
            className={[
              "flex w-full items-center rounded-2xl border border-rose-200 bg-rose-50 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100",
              isCollapsedDesktop ? "justify-center px-2" : "gap-2 px-4",
            ].join(" ")}
          >
            <LogOut size={16} className="shrink-0" />
            {!isCollapsedDesktop && "Sair"}
          </button>
        </div>
      </aside>
    </>
  )
}