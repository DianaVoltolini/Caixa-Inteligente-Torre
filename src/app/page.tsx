// src/app/page.tsx

import Link from "next/link"

import { BrandLogo } from "@/components/brand/BrandLogo"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8FBFF] px-5 py-8 text-[#07122F]">
      <section className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-xl items-center justify-center">
        <div className="w-full rounded-[32px] border border-[#DFE7F7] bg-white px-6 py-10 text-center shadow-xl shadow-blue-900/10 sm:px-10">
          <div className="flex justify-center">
            <BrandLogo variant="premium-light" width={190} height={76} priority />
          </div>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.28em] text-[#002198]">
            Torre de Controle
          </p>

          <h1 className="mt-4 text-3xl font-bold leading-tight text-[#07122F] sm:text-4xl">
            Centro operacional do Caixa Inteligente
          </h1>

          <p className="mx-auto mt-5 max-w-md text-base leading-7 text-[#475569]">
            Acompanhe clientes, assinaturas, cobranças, leads, integrações e pontos que precisam de atenção na operação.
          </p>

          <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
            {[
              "Clientes",
              "Assinaturas",
              "Cobranças",
              "Leads",
              "Integração Bling",
              "Logs operacionais",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[#DFE7F7] bg-[#F8FBFF] px-4 py-3 text-sm font-semibold text-[#07122F]"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#002198] px-7 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#00196F]"
            >
              Entrar na Torre
            </Link>

            <a
              href="https://app.meucaixainteligente.com.br"
              className="inline-flex h-12 items-center justify-center rounded-full border border-[#DFE7F7] bg-white px-7 text-sm font-semibold text-[#002198] transition hover:border-[#002198]"
            >
              Voltar para o app
            </a>
          </div>

          <p className="mx-auto mt-7 max-w-sm text-xs leading-5 text-[#64748B]">
            Acesso interno restrito a usuários autorizados.
          </p>
        </div>
      </section>
    </main>
  )
}