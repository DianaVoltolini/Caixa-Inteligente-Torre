// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\components\layout\MasterSidebar.tsx

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Link2,
  ScrollText,
  ShieldCheck,
  Users,
} from "lucide-react"

const items = [
  {
    label: "Visão geral",
    href: "/painel",
    icon: LayoutDashboard,
  },
  {
    label: "Cobranças",
    href: "/cobrancas",
    icon: CreditCard,
  },
  {
    label: "Assinaturas",
    href: "/assinaturas",
    icon: FileText,
  },
  {
    label: "Central de clientes",
    href: "/clientes",
    icon: ShieldCheck,
  },
  {
    label: "Leads",
    href: "/leads",
    icon: Users,
  },
  {
    label: "Consulta CNPJ",
    href: "/consulta-cnpj",
    icon: Building2,
  },
  {
    label: "Integração Bling",
    href: "/integracoes/bling",
    icon: Link2,
  },
  {
    label: "Logs",
    href: "/logs",
    icon: ScrollText,
  },
]

function isActivePath(pathname: string, href: string) {
  if (href === "/painel") {
    return pathname === "/" || pathname === "/painel"
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function MasterSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-[280px] shrink-0 border-r border-[#dfe7f7] bg-white xl:block">
      <div className="sticky top-0 flex min-h-screen flex-col">
        <div className="border-b border-[#e8eefc] px-6 py-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
            Área master
          </p>

          <h2 className="mt-2 text-xl font-bold text-black">
            Torre de Controle
          </h2>

          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Operação interna do SaaS, acompanhamento de clientes, assinaturas,
            cobranças e integrações.
          </p>
        </div>

        <nav className="flex-1 px-4 py-5">
          <div className="space-y-2">
            {items.map((item) => {
              const Icon = item.icon
              const active = isActivePath(pathname, item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "border border-[#cfd8ff] bg-[#eef3ff] text-[#002198]"
                      : "border border-transparent text-neutral-700 hover:bg-[#f8fbff]",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </aside>
  )
}
