// app/(master)/layout.tsx

import { MasterSidebar } from "@/components/layout/MasterSidebar"
import { requireMasterUser } from "@/lib/auth/require-master"

export default async function MasterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const masterUser = await requireMasterUser()

  return (
    <div className="min-h-screen bg-[#f8fbff]">
      <div className="flex min-h-screen">
        <MasterSidebar />

        <div className="min-w-0 flex-1">
          <header className="border-b border-[#dfe7f7] bg-white">
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-4 sm:px-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                  Operação interna
                </p>

                <h1 className="mt-1 text-lg font-semibold text-black">
                  Torre de Controle
                </h1>
              </div>

              <div className="text-right">
                <p className="text-xs text-neutral-500">Logada como</p>

                <p className="text-sm font-medium text-black">
                  {masterUser.nome || masterUser.email}
                </p>
              </div>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  )
}