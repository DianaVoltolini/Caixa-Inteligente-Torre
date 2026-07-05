// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\(master)\integracoes\bling\page.tsx

"use client"

import { useEffect, useMemo, useState } from "react"

import PageContainer from "@/components/layout/PageContainer"
import PageHeader from "@/components/layout/PageHeader"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

type BlingStatusResponse = {
  success: boolean
  connected: boolean
  status: "active" | "inactive" | "error" | string
  expiresAt: string | null
  error?: string
}

type BlingPingResponse = {
  success?: boolean
  ok?: boolean
  connected?: boolean
  message?: string
  error?: string
}

function formatDateTime(value: string | null) {
  if (!value) return "Não informado"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Não informado"
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getTokenAlert(expiresAt: string | null) {
  if (!expiresAt) {
    return {
      tone: "warning",
      message: "Token sem data de expiração informada. Recomendado reconectar.",
    }
  }

  const expiration = new Date(expiresAt)

  if (Number.isNaN(expiration.getTime())) {
    return {
      tone: "warning",
      message: "Data de expiração inválida. Recomendado reconectar.",
    }
  }

  const diffInHours = Math.ceil(
    (expiration.getTime() - Date.now()) / (1000 * 60 * 60),
  )

  if (diffInHours <= 0) {
    return {
      tone: "danger",
      message: "Token expirado. Reconecte o Bling antes de gerar novas cobranças.",
    }
  }

  if (diffInHours <= 24) {
    return {
      tone: "warning",
      message: "Token expira em menos de 24 horas. Recomendado reconectar.",
    }
  }

  return {
    tone: "success",
    message: "Conexão operacional para geração de cobranças.",
  }
}

export default function BlingIntegracaoPage() {
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [testing, setTesting] = useState(false)
  const [statusData, setStatusData] = useState<BlingStatusResponse | null>(null)
  const [pageMessage, setPageMessage] = useState<string | null>(null)

  async function loadStatus() {
    try {
      setLoading(true)
      setPageMessage(null)

      const response = await fetch("/api/bling/status", {
        method: "GET",
        cache: "no-store",
      })

      const data = (await response.json()) as BlingStatusResponse

      if (!response.ok || !data.success) {
        setStatusData({
          success: false,
          connected: false,
          status: "inactive",
          expiresAt: null,
          error: data.error || "Não foi possível consultar a integração.",
        })

        return
      }

      setStatusData(data)
    } catch (error) {
      setStatusData({
        success: false,
        connected: false,
        status: "inactive",
        expiresAt: null,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao consultar integração do Bling.",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStatus()
  }, [])

  const isConnected = Boolean(
    statusData?.connected && statusData?.status === "active",
  )

  const statusLabel = useMemo(() => {
    if (!statusData) return "Carregando"
    if (isConnected) return "Conectado"

    return "Não conectado"
  }, [isConnected, statusData])

  const tokenAlert = useMemo(() => {
    if (!isConnected) {
      return {
        tone: "danger",
        message:
          "Bling não conectado. As cobranças podem falhar até a reconexão.",
      }
    }

    return getTokenAlert(statusData?.expiresAt ?? null)
  }, [isConnected, statusData?.expiresAt])

  const statusToneClass = isConnected
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-rose-200 bg-rose-50 text-rose-700"

  const alertToneClass =
    tokenAlert.tone === "danger"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : tokenAlert.tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-emerald-200 bg-emerald-50 text-emerald-800"

  function handleConnect() {
    try {
      setConnecting(true)
      window.location.href = "/api/bling/connect"
    } catch {
      setConnecting(false)
      setPageMessage("Não foi possível iniciar a conexão com o Bling.")
    }
  }

  async function handleTestConnection() {
    try {
      setTesting(true)
      setPageMessage(null)

      const response = await fetch("/api/bling/ping", {
        method: "GET",
        cache: "no-store",
      })

      const payload = (await response.json()) as BlingPingResponse

      if (!response.ok || payload.success === false || payload.ok === false) {
        throw new Error(
          payload.error ||
            payload.message ||
            "Não foi possível validar a conexão com o Bling.",
        )
      }

      setPageMessage("Teste concluído: conexão com o Bling respondeu com sucesso.")

      await loadStatus()
    } catch (error) {
      setPageMessage(
        error instanceof Error
          ? error.message
          : "Erro ao testar conexão com o Bling.",
      )
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <PageHeader
          eyebrow="Integrações"
          title="Integração Bling"
          subtitle="Verificando conexão..."
        />

        <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
          <p className="text-sm text-neutral-600">
            Carregando status da integração.
          </p>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Integrações"
          title="Integração Bling"
          subtitle="Controle interno da conexão usada para gerar cobranças reais no Bling."
        />

        {pageMessage ? (
          <Card className="rounded-[24px] border border-[#dfe7f7] bg-white p-4 shadow-none">
            <p className="text-sm font-semibold text-[#002198]">
              {pageMessage}
            </p>
          </Card>
        ) : null}

        {statusData?.error && !isConnected ? (
          <Card className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 shadow-none">
            <p className="text-sm font-semibold text-rose-700">
              {statusData.error}
            </p>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
              Status da integração
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className={`rounded-[24px] border p-5 ${statusToneClass}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                  Status
                </p>

                <p className="mt-2 text-2xl font-bold">{statusLabel}</p>
              </div>

              <div className="rounded-[24px] border border-[#dfe7f7] bg-[#f8fbff] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#002198]">
                  Expira em
                </p>

                <p className="mt-2 text-base font-bold text-black">
                  {formatDateTime(statusData?.expiresAt ?? null)}
                </p>
              </div>

              <div className="rounded-[24px] border border-[#dfe7f7] bg-[#f8fbff] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#002198]">
                  Uso
                </p>

                <p className="mt-2 text-base font-bold text-black">
                  Cobranças
                </p>
              </div>
            </div>

            <div className={`mt-5 rounded-[24px] border p-4 ${alertToneClass}`}>
              <p className="text-sm font-semibold">{tokenAlert.message}</p>
            </div>
          </Card>

          <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
              Ações
            </p>

            <h2 className="mt-3 text-2xl font-bold text-black">
              Manter conexão ativa
            </h2>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Use esta tela apenas para testar ou renovar a autorização do
              Bling.
            </p>

            <div className="mt-6 space-y-3">
              <Button
                type="button"
                variant="primary"
                fullWidth
                onClick={handleConnect}
                loading={connecting}
                className="py-3.5"
              >
                {isConnected ? "Reconectar com Bling" : "Conectar com Bling"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => void handleTestConnection()}
                loading={testing}
                className="py-3.5"
              >
                Testar conexão
              </Button>

              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => void loadStatus()}
                className="py-3.5"
              >
                Atualizar status
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}