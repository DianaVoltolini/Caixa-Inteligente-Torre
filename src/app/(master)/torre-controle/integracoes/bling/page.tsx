// src/app/(private)/configuracoes/integracoes/bling/page.tsx

"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

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

function formatDateTime(value: string | null) {
  if (!value) return "Não informado"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Não informado"
  }

  return date.toLocaleString("pt-BR")
}

export default function BlingIntegracaoPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
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

  const statusLabel = useMemo(() => {
    if (!statusData) return "Carregando"

    if (statusData.connected && statusData.status === "active") {
      return "Conectado"
    }

    return "Não conectado"
  }, [statusData])

  const statusToneClass = useMemo(() => {
    if (!statusData) {
      return "border-[#dfe7f7] bg-[#f8fbff] text-[#002198]"
    }

    if (statusData.connected && statusData.status === "active") {
      return "border-emerald-200 bg-emerald-50 text-emerald-800"
    }

    return "border-amber-200 bg-amber-50 text-amber-900"
  }, [statusData])

  function handleConnect() {
    try {
      setConnecting(true)
      window.location.href = "/api/bling/connect"
    } catch {
      setConnecting(false)
      setPageMessage("Não foi possível iniciar a conexão com o Bling.")
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <PageHeader
          eyebrow="Configurações > Integrações"
          title="Integração com Bling"
          subtitle="Estou verificando o status da sua conexão para preparar o próximo passo."
        />

        <Card className="p-8 text-center">
          <p className="text-sm text-neutral-600">
            Carregando status da integração...
          </p>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-4">
        <PageHeader
          eyebrow="Configurações > Integrações"
          title="Conecte o Bling para liberar cobranças reais"
          subtitle="Sem essa conexão, o sistema consegue preparar a cobrança localmente, mas não consegue criar a cobrança real no Bling."
        />

        <Card
          variant="soft"
          className="bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_55%,#eef3ff_100%)] p-5"
        >
          <p className="text-sm font-semibold text-[#002198]">
            Essa integração é central para o fluxo financeiro do SaaS.
          </p>

          <p className="mt-2 text-sm leading-6 text-neutral-600">
            O Bling é usado para criar cobranças reais, manter a operação conectada e evitar que o cliente fique travado por falhas externas.
          </p>
        </Card>

        {pageMessage && (
          <Card className="border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-medium text-rose-700">
              {pageMessage}
            </p>
          </Card>
        )}

        {statusData?.error && !statusData.connected && (
          <Card className="border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">
              {statusData.error}
            </p>
          </Card>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-[#dfe7f7] bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_55%,#eef3ff_100%)] p-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
              Status da integração
            </p>

            <h2 className="mt-3 text-3xl font-semibold text-black">
              {statusLabel}
            </h2>

            <p className="mt-3 text-sm leading-7 text-neutral-600">
              {statusData?.connected
                ? "Sua integração central com o Bling está ativa. Isso permite criar cobranças reais e seguir com o fluxo de assinatura sem travas."
                : "Sua integração central com o Bling ainda não está ativa. Enquanto isso não for concluído, as cobranças não conseguem ser criadas de verdade no Bling."}
            </p>
          </div>

          <div className="space-y-5 p-7">
            <div className={`rounded-[24px] border p-5 text-sm ${statusToneClass}`}>
              <p className="font-semibold">
                {statusData?.connected
                  ? "Integração pronta para uso"
                  : "Integração pendente"}
              </p>

              <p className="mt-2 leading-6">
                {statusData?.connected
                  ? "Agora o sistema já pode autenticar, criar contatos e gerar cobranças reais no Bling."
                  : "Conecte o Bling agora para liberar a geração de cobranças reais e concluir o fluxo de assinatura sem bloqueios."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-[#dfe7f7] bg-[#f8fbff] p-5">
                <p className="text-xs text-neutral-600">Situação</p>

                <p className="mt-1 text-base font-semibold text-black">
                  {statusLabel}
                </p>
              </div>

              <div className="rounded-[24px] border border-[#dfe7f7] bg-[#f8fbff] p-5">
                <p className="text-xs text-neutral-600">Expiração do token</p>

                <p className="mt-1 text-base font-semibold text-black">
                  {formatDateTime(statusData?.expiresAt ?? null)}
                </p>
              </div>
            </div>

            <Card variant="soft" className="p-5">
              <p className="text-sm font-semibold text-[#002198]">
                Por que isso importa
              </p>

              <p className="mt-2 text-sm leading-7 text-neutral-700">
                A cobrança da assinatura depende dessa conexão para nascer corretamente no Bling. Quando a integração está ativa, o Caixa Inteligente consegue seguir o fluxo financeiro com mais segurança.
              </p>
            </Card>
          </div>
        </Card>

        <Card className="p-7">
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                Próximo passo
              </p>

              <h2 className="mt-3 text-3xl font-semibold text-black">
                {statusData?.connected
                  ? "Revisar ou reconectar"
                  : "Conectar com Bling"}
              </h2>

              <p className="mt-3 text-sm leading-7 text-neutral-600">
                {statusData?.connected
                  ? "Se quiser renovar a autorização ou garantir que a conexão continua saudável, você pode reconectar a integração."
                  : "Clique abaixo para iniciar a autorização OAuth do Bling e salvar a integração central que o sistema precisa para gerar cobranças reais."}
              </p>
            </div>

            <div className="rounded-[28px] border border-[#dfe7f7] bg-[#f8fbff] p-5">
              <div className="space-y-3">
                <div className="rounded-[24px] border border-[#dfe7f7] bg-white p-4">
                  <p className="text-sm font-semibold text-black">
                    O que essa conexão libera
                  </p>

                  <p className="mt-1 text-sm leading-6 text-neutral-600">
                    Criação de contatos no Bling, geração de cobrança real e continuidade do fluxo de assinatura.
                  </p>
                </div>

                <div className="rounded-[24px] border border-[#dfe7f7] bg-white p-4">
                  <p className="text-sm font-semibold text-black">
                    Quando fazer isso
                  </p>

                  <p className="mt-1 text-sm leading-6 text-neutral-600">
                    Agora. Sem essa autorização, a cobrança pode até ser criada localmente, mas não nasce de verdade no Bling.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                fullWidth
                onClick={handleConnect}
                loading={connecting}
                className="mt-5 py-3.5"
              >
                {statusData?.connected
                  ? "Reconectar com Bling"
                  : "Conectar com Bling"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => router.push("/configuracoes")}
                className="mt-3 py-3.5"
              >
                Voltar para Configurações
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
