// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\(master)\assinaturas\page.tsx

"use client"

import { Mail, MessageCircle } from "lucide-react"
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import PageContainer from "@/components/layout/PageContainer"
import PageHeader from "@/components/layout/PageHeader"
import { Card, Input } from "@/components/ui"

type PlanoFilter = "todos" | "trial" | "plano_lucro_real"

type StatusFilter =
  | "todos"
  | "trial_ativo"
  | "trial_congelado"
  | "trial_encerrado"
  | "assinante_ativo"
  | "assinante_bloqueado"
  | "assinante_encerrado"

type PeriodoFiltro =
  | "todos"
  | "este_mes"
  | "mes_passado"
  | "mes"
  | "personalizado"

type AssinaturaItem = {
  id?: string | null
  business_id?: string | null

  documento_cliente?: string | null
  cpf_cnpj?: string | null
  documento?: string | null

  razao_social?: string | null
  nome_cliente?: string | null
  cliente_nome?: string | null
  cliente?: string | null
  business_name?: string | null
  name?: string | null
  nome_responsavel?: string | null
  email_financeiro?: string | null
  whatsapp?: string | null

  cliente_criado_em?: string | null

  assinatura_id?: string | null
  assinatura_status?: string | null
  assinatura_status_code?: string | null
  assinatura_status_label?: string | null
  assinatura_status_detalhe?: string | null
  acao_necessaria?: boolean | null

  plano?: string | null
  plano_label?: string | null

  assinatura_valor?: number | string | null

  trial_started_at?: string | null
  trial_ends_at?: string | null
  trial_converted_at?: string | null
  data_ativacao?: string | null

  proximo_vencimento?: string | null
  dia_vencimento?: number | string | null
  tolerancia_dias?: number | string | null

  forma_pagamento?: string | null
  forma_pagamento_label?: string | null
}

type ApiPayload = {
  ok?: boolean
  success?: boolean
  message?: string
  error?: string
  data?: unknown
  items?: unknown
  assinaturas?: unknown
}

const statusOptionsBase: Array<{
  value: StatusFilter
  label: string
  plano: "todos" | "trial" | "plano"
}> = [
  { value: "todos", label: "Todos", plano: "todos" },
  { value: "trial_ativo", label: "Trial ativo", plano: "trial" },
  { value: "trial_congelado", label: "Trial congelado", plano: "trial" },
  { value: "trial_encerrado", label: "Trial encerrado", plano: "trial" },
  { value: "assinante_ativo", label: "Ativo", plano: "plano" },
  { value: "assinante_bloqueado", label: "Bloqueado", plano: "plano" },
  { value: "assinante_encerrado", label: "Encerrado", plano: "plano" },
]

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return {}
}

function extractArray(payload: ApiPayload | null): AssinaturaItem[] {
  if (!payload) return []

  if (Array.isArray(payload.data)) return payload.data as AssinaturaItem[]
  if (Array.isArray(payload.items)) return payload.items as AssinaturaItem[]
  if (Array.isArray(payload.assinaturas)) {
    return payload.assinaturas as AssinaturaItem[]
  }

  const data = asRecord(payload.data)

  if (Array.isArray(data.items)) return data.items as AssinaturaItem[]
  if (Array.isArray(data.assinaturas)) {
    return data.assinaturas as AssinaturaItem[]
  }
  if (Array.isArray(data.data)) return data.data as AssinaturaItem[]

  return []
}

function getNumber(value: unknown) {
  const numberValue = Number(value ?? 0)

  return Number.isFinite(numberValue) ? numberValue : 0
}

function formatMoney(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "—"

  const numberValue = getNumber(value)

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numberValue)
}

function getBrazilDateKeyFromParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const year = parts.find((part) => part.type === "year")?.value
  const month = parts.find((part) => part.type === "month")?.value
  const day = parts.find((part) => part.type === "day")?.value

  if (!year || !month || !day) return null

  return `${year}-${month}-${day}`
}

function getBrazilDateKey(value: string | null | undefined) {
  if (!value) return null

  const cleanValue = String(value).trim()

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    return cleanValue
  }

  const date = new Date(cleanValue)

  if (!Number.isFinite(date.getTime())) {
    return null
  }

  return getBrazilDateKeyFromParts(date)
}

function formatDate(value: string | null | undefined) {
  const dateKey = getBrazilDateKey(value)

  if (!dateKey) return "—"

  const [year, month, day] = dateKey.split("-")

  if (!year || !month || !day) return "—"

  return `${day}/${month}/${year}`
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

function getClienteDocumento(item: AssinaturaItem) {
  return (
    item.documento_cliente ||
    item.cpf_cnpj ||
    item.documento ||
    "Documento não informado"
  )
}

function getRazaoSocial(item: AssinaturaItem) {
  return (
    item.razao_social ||
    item.cliente_nome ||
    item.cliente ||
    item.business_name ||
    item.name ||
    "Cliente sem razão social"
  )
}

function getNomeCliente(item: AssinaturaItem) {
  return (
    item.nome_cliente ||
    item.nome_responsavel ||
    item.cliente_nome ||
    item.cliente ||
    "Nome não informado"
  )
}

function getEmail(item: AssinaturaItem) {
  return item.email_financeiro || ""
}

function getWhatsapp(item: AssinaturaItem) {
  return item.whatsapp || ""
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "")
}

function buildWhatsAppLink(whatsapp: string) {
  const digits = onlyDigits(whatsapp)

  if (!digits) return null

  const normalized = digits.startsWith("55") ? digits : `55${digits}`

  return `https://wa.me/${normalized}`
}

function buildMailTo(email: string) {
  const cleanEmail = email.trim()

  if (!cleanEmail) return null

  return `mailto:${cleanEmail}`
}

function getPlanoCode(item: AssinaturaItem): PlanoFilter {
  const status = normalizeText(item.assinatura_status_code)
  const plano = normalizeText(item.plano_label || item.plano)

  if (status.startsWith("trial_")) return "trial"
  if (plano === "trial") return "trial"

  return "plano_lucro_real"
}

function getPlanoLabel(item: AssinaturaItem) {
  if (getPlanoCode(item) === "trial") return "Trial"

  return item.plano_label || item.plano || "Plano Lucro Real"
}

function getStatusCode(item: AssinaturaItem): StatusFilter | "sem_assinatura" {
  const status = normalizeText(item.assinatura_status_code)

  if (status === "trial_ativo") return "trial_ativo"
  if (status === "trial_congelado") return "trial_congelado"
  if (status === "trial_encerrado") return "trial_encerrado"
  if (status === "assinante_ativo") return "assinante_ativo"
  if (status === "assinante_bloqueado") return "assinante_bloqueado"
  if (status === "assinante_encerrado") return "assinante_encerrado"

  const label = normalizeText(item.assinatura_status_label)

  if (label.includes("trial") && label.includes("ativo")) {
    return "trial_ativo"
  }

  if (label.includes("trial") && label.includes("congelado")) {
    return "trial_congelado"
  }

  if (label.includes("trial") && label.includes("encerrado")) {
    return "trial_encerrado"
  }

  if (label === "ativo") return "assinante_ativo"
  if (label === "bloqueado") return "assinante_bloqueado"
  if (label === "encerrado") return "assinante_encerrado"

  return "sem_assinatura"
}

function getStatusLabel(item: AssinaturaItem) {
  const status = getStatusCode(item)

  if (status === "trial_ativo") return "Trial ativo"
  if (status === "trial_congelado") return "Trial congelado"
  if (status === "trial_encerrado") return "Trial encerrado"
  if (status === "assinante_ativo") return "Ativo"
  if (status === "assinante_bloqueado") return "Bloqueado"
  if (status === "assinante_encerrado") return "Encerrado"

  return item.assinatura_status_label || "Sem assinatura"
}

function getStatusTone(item: AssinaturaItem) {
  const status = getStatusCode(item)

  if (status === "trial_ativo" || status === "assinante_ativo") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }

  if (status === "trial_congelado" || status === "assinante_bloqueado") {
    return "border-amber-200 bg-amber-50 text-amber-800"
  }

  if (status === "trial_encerrado" || status === "assinante_encerrado") {
    return "border-rose-200 bg-rose-50 text-rose-800"
  }

  return "border-[#dfe7f7] bg-[#f8fbff] text-neutral-700"
}

function getFormaPagamento(item: AssinaturaItem) {
  const value = item.forma_pagamento_label || item.forma_pagamento

  if (!value) return "—"

  const normalized = normalizeText(value)

  if (normalized === "pix") return "Pix"
  if (normalized === "boleto") return "Boleto"

  return value
}

function getDiaVencimento(item: AssinaturaItem) {
  if (!item.dia_vencimento) return "—"

  return `Dia ${item.dia_vencimento}`
}

function getDataBasePeriodo(item: AssinaturaItem) {
  const planoCode = getPlanoCode(item)

  if (planoCode === "trial") {
    return item.cliente_criado_em || item.trial_started_at || null
  }

  return item.data_ativacao || item.trial_converted_at || item.cliente_criado_em || null
}

function isDateInRange(
  value: string | null | undefined,
  dateFrom: string,
  dateTo: string,
) {
  if (!dateFrom && !dateTo) return true

  const dateKey = getBrazilDateKey(value)

  if (!dateKey) return false

  if (dateFrom && dateKey < dateFrom) return false
  if (dateTo && dateKey > dateTo) return false

  return true
}

function matchesPeriodo(
  item: AssinaturaItem,
  dateFrom: string,
  dateTo: string,
) {
  if (!dateFrom && !dateTo) return true

  return isDateInRange(getDataBasePeriodo(item), dateFrom, dateTo)
}

function statusBelongsToPlano(status: StatusFilter, plano: PlanoFilter) {
  if (status === "todos") return true
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
    return statusOptionsBase.filter(
      (option) => option.plano === "todos" || option.plano === "trial",
    )
  }

  if (plano === "plano_lucro_real") {
    return statusOptionsBase.filter(
      (option) => option.plano === "todos" || option.plano === "plano",
    )
  }

  return statusOptionsBase
}

function SummaryGroupCard({
  title,
  value,
  children,
}: {
  title: string
  value: number
  children: ReactNode
}) {
  return (
    <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
          {title}
        </p>

        <p className="text-3xl font-bold text-black">{value}</p>
      </div>

      <div className="mt-4 space-y-2 border-t border-[#eef3ff] pt-3">
        {children}
      </div>
    </Card>
  )
}

function SummaryLine({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm text-neutral-700">
      <span>{label}</span>
      <span className="font-semibold text-black">{value}</span>
    </div>
  )
}

export default function TorreAssinaturasPage() {
  const [items, setItems] = useState<AssinaturaItem[]>([])
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

  const loadAssinaturas = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/master/assinaturas", {
        method: "GET",
        cache: "no-store",
      })

      const payload = (await response.json()) as ApiPayload

      if (!response.ok || payload?.ok === false || payload?.success === false) {
        throw new Error(
          payload?.message ||
            payload?.error ||
            "Não foi possível carregar as assinaturas.",
        )
      }

      setItems(extractArray(payload))
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Erro desconhecido ao carregar assinaturas.",
      )
    } finally {
      setLoading(false)
    }
  }, [])

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

  const filteredItems = useMemo(() => {
    const cleanSearch = normalizeText(search)

    return items.filter((item) => {
      const planoCode = getPlanoCode(item)
      const statusCode = getStatusCode(item)

      const matchesPlano =
        planoFilter === "todos" || planoFilter === planoCode

      const matchesStatus =
        statusFilter === "todos" || statusFilter === statusCode

      const matchesDate = matchesPeriodo(item, dateFrom, dateTo)

      const searchable = normalizeText([
        getClienteDocumento(item),
        getRazaoSocial(item),
        getNomeCliente(item),
        getEmail(item),
        getWhatsapp(item),
        getPlanoLabel(item),
        getStatusLabel(item),
        item.assinatura_status_detalhe,
        item.assinatura_valor,
        getFormaPagamento(item),
        item.dia_vencimento,
        item.proximo_vencimento,
        item.data_ativacao,
        item.cliente_criado_em,
      ].join(" "))

      const matchesSearch = !cleanSearch || searchable.includes(cleanSearch)

      return matchesPlano && matchesStatus && matchesDate && matchesSearch
    })
  }, [dateFrom, dateTo, items, planoFilter, search, statusFilter])

  const summary = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => {
        const planoCode = getPlanoCode(item)
        const statusCode = getStatusCode(item)

        acc.total += 1

        if (planoCode === "trial") {
          acc.trial += 1
        } else {
          acc.planos += 1
        }

        if (statusCode === "trial_ativo") acc.trialAtivo += 1
        if (statusCode === "trial_congelado") acc.trialCongelado += 1
        if (statusCode === "trial_encerrado") acc.trialEncerrado += 1

        if (statusCode === "assinante_ativo") acc.planosAtivos += 1
        if (statusCode === "assinante_bloqueado") acc.planosBloqueados += 1
        if (statusCode === "assinante_encerrado") acc.planosEncerrados += 1

        if (item.acao_necessaria && planoCode === "trial") {
          acc.acaoTrial += 1
        }

        if (item.acao_necessaria && planoCode !== "trial") {
          acc.acaoPlanos += 1
        }

        return acc
      },
      {
        total: 0,
        trial: 0,
        planos: 0,
        trialAtivo: 0,
        trialCongelado: 0,
        trialEncerrado: 0,
        planosAtivos: 0,
        planosBloqueados: 0,
        planosEncerrados: 0,
        acaoTrial: 0,
        acaoPlanos: 0,
      },
    )
  }, [filteredItems])

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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryGroupCard title="Total" value={summary.total}>
            <SummaryLine label="Trial" value={summary.trial} />
            <SummaryLine label="Planos" value={summary.planos} />
          </SummaryGroupCard>

          <SummaryGroupCard title="Trial" value={summary.trial}>
            <SummaryLine label="Ativo" value={summary.trialAtivo} />
            <SummaryLine label="Congelado" value={summary.trialCongelado} />
            <SummaryLine label="Encerrado" value={summary.trialEncerrado} />
          </SummaryGroupCard>

          <SummaryGroupCard title="Planos" value={summary.planos}>
            <SummaryLine label="Ativos" value={summary.planosAtivos} />
            <SummaryLine label="Bloqueados" value={summary.planosBloqueados} />
            <SummaryLine label="Encerrados" value={summary.planosEncerrados} />
          </SummaryGroupCard>

          <SummaryGroupCard
            title="Ação necessária"
            value={summary.acaoTrial + summary.acaoPlanos}
          >
            <SummaryLine label="Trial" value={summary.acaoTrial} />
            <SummaryLine label="Planos" value={summary.acaoPlanos} />
          </SummaryGroupCard>
        </div>

        <Card className="overflow-visible rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
                Filtros
              </p>

              <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_260px_auto]">
                <div>
                  <label className="text-sm font-medium text-black">
                    Buscar assinatura
                  </label>

                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cliente, documento, e-mail, WhatsApp, plano ou status"
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
                          className="flex h-9 w-full items-center rounded-2xl px-3 text-sm font-semibold text-black transition hover:bg-[#f8fbff]"
                        >
                          Tudo
                        </button>

                        <button
                          type="button"
                          onClick={() => aplicarPeriodoRapido("este_mes")}
                          className="flex h-9 w-full items-center rounded-2xl px-3 text-sm font-semibold text-black transition hover:bg-[#f8fbff]"
                        >
                          Este mês
                        </button>

                        <button
                          type="button"
                          onClick={() => aplicarPeriodoRapido("mes_passado")}
                          className="flex h-9 w-full items-center rounded-2xl px-3 text-sm font-semibold text-black transition hover:bg-[#f8fbff]"
                        >
                          Mês passado
                        </button>

                        <button
                          type="button"
                          onClick={abrirSelecionarMes}
                          className="flex h-9 w-full items-center rounded-2xl px-3 text-sm font-semibold text-black transition hover:bg-[#f8fbff]"
                        >
                          Selecionar mês
                        </button>

                        {rascunhoPeriodo === "mes" ? (
                          <input
                            type="month"
                            value={rascunhoMes}
                            onChange={(event) =>
                              aplicarMesSelecionado(event.target.value)
                            }
                            className="h-9 w-full rounded-2xl border border-[#dfe7f7] bg-white px-3 text-sm text-black outline-none transition focus:border-[#002198]"
                          />
                        ) : null}

                        <button
                          type="button"
                          onClick={abrirPeriodoPersonalizado}
                          className="flex h-9 w-full items-center rounded-2xl px-3 text-sm font-semibold text-black transition hover:bg-[#f8fbff]"
                        >
                          Personalizado
                        </button>

                        {rascunhoPeriodo === "personalizado" ? (
                          <div className="space-y-2 rounded-2xl border border-[#dfe7f7] bg-[#f8fbff] p-2.5">
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

                        <button
                          type="button"
                          onClick={() => setMenuPeriodoAberto(false)}
                          className="flex h-9 w-full items-center rounded-2xl px-3 text-sm font-semibold text-neutral-600 transition hover:bg-[#f8fbff]"
                        >
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
                    Usa cadastro para Trial e ativação para Plano.
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
        ) : filteredItems.length === 0 ? (
          <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <p className="text-base font-semibold text-black">
              Nenhuma assinatura encontrada.
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Ajuste plano, status, período ou busca.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-[#dfe7f7] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <div className="hidden border-b border-[#dfe7f7] bg-[#f8fbff] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#002198] xl:grid xl:grid-cols-[1.4fr_1fr_0.75fr_0.65fr_0.85fr_0.75fr_0.45fr] xl:items-start xl:gap-4">
              <span>Cliente</span>
              <span>Plano</span>
              <span>Status</span>
              <span className="text-center">Valor</span>
              <span>Pagamento</span>
              <span>Venc.</span>
              <span className="text-center">Ação</span>
            </div>

            <div className="divide-y divide-[#dfe7f7]">
              {filteredItems.map((item, index) => {
                const email = getEmail(item)
                const whatsapp = getWhatsapp(item)
                const whatsappLink = buildWhatsAppLink(whatsapp)
                const mailTo = buildMailTo(email)
                const planoCode = getPlanoCode(item)
                const statusDetalhe =
                  item.assinatura_status_detalhe ||
                  (item.acao_necessaria ? "Ação necessária" : null)

                return (
                  <div
                    key={
                      item.id ||
                      item.assinatura_id ||
                      item.business_id ||
                      `${getClienteDocumento(item)}-${index}`
                    }
                    className="grid gap-4 px-5 py-4 xl:grid-cols-[1.4fr_1fr_0.75fr_0.65fr_0.85fr_0.75fr_0.45fr] xl:items-start"
                  >
                    <div>
                      <p className="text-sm text-[#002198]">
                        {getClienteDocumento(item)}
                      </p>

                      <p className="text-sm text-black">
                        {getRazaoSocial(item)}
                      </p>

                      <p className="text-sm leading-6 text-neutral-700">
                        {getNomeCliente(item)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-black">{getPlanoLabel(item)}</p>

                      {planoCode === "trial" ? (
                        <p className="mt-1 text-sm text-neutral-600">
                          Cadastro: {formatDate(item.cliente_criado_em)}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-neutral-600">
                          Ativação: {formatDate(item.data_ativacao)}
                        </p>
                      )}
                    </div>

                    <div>
                      <span
                        className={[
                          "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                          getStatusTone(item),
                        ].join(" ")}
                      >
                        {getStatusLabel(item)}
                      </span>

                      {statusDetalhe ? (
                        <p className="mt-2 text-xs font-semibold text-rose-600">
                          {statusDetalhe}
                        </p>
                      ) : null}
                    </div>

                    <div className="xl:text-center">
                      <p className="text-sm text-neutral-700">
                        {formatMoney(item.assinatura_valor)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-neutral-700">
                        {getFormaPagamento(item)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-neutral-700">
                        {getDiaVencimento(item)}
                      </p>

                      {item.proximo_vencimento ? (
                        <p className="mt-1 text-xs text-neutral-500">
                          Próx.: {formatDate(item.proximo_vencimento)}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex gap-2 xl:justify-center">
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

                      {mailTo ? (
                        <a
                          href={mailTo}
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
                )
              })}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}