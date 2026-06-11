// src/features/configuracoes/components/DeleteAccountModal.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button, Card, Input } from "@/components/ui"
import { createClient } from "@/lib/supabase/client"

interface Props {
  open: boolean
  onClose: () => void
}

export default function DeleteAccountModal({ open, onClose }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [confirmText, setConfirmText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const isValid = confirmText === "EXCLUIR"

  async function handleDelete() {
    if (!isValid) return

    try {
      setLoading(true)
      setError(null)

      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const rawText = await res.text()

      let data: any = null

      try {
        data = rawText ? JSON.parse(rawText) : null
      } catch {
        data = null
      }

      if (!res.ok) {
        throw new Error(
          data?.error ||
            rawText ||
            "Erro ao excluir conta.",
        )
      }

      await supabase.auth.signOut()

      router.replace("/signup")
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "Falha ao excluir conta.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[3px]">
      <div className="flex min-h-dvh items-center justify-center p-4">
        <Card className="w-full max-w-md overflow-hidden p-0">
          <div className="border-b border-rose-200 bg-[linear-gradient(135deg,#fff5f5_0%,#ffffff_55%,#fff1f1_100%)] px-6 py-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-600">
              Área sensível
            </p>

            <h2 className="mt-2 text-xl font-bold text-rose-700">
              Excluir sua conta
            </h2>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Essa ação é permanente e não pode ser desfeita.
            </p>
          </div>

          <div className="space-y-5 px-6 py-6">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-medium text-rose-800">
                Ao excluir sua conta:
              </p>

              <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-rose-700">
                <li>Todos os dados serão apagados</li>
                <li>Seu histórico será perdido</li>
                <li>Não existe recuperação</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-black">
                Digite <strong>EXCLUIR</strong> para confirmar
              </p>

              <Input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Digite EXCLUIR"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={!isValid || loading}
              >
                {loading ? "Excluindo..." : "Excluir conta"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}