// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\(master)\clientes\page.tsx

"use client"

import { Mail, MessageCircle } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import PageContainer from "@/components/layout/PageContainer"
import PageHeader from "@/components/layout/PageHeader"
import { Card, Input } from "@/components/ui"

type QuickFilter =
  | "todos"
  | "com_email"
  | "com_whatsapp"
  | "sem_contato"
  | "sem_responsavel"
  | "recentes"

type StatusFilter =
  | "todos"
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

type MasterCliente = {
  business_id?: string | null

  documento_cliente?: string | null
  cpf_cnpj?: string | null
  documento?: string | null

  razao_social?: string | null
  nome_cliente?: string | null
  negocio?: string | null
  name?: string | null
  nome_responsavel?: string | null

  email_financeiro?: string | null
  whatsapp?: string | null
  cliente_criado_em?: string | null

  endereco_rua?: string | null
  endereco_numero?: string | null
  endereco_complemento?: string | null
  endereco_cep?: string | null
  endereco_bairro?: string | null
  endereco_municipio?: string | null
  endereco_uf?: string | null
  endereco_completo?: string | null

  assinatura_id?: string | null
  assinatura_status?: string | null
  assinatura_status_code?: StatusFilter | "sem_assinatura" | null
  assinatura_status_label?: string | null

  plano?: string | null
  plano_label?: string | null
  assinatura_valor?: number | string | null

  trial_started_at?: string | null
  trial_ends_at?: string | null
  trial_converted_at?: string | null
  data_ativacao?: string | null

  proximo_vencimento?: string | null
  dia_vencimento?: number | string | null

  forma_pagamento?: string | null
  forma_pagamento_label?: string | null

  cobranca_id?: string | null
  cobranca_status?: string | null
  cobranca_valor?: number | string | null
  cobranca_vencimento?: string | null
  cobranca_bling_id?: string | null
  cobranca_link_pagamento?: string | null
}

type ApiResponse = {
  ok?: boolean
  success?: boolean
  message?: string
  error?: string
  data?: MasterCliente[]
  clientes?: MasterCliente[]
  items?: MasterCliente[]
}

const defaultSummary = {
  total: 0,
  comEmail: 0,
  comWhatsapp: 0,
  semContato: 0,
  semResponsavel: 0,
  recentes: 0,
}

const allStatusOptions: Array<{
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

function formatDate(value: string | null | undefined) {
  if (!value) return "—"

  const cleanValue = String(value).substring(0, 10)
  const [year, month, day] = cleanValue.split("-")

  if (!year || !month || !day) return "—"

  return `${day}/${month}/${year}`
}

function formatMoney(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "—"

  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) return "—"

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numberValue)
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

function getClienteDocumento(cliente: MasterCliente) {
  return (
    cliente.documento_cliente ||
    cliente.cpf_cnpj ||
    cliente.documento ||
    "Documento não informado"
  )
}

function getRazaoSocial(cliente: MasterCliente) {
  return (
    cliente.razao_social ||
    cliente.negocio ||
    cliente.name ||
    "Cliente sem razão social"
  )
}

function getNomeCliente(cliente: MasterCliente) {
  return (
    cliente.nome_cliente ||
    cliente.nome_responsavel ||
    cliente.negocio ||
    cliente.name ||
    "Nome não informado"
  )
}

function getEmail(cliente: MasterCliente) {
  return cliente.email_financeiro || ""
}

function getWhatsapp(cliente: MasterCliente) {
  return cliente.whatsapp || ""
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

function isRecent(value: string | null | undefined) {
  if (!value) return false

  const createdAt = new Date(value)

  if (Number.isNaN(createdAt.getTime())) return false

  const now = new Date()
  const diffInDays = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
  )

  return diffInDays <= 7
}

function isDateInRange(
  value: string | null | undefined,
  dateFrom: string,
  dateTo: string,
) {
  if (!dateFrom && !dateTo) return true
  if (!value) return false

  const cleanValue = String(value).substring(0, 10)

  if (dateFrom && cleanValue < dateFrom) return false
  if (dateTo && cleanValue > dateTo) return false

  return true
}

function matchesDateFilter(
  cliente: MasterCliente,
  dateFrom: string,
  dateTo: string,
) {
  if (!dateFrom && !dateTo) return true

  return (
    isDateInRange(cliente.cliente_criado_em, dateFrom, dateTo) ||
    isDateInRange(cliente.data_ativacao, dateFrom, dateTo)
  )
}

function matchesQuickFilter(cliente: MasterCliente, filter: QuickFilter) {
  const email = getEmail(cliente)
  const whatsapp = getWhatsapp(cliente)
  const responsavel = cliente.nome_responsavel?.trim() || ""

  if (filter === "todos") return true
  if (filter === "com_email") return Boolean(email)
  if (filter === "com_whatsapp") return Boolean(onlyDigits(whatsapp))
  if (filter === "sem_contato") return !email && !onlyDigits(whatsapp)
  if (filter === "sem_responsavel") return !responsavel
  if (filter === "recentes") return isRecent(cliente.cliente_criado_em)

  return true
}

function matchesStatusFilter(cliente: MasterCliente, filter: StatusFilter) {
  if (filter === "todos") return true

  return cliente.assinatura_status_code === filter
}

function matchesPlanoFilter(cliente: MasterCliente, filter: PlanoFilter) {
  if (filter === "todos") return true

  const plano = normalizeText(cliente.plano_label)

  if (filter === "trial") {
    return plano === "trial"
  }

  if (filter === "plano_lucro_real") {
    return plano.includes("plano lucro real") || plano.includes("lucro real")
  }

  return true
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

function getEnderecoOrdenado(cliente: MasterCliente) {
  const partes = [
    cliente.endereco_rua,
    cliente.endereco_numero ? `nº ${cliente.endereco_numero}` : null,
    cliente.endereco_complemento,
    cliente.endereco_cep ? `CEP ${cliente.endereco_cep}` : null,
    cliente.endereco_bairro,
    cliente.endereco_municipio,
    cliente.endereco_uf,
  ]
    .map((parte) => String(parte ?? "").trim())
    .filter(Boolean)

  if (partes.length > 0) {
    return partes.join(" · ")
  }

  return cliente.endereco_completo || "Endereço não informado"
}

function getFormaPagamento(cliente: MasterCliente) {
  return (
    cliente.forma_pagamento_label ||
    cliente.forma_pagamento ||
    "Pagamento não informado"
  )
}

function getStatusTone(cliente: MasterCliente) {
  const status = cliente.assinatura_status_code

  if (status === "assinante_ativo" || status === "trial_ativo") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }

  if (status === "assinante_bloqueado" || status === "trial_congelado") {
    return "border-amber-200 bg-amber-50 text-amber-800"
  }

  if (status === "assinante_encerrado" || status === "trial_encerrado") {
    return "border-rose-200 bg-rose-50 text-rose-800"
  }

  return "border-[#dfe7f7] bg-[#f8fbff] text-neutral-700"
}

function SummaryCard({
  label,
  value,
  tone = "default",
  active = false,
  onClick,
}: {
  label: string
  value: number
  tone?: "default" | "danger" | "success" | "warning" | "blue"
  active?: boolean
  onClick: () => void
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
            : "border border-[#dfe7f7] bg-white"

  const textClass =
    tone === "danger"
      ? "text-rose-800"
      : tone === "success"
        ? "text-emerald-800"
        : tone === "warning"
          ? "text-amber-800"
          : "text-black"

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-[28px] p-5 text-left shadow-[0_18px_45px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(15,23,42,0.08)]",
        className,
        active ? "ring-2 ring-[#002198] ring-offset-2" : "",
      ].join(" ")}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
        {label}
      </p>

      <p className={["mt-3 text-3xl font-bold", textClass].join(" ")}>
        {value}
      </p>
    </button>
  )
}

function InfoLine({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#002198]">
        {label}
      </span>
      <span className="text-sm leading-6 text-neutral-700">{value}</span>
    </div>
  )
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<MasterCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("todos")
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

  const loadClientes = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/master/clientes", {
        method: "GET",
        cache: "no-store",
      })

      const payload = (await response.json()) as ApiResponse

      if (!response.ok || payload?.ok === false || payload?.success === false) {
        throw new Error(
          payload?.message ||
            payload?.error ||
            "Não foi possível carregar a Central de clientes.",
        )
      }

      setClientes(payload.data ?? payload.clientes ?? payload.items ?? [])
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Erro desconhecido ao carregar clientes.",
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadClientes()
  }, [loadClientes])

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

  const summary = useMemo(() => {
    return clientes.reduce(
      (acc, cliente) => {
        const email = getEmail(cliente)
        const whatsapp = getWhatsapp(cliente)
        const responsavel = cliente.nome_responsavel?.trim() || ""

        acc.total += 1

        if (email) acc.comEmail += 1
        if (onlyDigits(whatsapp)) acc.comWhatsapp += 1
        if (!email && !onlyDigits(whatsapp)) acc.semContato += 1
        if (!responsavel) acc.semResponsavel += 1
        if (isRecent(cliente.cliente_criado_em)) acc.recentes += 1

        return acc
      },
      { ...defaultSummary },
    )
  }, [clientes])

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

  const filteredClientes = useMemo(() => {
    const cleanSearch = normalizeText(search)

    return clientes.filter((cliente) => {
      const matchesQuick = matchesQuickFilter(cliente, quickFilter)
      const matchesPlano = matchesPlanoFilter(cliente, planoFilter)
      const matchesStatus = matchesStatusFilter(cliente, statusFilter)
      const matchesDate = matchesDateFilter(cliente, dateFrom, dateTo)

      const searchable = normalizeText([
        getClienteDocumento(cliente),
        getRazaoSocial(cliente),
        getNomeCliente(cliente),
        getEmail(cliente),
        getWhatsapp(cliente),
        getEnderecoOrdenado(cliente),
        cliente.plano_label,
        cliente.assinatura_valor,
        cliente.forma_pagamento_label,
        cliente.assinatura_status_label,
        cliente.business_id,
      ].join(" "))

      const matchesSearch = !cleanSearch || searchable.includes(cleanSearch)

      return (
        matchesQuick &&
        matchesPlano &&
        matchesStatus &&
        matchesDate &&
        matchesSearch
      )
    })
  }, [
    clientes,
    dateFrom,
    dateTo,
    planoFilter,
    quickFilter,
    search,
    statusFilter,
  ])

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
    setQuickFilter("todos")
    setPlanoFilter("todos")
    setStatusFilter("todos")
    aplicarTudo()
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Torre de controle"
          title="Central de clientes"
          subtitle="Base cadastral dos clientes do Caixa Inteligente, com cadastro, ativação, plano, valor e status."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <SummaryCard
            label="Clientes"
            value={summary.total}
            active={quickFilter === "todos"}
            onClick={() => setQuickFilter("todos")}
          />

          <SummaryCard
            label="Com e-mail"
            value={summary.comEmail}
            tone="blue"
            active={quickFilter === "com_email"}
            onClick={() => setQuickFilter("com_email")}
          />

          <SummaryCard
            label="Com WhatsApp"
            value={summary.comWhatsapp}
            tone="success"
            active={quickFilter === "com_whatsapp"}
            onClick={() => setQuickFilter("com_whatsapp")}
          />

          <SummaryCard
            label="Sem contato"
            value={summary.semContato}
            tone={summary.semContato > 0 ? "danger" : "default"}
            active={quickFilter === "sem_contato"}
            onClick={() => setQuickFilter("sem_contato")}
          />

          <SummaryCard
            label="Sem responsável"
            value={summary.semResponsavel}
            tone={summary.semResponsavel > 0 ? "warning" : "default"}
            active={quickFilter === "sem_responsavel"}
            onClick={() => setQuickFilter("sem_responsavel")}
          />

          <SummaryCard
            label="Novos 7 dias"
            value={summary.recentes}
            tone="blue"
            active={quickFilter === "recentes"}
            onClick={() => setQuickFilter("recentes")}
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
                    Buscar cliente
                  </label>

                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cliente, documento, endereço, plano ou status"
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
                    Considera cadastro ou ativação dentro do período.
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
              Carregando clientes...
            </p>
          </Card>
        ) : filteredClientes.length === 0 ? (
          <Card className="rounded-[28px] border border-[#dfe7f7] bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <p className="text-base font-semibold text-black">
              Nenhum cliente encontrado.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredClientes.map((cliente) => {
              const email = getEmail(cliente)
              const whatsapp = getWhatsapp(cliente)
              const whatsappLink = buildWhatsAppLink(whatsapp)
              const mailTo = buildMailTo(email)

              return (
                <Card
                  key={
                    cliente.business_id ||
                    `${getRazaoSocial(cliente)}-${email}`
                  }
                  className="rounded-[28px] border border-[#dfe7f7] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-black">
                          {getRazaoSocial(cliente)}
                        </h2>

                        <span
                          className={[
                            "rounded-full border px-3 py-1 text-xs font-semibold",
                            getStatusTone(cliente),
                          ].join(" ")}
                        >
                          {cliente.assinatura_status_label || "—"}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-[#002198]">
                        CPF/CNPJ: {getClienteDocumento(cliente)}
                      </p>

                      <p className="mt-1 text-sm text-neutral-700">
                        Nome: {getNomeCliente(cliente)}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      {whatsappLink ? (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                          title="Abrir WhatsApp"
                          aria-label="Abrir WhatsApp"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#002198] text-white transition hover:bg-[#00166f]"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      ) : (
                        <span
                          title="WhatsApp não informado"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe7f7] bg-white text-neutral-300"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </span>
                      )}

                      {mailTo ? (
                        <a
                          href={mailTo}
                          title="Enviar e-mail"
                          aria-label="Enviar e-mail"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe7f7] bg-white text-[#002198] transition hover:bg-[#eef3ff]"
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      ) : (
                        <span
                          title="E-mail não informado"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe7f7] bg-white text-neutral-300"
                        >
                          <Mail className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-[#eef3ff] pt-5 xl:grid-cols-[1.15fr_1.45fr_1.2fr]">
                    <div className="rounded-2xl border border-[#dfe7f7] bg-[#f8fbff] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#002198]">
                        Contato
                      </p>

                      <div className="mt-3 space-y-3">
                        <InfoLine
                          label="E-mail"
                          value={email || "E-mail não informado"}
                        />

                        <InfoLine
                          label="WhatsApp"
                          value={whatsapp || "WhatsApp não informado"}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#dfe7f7] bg-[#f8fbff] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#002198]">
                        Endereço
                      </p>

                      <p className="mt-3 text-sm leading-7 text-neutral-700">
                        {getEnderecoOrdenado(cliente)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#dfe7f7] bg-[#f8fbff] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#002198]">
                        Assinatura
                      </p>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <InfoLine
                          label="Cadastro"
                          value={formatDate(cliente.cliente_criado_em)}
                        />

                        <InfoLine
                          label="Ativação"
                          value={formatDate(cliente.data_ativacao)}
                        />

                        <InfoLine
                          label="Plano"
                          value={cliente.plano_label || "—"}
                        />

                        <InfoLine
                          label="Valor"
                          value={formatMoney(cliente.assinatura_valor)}
                        />

                        <InfoLine
                          label="Pagamento"
                          value={getFormaPagamento(cliente)}
                        />

                        <InfoLine
                          label="Status"
                          value={cliente.assinatura_status_label || "—"}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </PageContainer>
  )
}