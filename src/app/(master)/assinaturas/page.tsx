// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\(master)\assinaturas\page.tsx

"use client"

import { Mail, MessageCircle } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import PageContainer from "@/components/layout/PageContainer"
import PageHeader from "@/components/layout/PageHeader"
import { Card, Input } from "@/components/ui"

type StatusFilter =
  | "todos"
  | "atencao"
  | "trial_ativo"
  | "trial_congelado"
  | "trial_encerrado"
  | "assinante_ativo"
  | "assinante_bloqueado"
  | "assinante_encerrado"

type PlanoFilter = "todos" | "trial" | "plano_lucro_real"

type PeriodoFiltro =
  | "todos"
  | "este_mes"
  | "mes_passado"
  | "mes"
  | "personalizado"

type Summary = {
  total: number
  trial: number
  planos: number
  trialAtivo: number
  trialCongelado: number
  trialEncerrado: number
  ativos: number
  bloqueados: number
  encerrados: number
  atencao: number
}

type AssinaturaItem = {
  id: string
  business_id: string
  cliente: string
  responsavel: string | null
  email: string | null
  whatsapp: string | null
  endereco_cobranca: string | null
  plano_tipo: "Trial" | "Plano"
  plano_label: string
  plano_valor: number | null
  data_cadastro: string | null
  data_ativacao: string | null
  data_referencia: string | null
  data_referencia_label: "Cadastro" | "Ativação"
  status_code:
    | "trial_ativo"
    | "trial_congelado"
    | "trial_encerrado"
    | "assinante_ativo"
    | "assinante_bloqueado"
    | "assinante_encerrado"
  status_label: string
  status_raw: string | null
  trial_started_at: string | null
  trial_ends_at: string | null
  tolerancia_dias: number
  proximo_vencimento: string | null
  cobranca_id: string | null
  cobranca_status: string | null
  cobranca_label: string
  cobranca_emitida: boolean
  cobranca_emissao_label: "Emitida" | "Pendente de Emissão"
  cobranca_valor: number | null
  cobranca_vencimento: string | null
  cobranca_link: string | null
  cobranca_bling_id: string | null
  cobranca_documento: string | null
  precisa_atencao: boolean
}

type ApiResponse = {
  ok: boolean
  message?: string
  summary?: Partial<Summary>
  data?: AssinaturaItem[]
}

const emptySummary: Summary = {
  total: 0,
  trial: 0,
  planos: 0,
  trialAtivo: 0,
  trialCongelado: 0,
  trialEncerrado: 0,
  ativos: 0,
  bloqueados: 0,
  encerrados: 0,
  atencao: 0,
}

const allStatusOptions: Array<{
  value: StatusFilter
  label: string
  plano: "todos" | "trial" | "plano"
}> = [
  { value: "todos", label: "Todos", plano: "todos" },
  { value: "atencao", label: "Ação necessária", plano: "todos" },
  { value: "trial_ativo", label: "Trial ativo", plano: "trial" },
  { value: "trial_congelado", label: "Trial congelado", plano: "trial" },
  { value: "trial_encerrado", label: "Trial encerrado", plano: "trial" },
  { value: "assinante_ativo", label: "Ativo", plano: "plano" },
  { value: "assinante_bloqueado", label: "Bloqueado", plano: "plano" },
  { value: "assinante_encerrado", label: "Encerrado", plano: "plano" },
]

function numberOrZero(value: unknown) {
  const number = Number(value)

  return Number.isFinite(number) ? number : 0
}

function normalizeSummary(summary?: Partial<Summary>): Summary {
  return {
    total: numberOrZero(summary?.total),
    trial: numberOrZero(summary?.trial),
    planos: numberOrZero(summary?.planos),
    trialAtivo: numberOrZero(summary?.trialAtivo),
    trialCongelado: numberOrZero(summary?.trialCongelado),
    trialEncerrado: numberOrZero(summary?.trialEncerrado),
    ativos: numberOrZero(summary?.ativos),
    bloqueados: numberOrZero(summary?.bloqueados),
    encerrados: numberOrZero(summary?.encerrados),
    atencao: numberOrZero(summary?.atencao),
  }
}

function formatarDataInputLocal(data: Date) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")

  return `${ano}-${mes}-${dia}`
}

function formatarMesInputLocal(data: Date) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")

  return `${ano}-${mes}`
}

function getDatasMesAtual() {
  const hoje = new Date()

  return {
    dataInicial: formatarDataInputLocal(
      new Date(hoje.getFullYear(), hoje.getMonth(), 1),
    ),
    dataFinal: formatarDataInputLocal(
      new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0),
    ),
  }
}

function getDatasMesPassado() {
  const hoje = new Date()

  return {
    dataInicial: formatarDataInputLocal(
      new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1),
    ),
    dataFinal: formatarDataInputLocal(
      new Date(hoje.getFullYear(), hoje.getMonth(), 0),
    ),
  }
}

function getDatasDoMesSelecionado(valorMes: string) {
  const [anoTexto, mesTexto] = valorMes.split("-")

  const ano = Number(anoTexto)
  const mesIndex = Number(mesTexto) - 1

  return {
    dataInicial: formatarDataInputLocal(new Date(ano, mesIndex, 1)),
    dataFinal: formatarDataInputLocal(new Date(ano, mesIndex + 1, 0)),
  }
}

function formatDate(value: string | null) {
  if (!value) return "—"

  const cleanValue = String(value).substring(0, 10)
  const [year, month, day] = cleanValue.split("-")

  if (!year || !month || !day) return "—"

  return `${day}/${month}/${year}`
}

function formatarMesAnoBR(valorMes: string) {
  if (!valorMes) return "—"

  const [ano, mes] = valorMes.split("-")

  const nomesMeses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ]

  return `${nomesMeses[Number(mes) - 1]} de ${ano}`
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return ""

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value))
}

function onlyNumbers(value: string | null) {
  return String(value ?? "").replace(/\D/g, "")
}

function buildWhatsAppLink(whatsapp: string | null) {
  const digits = onlyNumbers(whatsapp)

  if (!digits) return null

  const normalized = digits.startsWith("55") ? digits : `55${digits}`

  return `https://wa.me/${normalized}`
}

function buildMailLink(email: string | null) {
  if (!email) return null

  const cleanEmail = email.trim()

  if (!cleanEmail) return null

  return `mailto:${cleanEmail}`
}

function getSafePlanoTipo(item: AssinaturaItem) {
  if (item.plano_tipo === "Plano" || item.data_ativacao) return "Plano"

  return "Trial"
}

function getSafePlanoLabel(item: AssinaturaItem) {
  const tipo = getSafePlanoTipo(item)

  if (tipo === "Trial") return "Trial"

  return item.plano_label || "Plano Lucro Real"
}

function getPlanoClass(tipo: "Trial" | "Plano") {
  if (tipo === "Plano") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }

  return "border-[#cfd8ff] bg-[#eef3ff] text-[#002198]"
}

function getStatusClass(status: AssinaturaItem["status_code"]) {
  if (status === "assinante_ativo" || status === "trial_ativo") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }

  if (status === "trial_congelado") {
    return "border-amber-200 bg-amber-50 text-amber-900"
  }

  if (status === "trial_encerrado" || status === "assinante_bloqueado") {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  if (status === "assinante_encerrado") {
    return "border-neutral-200 bg-neutral-50 text-neutral-700"
  }

  return "border-[#dfe7f7] bg-[#f8fbff] text-[#002198]"
}

function getCobrancaEmissaoClass(emitida: boolean) {
  if (emitida) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }

  return "border-amber-200 bg-amber-50 text-amber-900"
}

function statusBelongsToPlano(status: StatusFilter, plano: PlanoFilter) {
  if (status === "todos" || status === "atencao") return true
  if (plano === "todos") return true

  if (plano === "trial") {
    return status.startsWith("trial_")
  }

  if (plano === "plano_lucro_real") {
    return status.startsWith("assinante_")
  }

  return true
}

function getStatusOptions(plano: PlanoFilter) {
  if (plano === "trial") {
    return allStatusOptions.filter(
      (option) => option.plano === "todos" || option.plano === "trial",
    )
  }

  if (plano === "plano_lucro_real") {
    return allStatusOptions.filter(
      (option) => option.plano === "todos" || option.plano === "plano",
    )
  }

  return allStatusOptions
}

function OverviewCard({
  title,
  value,
  tone = "default",
  active = false,
  onClick,
  rows,
}: {
  title: string
  value: number
  tone?: "default" | "danger" | "success" | "warning" | "blue" | "neutral"
  active?: boolean
  onClick: () => void
  rows: Array<{
    label: string
    value: number
    onClick?: () => void
  }>
}) {
  const className =
    tone === "danger"
      ? "border border-rose-200 bg-rose-50"
      : tone === "success"
        ? "border border-emerald-200 bg-emerald-50"
        : tone === "warning"
          ? "border border-amber-200 bg-amber-50"
          : tone === "blue"
            ? "border border-[#cfd8ff] bg-[#eef3ff]"
            : tone === "neutral"
              ? "border border-neutral-200 bg-neutral-50"
              : "border border-[#dfe7f7] bg-white"

  const valueClass =
    tone === "danger"
      ? "text-rose-800"
      : tone === "success"
        ? "text-emerald-800"
        : tone === "warning"
          ? "text-amber-800"
          : "text-black"

  return (
    <Card
      className={[
        "rounded-[24px] p-4 shadow-[0_14px_34px_rgba(15,23,42,0.035)]",
        className,
        active ? "ring-2 ring-[#002198] ring-offset-2" : "",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
          {title}
        </p>

        <p className={["text-3xl font-bold leading-none", valueClass].join(" ")}>
          {numberOrZero(value)}
        </p>
      </button>

      <div className="mt-3 space-y-1 border-t border-black/5 pt-3">
        {rows.map((row) => (
          <button
            key={row.label}
            type="button"
            onClick={row.onClick}
            disabled={!row.onClick}
            className={[
              "flex w-full items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-left text-sm transition",
              row.onClick
                ? "text-neutral-700 hover:bg-white/80"
                : "text-neutral-600",
            ].join(" ")}
          >
            <span>{row.label}</span>
            <span className="font-bold text-black">
              {numberOrZero(row.value)}
            </span>
          </button>
        ))}
      </div>
    </Card>
  )
}

export default function TorreAssinaturasPage() {
  const [items, setItems] = useState<AssinaturaItem[]>([])
  const [summary, setSummary] = useState<Summary>(emptySummary)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [planoFilter, setPlanoFilter] = useState<PlanoFilter>("todos")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos")

  const [menuPeriodoAberto, setMenuPeriodoAberto] = useState(false)
  const [periodoSelecionado, setPeriodoSelecionado] =
    useState<PeriodoFiltro>("todos")
  const [rascunhoPeriodo, setRascunhoPeriodo] =
    useState<PeriodoFiltro>("todos")
  const [rascunhoMes, setRascunhoMes] = useState("")
  const [rascunhoDataInicial, setRascunhoDataInicial] = useState("")
  const [rascunhoDataFinal, setRascunhoDataFinal] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const menuPeriodoRef = useRef<HTMLDivElement | null>(null)

  const statusOptions = useMemo(
    () => getStatusOptions(planoFilter),
    [planoFilter],
  )

  const acaoTrial = useMemo(() => {
    return items.filter(
      (item) => getSafePlanoTipo(item) === "Trial" && item.precisa_atencao,
    ).length
  }, [items])

  const acaoPlanos = useMemo(() => {
    return items.filter(
      (item) => getSafePlanoTipo(item) === "Plano" && item.precisa_atencao,
    ).length
  }, [items])

  const textoPeriodoBotao = useMemo(() => {
    if (periodoSelecionado === "este_mes") return "Este mês"
    if (periodoSelecionado === "mes_passado") return "Mês passado"
    if (periodoSelecionado === "mes") return "Selecionar mês"
    if (periodoSelecionado === "personalizado") return "Personalizado"

    return "Tudo"
  }, [periodoSelecionado])

  const resumoFiltro = useMemo(() => {
    if (periodoSelecionado === "todos") {
      return "Filtro aplicado: tudo"
    }

    if (periodoSelecionado === "este_mes") {
      return "Filtro aplicado: este mês"
    }

    if (periodoSelecionado === "mes_passado") {
      return "Filtro aplicado: mês passado"
    }

    if (periodoSelecionado === "mes") {
      return `Filtro aplicado: ${formatarMesAnoBR(rascunhoMes)}`
    }

    return `Filtro aplicado: ${formatDate(dateFrom)} até ${formatDate(dateTo)}`
  }, [dateFrom, dateTo, periodoSelecionado, rascunhoMes])

  const queryString = useMemo(() => {
    const params = new URLSearchParams()

    params.set("plano", planoFilter)
    params.set("status", statusFilter)

    if (search.trim()) {
      params.set("search", search.trim())
    }

    if (dateFrom) {
      params.set("dateFrom", dateFrom)
    }

    if (dateTo) {
      params.set("dateTo", dateTo)
    }

    return params.toString()
  }, [dateFrom, dateTo, planoFilter, search, statusFilter])

  const loadAssinaturas = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/master/assinaturas?${queryString}`, {
        method: "GET",
        cache: "no-store",
      })

      const payload = (await response.json()) as ApiResponse

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.message || "Não foi possível carregar as assinaturas.",
        )
      }

      setItems(payload.data ?? [])
      setSummary(normalizeSummary(payload.summary))
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Erro desconhecido ao carregar assinaturas.",
      )

      setItems([])
      setSummary(emptySummary)
    } finally {
      setLoading(false)
    }
  }, [queryString])

  useEffect(() => {
    void loadAssinaturas()
  }, [loadAssinaturas])

  useEffect(() => {
    if (!menuPeriodoAberto) return

    function handleClickFora(event: MouseEvent) {
      if (
        menuPeriodoRef.current &&
        !menuPeriodoRef.current.contains(event.target as Node)
      ) {
        setMenuPeriodoAberto(false)
      }
    }

    document.addEventListener("mousedown", handleClickFora)

    return () => {
      document.removeEventListener("mousedown", handleClickFora)
    }
  }, [menuPeriodoAberto])

  function handlePlanoChange(value: PlanoFilter) {
    setPlanoFilter(value)

    if (!statusBelongsToPlano(statusFilter, value)) {
      setStatusFilter("todos")
    }
  }

  function abrirMenuPeriodo() {
    const mesAtual = formatarMesInputLocal(new Date())

    setRascunhoPeriodo(periodoSelecionado)
    setRascunhoMes(rascunhoMes || mesAtual)
    setRascunhoDataInicial(dateFrom)
    setRascunhoDataFinal(dateTo)

    setMenuPeriodoAberto(true)
  }

  function aplicarTudo() {
    setPeriodoSelecionado("todos")
    setRascunhoPeriodo("todos")
    setRascunhoMes("")
    setRascunhoDataInicial("")
    setRascunhoDataFinal("")
    setDateFrom("")
    setDateTo("")
    setMenuPeriodoAberto(false)
  }

  function aplicarPeriodoRapido(tipoPeriodo: "este_mes" | "mes_passado") {
    const datas =
      tipoPeriodo === "este_mes" ? getDatasMesAtual() : getDatasMesPassado()

    const hoje = new Date()
    const mesReferencia =
      tipoPeriodo === "este_mes"
        ? formatarMesInputLocal(hoje)
        : formatarMesInputLocal(
            new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1),
          )

    setPeriodoSelecionado(tipoPeriodo)
    setRascunhoPeriodo(tipoPeriodo)
    setRascunhoMes(mesReferencia)
    setRascunhoDataInicial(datas.dataInicial)
    setRascunhoDataFinal(datas.dataFinal)
    setDateFrom(datas.dataInicial)
    setDateTo(datas.dataFinal)
    setMenuPeriodoAberto(false)
  }

  function abrirSelecionarMes() {
    const mesAtual = formatarMesInputLocal(new Date())

    setRascunhoPeriodo("mes")
    setRascunhoMes(rascunhoMes || mesAtual)
  }

  function aplicarMesSelecionado(valorMes: string) {
    if (!valorMes) return

    const datas = getDatasDoMesSelecionado(valorMes)

    setPeriodoSelecionado("mes")
    setRascunhoPeriodo("mes")
    setRascunhoMes(valorMes)
    setRascunhoDataInicial(datas.dataInicial)
    setRascunhoDataFinal(datas.dataFinal)
    setDateFrom(datas.dataInicial)
    setDateTo(datas.dataFinal)
  }

  function abrirPeriodoPersonalizado() {
    const datasMesAtual = getDatasMesAtual()

    setRascunhoPeriodo("personalizado")
    setRascunhoDataInicial(dateFrom || datasMesAtual.dataInicial)
    setRascunhoDataFinal(dateTo || datasMesAtual.dataFinal)
  }

  function aplicarDataInicialPersonalizada(value: string) {
    setRascunhoDataInicial(value)
    setPeriodoSelecionado("personalizado")
    setRascunhoPeriodo("personalizado")
    setDateFrom(value)

    if (rascunhoDataFinal) {
      setDateTo(rascunhoDataFinal)
    }
  }

  function aplicarDataFinalPersonalizada(value: string) {
    setRascunhoDataFinal(value)
    setPeriodoSelecionado("personalizado")
    setRascunhoPeriodo("personalizado")
    setDateTo(value)

    if (rascunhoDataInicial) {
      setDateFrom(rascunhoDataInicial)
    }
  }

  function limparFiltros() {
    setSearch("")
    setPlanoFilter("todos")
    setStatusFilter("todos")
    aplicarTudo()
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Torre de controle"
          title="Assinaturas"
          subtitle="Acompanhe clientes em trial, planos, status de acesso e próxima cobrança de cada cliente."
        />

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <OverviewCard
            title="Total"
            value={summary.total}
            active={statusFilter === "todos" && planoFilter === "todos"}
            onClick={() => {
              setStatusFilter("todos")
              setPlanoFilter("todos")
            }}
            rows={[
              {
                label: "Trial",
                value: summary.trial,
                onClick: () => {
                  setPlanoFilter("trial")
                  setStatusFilter("todos")
                },
              },
              {
                label: "Planos",
                value: summary.planos,
                onClick: () => {
                  setPlanoFilter("plano_lucro_real")
                  setStatusFilter("todos")
                },
              },
            ]}
          />

          <OverviewCard
            title="Trial"
            value={summary.trial}
            tone="blue"
            active={planoFilter === "trial"}
            onClick={() => {
              setPlanoFilter("trial")
              setStatusFilter("todos")
            }}
            rows={[
              {
                label: "Ativo",
                value: summary.trialAtivo,
                onClick: () => {
                  setPlanoFilter("trial")
                  setStatusFilter("trial_ativo")
                },
              },
              {
                label: "Congelado",
                value: summary.trialCongelado,
                onClick: () => {
                  setPlanoFilter("trial")
                  setStatusFilter("trial_congelado")
                },
              },
              {
                label: "Encerrado",
                value: summary.trialEncerrado,
                onClick: () => {
                  setPlanoFilter("trial")
                  setStatusFilter("trial_encerrado")
                },
              },
            ]}
          />

          <OverviewCard
            title="Planos"
            value={summary.planos}
            tone="success"
            active={planoFilter === "plano_lucro_real"}
            onClick={() => {
              setPlanoFilter("plano_lucro_real")
              setStatusFilter("todos")
            }}
            rows={[
              {
                label: "Ativos",
                value: summary.ativos,
                onClick: () => {
                  setPlanoFilter("plano_lucro_real")
                  setStatusFilter("assinante_ativo")
                },
              },
              {
                label: "Bloqueados",
                value: summary.bloqueados,
                onClick: () => {
                  setPlanoFilter("plano_lucro_real")
                  setStatusFilter("assinante_bloqueado")
                },
              },
              {
                label: "Encerrados",
                value: summary.encerrados,
                onClick: () => {
                  setPlanoFilter("plano_lucro_real")
                  setStatusFilter("assinante_encerrado")
                },
              },
            ]}
          />

          <OverviewCard
            title="Ação necessária"
            value={summary.atencao}
            tone={summary.atencao > 0 ? "danger" : "neutral"}
            active={statusFilter === "atencao"}
            onClick={() => setStatusFilter("atencao")}
            rows={[
              {
                label: "Trial",
                value: acaoTrial,
                onClick: () => {
                  setPlanoFilter("trial")
                  setStatusFilter("atencao")
                },
              },
              {
                label: "Planos",
                value: acaoPlanos,
                onClick: () => {
                  setPlanoFilter("plano_lucro_real")
                  setStatusFilter("atencao")
                },
              },
            ]}
          />
        </div>

        <Card className="overflow-visible rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                Filtros
              </p>

              <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_190px_220px_auto]">
                <div>
                  <label className="text-sm font-medium text-black">
                    Buscar assinatura
                  </label>

                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cliente, responsável, e-mail, WhatsApp, plano ou status"
                    className="mt-2 h-11"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-black">
                    Plano
                  </label>

                  <select
                    value={planoFilter}
                    onChange={(event) =>
                      handlePlanoChange(event.target.value as PlanoFilter)
                    }
                    className="mt-2 h-11 w-full rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm text-black outline-none transition focus:border-[#002198] focus:ring-2 focus:ring-[#002198]/10"
                  >
                    <option value="todos">Todos</option>
                    <option value="trial">Trial</option>
                    <option value="plano_lucro_real">Plano Lucro Real</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-black">
                    Status
                  </label>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as StatusFilter)
                    }
                    className="mt-2 h-11 w-full rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm text-black outline-none transition focus:border-[#002198] focus:ring-2 focus:ring-[#002198]/10"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={limparFiltros}
                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-[#dfe7f7] bg-white px-4 text-sm font-semibold text-[#002198] transition hover:bg-[#eef3ff] xl:w-auto"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#dfe7f7] bg-[#f8fbff] p-4">
                <p className="text-sm font-semibold text-black">
                  Os resultados atualizam automaticamente.
                </p>
              </div>
            </div>

            <div className="w-full shrink-0 lg:w-[330px]">
              <div className="rounded-[22px] border border-[#dfe7f7] bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <div className="relative" ref={menuPeriodoRef}>
                  <label className="text-xs font-bold uppercase tracking-[0.14em] text-[#002198]">
                    Período
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (menuPeriodoAberto) {
                        setMenuPeriodoAberto(false)
                        return
                      }

                      abrirMenuPeriodo()
                    }}
                    className={[
                      "mt-2 flex h-10 w-full items-center justify-between rounded-2xl border px-3 text-sm font-semibold transition",
                      menuPeriodoAberto
                        ? "border-[#002198] bg-[#f8fbff] text-[#002198]"
                        : "border-[#dfe7f7] bg-white text-black hover:bg-[#f8fbff]",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-2 text-left">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#eef3ff] text-xs">
                        📅
                      </span>
                      {textoPeriodoBotao}
                    </span>

                    <span className="text-[10px] text-[#002198]">
                      {menuPeriodoAberto ? "▲" : "▼"}
                    </span>
                  </button>

                  {menuPeriodoAberto ? (
                    <div className="absolute right-0 z-20 mt-2 w-full rounded-[20px] border border-[#dfe7f7] bg-white p-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={aplicarTudo}
                          className={[
                            "flex h-9 w-full items-center justify-between rounded-2xl px-3 text-sm font-semibold transition",
                            periodoSelecionado === "todos"
                              ? "bg-[#eef3ff] text-[#002198]"
                              : "bg-white text-black hover:bg-[#f8fbff]",
                          ].join(" ")}
                        >
                          <span className="flex items-center gap-2 text-left">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#eef3ff] text-xs">
                              ✨
                            </span>
                            Tudo
                          </span>

                          <span className="w-5 text-right text-[#002198]">
                            {periodoSelecionado === "todos" ? "✓" : ""}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => aplicarPeriodoRapido("este_mes")}
                          className={[
                            "flex h-9 w-full items-center justify-between rounded-2xl px-3 text-sm font-semibold transition",
                            periodoSelecionado === "este_mes"
                              ? "bg-[#eef3ff] text-[#002198]"
                              : "bg-white text-black hover:bg-[#f8fbff]",
                          ].join(" ")}
                        >
                          <span className="flex items-center gap-2 text-left">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#eef3ff] text-xs">
                              📅
                            </span>
                            Este mês
                          </span>

                          <span className="w-5 text-right text-[#002198]">
                            {periodoSelecionado === "este_mes" ? "✓" : ""}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => aplicarPeriodoRapido("mes_passado")}
                          className={[
                            "flex h-9 w-full items-center justify-between rounded-2xl px-3 text-sm font-semibold transition",
                            periodoSelecionado === "mes_passado"
                              ? "bg-[#eef3ff] text-[#002198]"
                              : "bg-white text-black hover:bg-[#f8fbff]",
                          ].join(" ")}
                        >
                          <span className="flex items-center gap-2 text-left">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#eef3ff] text-xs">
                              🗓️
                            </span>
                            Mês passado
                          </span>

                          <span className="w-5 text-right text-[#002198]">
                            {periodoSelecionado === "mes_passado" ? "✓" : ""}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={abrirSelecionarMes}
                          className={[
                            "flex h-9 w-full items-center justify-between rounded-2xl px-3 text-sm font-semibold transition",
                            rascunhoPeriodo === "mes"
                              ? "bg-[#eef3ff] text-[#002198]"
                              : "bg-white text-black hover:bg-[#f8fbff]",
                          ].join(" ")}
                        >
                          <span className="flex items-center gap-2 text-left">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#eef3ff] text-xs">
                              📆
                            </span>
                            Selecionar mês
                          </span>

                          <span className="w-5 text-right text-[#002198]">
                            {rascunhoPeriodo === "mes" ? "✓" : ""}
                          </span>
                        </button>

                        {rascunhoPeriodo === "mes" ? (
                          <div className="mt-2 space-y-2 rounded-2xl border border-[#dfe7f7] bg-[#f8fbff] p-2.5">
                            <input
                              type="month"
                              value={rascunhoMes}
                              onChange={(event) =>
                                aplicarMesSelecionado(event.target.value)
                              }
                              className="h-9 w-full rounded-2xl border border-[#dfe7f7] bg-white px-3 text-sm text-black outline-none transition focus:border-[#002198]"
                            />
                          </div>
                        ) : null}

                        <button
                          type="button"
                          onClick={abrirPeriodoPersonalizado}
                          className={[
                            "flex h-9 w-full items-center justify-between rounded-2xl px-3 text-sm font-semibold transition",
                            rascunhoPeriodo === "personalizado"
                              ? "bg-[#eef3ff] text-[#002198]"
                              : "bg-white text-black hover:bg-[#f8fbff]",
                          ].join(" ")}
                        >
                          <span className="flex items-center gap-2 text-left">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#eef3ff] text-xs">
                              🔎
                            </span>
                            Personalizado
                          </span>

                          <span className="w-5 text-right text-[#002198]">
                            {rascunhoPeriodo === "personalizado" ? "✓" : ""}
                          </span>
                        </button>

                        {rascunhoPeriodo === "personalizado" ? (
                          <div className="mt-2 space-y-2 rounded-2xl border border-[#dfe7f7] bg-[#f8fbff] p-2.5">
                            <input
                              type="date"
                              value={rascunhoDataInicial}
                              onChange={(event) =>
                                aplicarDataInicialPersonalizada(
                                  event.target.value,
                                )
                              }
                              className="h-9 w-full rounded-2xl border border-[#dfe7f7] bg-white px-3 text-sm text-black outline-none transition focus:border-[#002198]"
                            />

                            <input
                              type="date"
                              value={rascunhoDataFinal}
                              onChange={(event) =>
                                aplicarDataFinalPersonalizada(
                                  event.target.value,
                                )
                              }
                              className="h-9 w-full rounded-2xl border border-[#dfe7f7] bg-white px-3 text-sm text-black outline-none transition focus:border-[#002198]"
                            />
                          </div>
                        ) : null}

                        <div className="my-1 border-t border-[#dfe7f7]" />

                        <button
                          type="button"
                          onClick={() => setMenuPeriodoAberto(false)}
                          className="flex h-9 w-full items-center gap-2 rounded-2xl px-3 text-left text-sm font-semibold text-neutral-600 transition hover:bg-[#f8fbff]"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#eef3ff] text-xs text-[#002198]">
                            ✕
                          </span>
                          Fechar
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 rounded-2xl border border-[#dfe7f7] bg-[#f8fbff] px-3 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#002198]">
                    Filtro aplicado
                  </p>

                  <p className="mt-0.5 text-xs font-semibold text-black">
                    {resumoFiltro}
                  </p>

                  <p className="mt-1 text-[11px] leading-4 text-neutral-500">
                    Cadastro para Trial. Ativação para Plano.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {error ? (
          <Card className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 shadow-none">
            <p className="text-sm font-semibold text-rose-700">{error}</p>
          </Card>
        ) : null}

        {loading ? (
          <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <p className="text-base font-semibold text-black">
              Carregando assinaturas...
            </p>
          </Card>
        ) : items.length === 0 ? (
          <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <p className="text-base font-semibold text-black">
              Nenhuma assinatura encontrada.
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Ajuste os filtros ou limpe a busca.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-[#dfe7f7] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <div className="hidden grid-cols-[1.2fr_0.9fr_1.2fr_0.75fr_0.85fr_0.45fr] gap-4 border-b border-[#dfe7f7] bg-[#f8fbff] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:grid">
              <span>Cliente</span>
              <span>Plano</span>
              <span>Endereço</span>
              <span>Status</span>
              <span>Cobrança</span>
              <span className="text-right">Ação</span>
            </div>

            <div className="divide-y divide-[#dfe7f7]">
              {items.map((item) => {
                const whatsappLink = buildWhatsAppLink(item.whatsapp)
                const emailLink = buildMailLink(item.email)
                const planoTipo = getSafePlanoTipo(item)
                const planoLabel = getSafePlanoLabel(item)
                const planoValue = formatMoney(item.plano_valor)

                return (
                  <div
                    key={item.id}
                    className="grid gap-4 px-5 py-5 xl:grid-cols-[1.2fr_0.9fr_1.2fr_0.75fr_0.85fr_0.45fr] xl:items-start"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Cliente
                      </p>

                      <p className="mt-1 text-sm font-semibold text-black">
                        {item.cliente}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {item.responsavel || "Responsável não informado"}
                      </p>

                      <p className="mt-1 break-all text-xs text-neutral-500">
                        {item.email || "E-mail não informado"}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        WhatsApp: {item.whatsapp || "não informado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Plano
                      </p>

                      <span
                        className={[
                          "mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                          getPlanoClass(planoTipo),
                        ].join(" ")}
                      >
                        {planoLabel}
                      </span>

                      {planoTipo === "Plano" && planoValue ? (
                        <p className="mt-2 text-xs text-neutral-500">
                          {planoValue}
                        </p>
                      ) : null}

                      <p className="mt-2 text-xs text-neutral-500">
                        {item.data_referencia_label}:{" "}
                        {formatDate(item.data_referencia)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Endereço
                      </p>

                      <p className="mt-1 text-xs leading-5 text-neutral-600">
                        {item.endereco_cobranca || "Endereço não informado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Status
                      </p>

                      <span
                        className={[
                          "mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                          getStatusClass(item.status_code),
                        ].join(" ")}
                      >
                        {item.status_label}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Cobrança
                      </p>

                      <span
                        className={[
                          "mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                          getCobrancaEmissaoClass(item.cobranca_emitida),
                        ].join(" ")}
                      >
                        {item.cobranca_emissao_label}
                      </span>

                      <p className="mt-2 text-xs text-neutral-500">
                        Próx. venc.: {formatDate(item.cobranca_vencimento)}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {formatMoney(item.cobranca_valor) || "—"}
                      </p>
                    </div>

                    <div className="xl:text-right">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:hidden">
                        Ação
                      </p>

                      <div className="mt-2 flex justify-start gap-2 xl:justify-end">
                        {whatsappLink ? (
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noreferrer"
                            title="Abrir WhatsApp"
                            aria-label="Abrir WhatsApp"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#002198] text-white transition hover:bg-[#00166f]"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        ) : (
                          <span
                            title="WhatsApp não informado"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#dfe7f7] bg-white text-neutral-300"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </span>
                        )}

                        {emailLink ? (
                          <a
                            href={emailLink}
                            title="Enviar e-mail"
                            aria-label="Enviar e-mail"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#dfe7f7] bg-white text-[#002198] transition hover:bg-[#eef3ff]"
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        ) : (
                          <span
                            title="E-mail não informado"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#dfe7f7] bg-white text-neutral-300"
                          >
                            <Mail className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}