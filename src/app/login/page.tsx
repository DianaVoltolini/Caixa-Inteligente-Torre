// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\login\page.tsx

"use client"

import { FormEvent, useState } from "react"

export default function TorreControleLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/master/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || payload?.authorized !== true) {
        setError(
          payload?.error ||
            "Este login não possui acesso autorizado à Torre de Controle.",
        )
        return
      }

      window.location.href = "/painel"
    } catch {
      setError("Não foi possível acessar a Torre agora.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fbff] px-4">
      <div className="w-full max-w-md rounded-[28px] border border-[#dfe7f7] bg-white p-8 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
          Torre de Controle
        </p>

        <h1 className="mt-3 text-3xl font-bold text-black">
          Acesso interno
        </h1>

        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Entre com uma conta autorizada para acompanhar clientes, cobranças e
          operação do Caixa Inteligente.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-black">E-mail</label>

            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              className="h-12 w-full rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm text-black outline-none transition placeholder:text-neutral-400 focus:border-[#002198] focus:ring-4 focus:ring-[#002198]/10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-black">Senha</label>

            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              className="h-12 w-full rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm text-black outline-none transition placeholder:text-neutral-400 focus:border-[#002198] focus:ring-4 focus:ring-[#002198]/10"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-medium text-rose-700">{error}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-2xl bg-[#002198] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(0,33,152,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(0,33,152,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Validando acesso..." : "Entrar na Torre"}
          </button>
        </form>
      </div>
    </main>
  )
}