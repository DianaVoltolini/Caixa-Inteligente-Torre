// C:\Users\Diana Voltolini\Documents\Aplicativo Saas\Caixa Inteligente\torre\src\app\api\master\painel\route.ts

import { NextResponse } from "next/server"

import { requireMasterApiUser } from "@/lib/auth/require-master-api"
import { supabaseAdmin } from "@/lib/supabase/admin"

type BusinessRow = {
  id: string
  name: string | null
  nome_responsavel: string | null
  email_financeiro: string | null
  whatsapp: string | null
  created_at: string | null
}

type AssinaturaRow = {
  id: string
  business_id: string
  status: string | null
  plano: string | null
  valor: number | null
  trial_started_at: string | null
  trial_ends_at: string | null
  proximo_vencimento: string | null
  payment_method: string | null
  created_at: string | null
}

type CobrancaRow = {
  id: string
  business_id: string
  assinatura_id: string | null
  valor: number | null
  vencimento: string | null
  status: string | null
  sync_status: string | null
  sync_error: string | null
  ciclo_tipo: string | null
  competencia: string | null
  created_at: string | null
  pago_em: string | null
  bling_cobranca_id: string | null
  bling_link_pagamento: string | null
}

type TransactionRow = {
  business_id: string
}

const TRIAL_LIMIT_TRANSACTIONS = 30

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function normalizeStatus(value: unknown) {
  const status = normalizeText(value)

  if (status === "trial") return "trialing"
  if (status === "cancelled") return "canceled"

  return status
}

function getToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function isPastDate(value: string | null) {
  if (!value) return false

  const date = new Date(`${String(value).substring(0, 10)}T00:00:00`)
  date.setHours(0, 0, 0, 0)

  return Number.isFinite(date.getTime()) && date < getToday()
}

function isRecent(value: string | null) {
  if (!value) return false

  const createdAt = new Date(value)

  if (Number.isNaN(createdAt.getTime())) return false

  const now = new Date()
  const diffInDays = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
  )

  return diffInDays <= 7
}

function getDaysRemaining(value: string | null) {
  if (!value) return null

  const end = new Date(`${String(value).substring(0, 10)}T23:59:59`)
  const diff = end.getTime() - Date.now()

  if (!Number.isFinite(diff)) return null

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function isTrialEnded(
  assinatura: AssinaturaRow,
  totalLancamentos: number,
) {
  const status = normalizeStatus(assinatura.status)

  if (status !== "trialing") return false

  const daysRemaining = getDaysRemaining(assinatura.trial_ends_at)

  return (
    daysRemaining === 0 ||
    totalLancamentos >= TRIAL_LIMIT_TRANSACTIONS
  )
}

function isOpenCharge(cobranca: CobrancaRow) {
  const status = normalizeStatus(cobranca.status)

  return status === "pending" || status === "overdue" || status === "error"
}

function isOverdueCharge(cobranca: CobrancaRow) {
  const status = normalizeStatus(cobranca.status)

  if (status === "overdue") return true

  return status === "pending" && isPastDate(cobranca.vencimento)
}

function isChargeNeedsAction(cobranca: CobrancaRow) {
  const status = normalizeStatus(cobranca.status)
  const syncStatus = normalizeStatus(cobranca.sync_status)

  if (status === "error") return true
  if (syncStatus === "error") return true
  if (isOverdueCharge(cobranca)) return true

  return false
}

function getBusinessName(
  businessMap: Map<string, BusinessRow>,
  businessId: string,
) {
  const business = businessMap.get(businessId)

  return business?.name || business?.nome_responsavel || "Cliente sem nome"
}

function getBusinessEmail(
  businessMap: Map<string, BusinessRow>,
  businessId: string,
) {
  const business = businessMap.get(businessId)

  return business?.email_financeiro || null
}

export async function GET() {
  try {
    const auth = await requireMasterApiUser()

    if (!auth.authorized) {
      return auth.response
    }

    const { data: businessesData, error: businessesError } = await supabaseAdmin
      .from("ci_business")
      .select(
        "id, name, nome_responsavel, email_financeiro, whatsapp, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500)

    if (businessesError) {
      throw businessesError
    }

    const businesses = (businessesData ?? []) as BusinessRow[]
    const businessIds = businesses.map((business) => business.id)

    if (businessIds.length === 0) {
      return NextResponse.json({
        ok: true,
        data: {
          summary: {
            clientesTotal: 0,
            clientesNovos7Dias: 0,
            assinaturasAtivas: 0,
            emTeste: 0,
            aguardandoPagamento: 0,
            bloqueios: 0,
            cobrancasAbertas: 0,
            cobrancasVencidas: 0,
            cobrancasPagas: 0,
            cobrancasErro: 0,
            acaoManual: 0,
          },
          actions: [],
          recentClients: [],
          updatedAt: new Date().toISOString(),
        },
      })
    }

    const [
      assinaturasResult,
      cobrancasResult,
      transactionsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("ci_assinaturas")
        .select(
          "id, business_id, status, plano, valor, trial_started_at, trial_ends_at, proximo_vencimento, payment_method, created_at",
        )
        .in("business_id", businessIds)
        .order("created_at", { ascending: false })
        .limit(500),

      supabaseAdmin
        .from("ci_cobrancas")
        .select(
          "id, business_id, assinatura_id, valor, vencimento, status, sync_status, sync_error, ciclo_tipo, competencia, created_at, pago_em, bling_cobranca_id, bling_link_pagamento",
        )
        .in("business_id", businessIds)
        .order("created_at", { ascending: false })
        .limit(500),

      supabaseAdmin
        .from("ci_transactions")
        .select("business_id")
        .in("business_id", businessIds),
    ])

    if (assinaturasResult.error) {
      throw assinaturasResult.error
    }

    if (cobrancasResult.error) {
      throw cobrancasResult.error
    }

    if (transactionsResult.error) {
      console.error(
        "Erro ao carregar lançamentos no painel da Torre:",
        transactionsResult.error,
      )
    }

    const assinaturas = (assinaturasResult.data ?? []) as AssinaturaRow[]
    const cobrancas = (cobrancasResult.data ?? []) as CobrancaRow[]
    const transactions = (transactionsResult.data ?? []) as TransactionRow[]

    const businessMap = new Map<string, BusinessRow>()
    const assinaturaAtualPorBusiness = new Map<string, AssinaturaRow>()
    const totalLancamentosPorBusiness = new Map<string, number>()

    businesses.forEach((business) => {
      businessMap.set(business.id, business)
    })

    assinaturas.forEach((assinatura) => {
      if (!assinaturaAtualPorBusiness.has(assinatura.business_id)) {
        assinaturaAtualPorBusiness.set(assinatura.business_id, assinatura)
      }
    })

    transactions.forEach((transaction) => {
      const total =
        totalLancamentosPorBusiness.get(transaction.business_id) ?? 0

      totalLancamentosPorBusiness.set(transaction.business_id, total + 1)
    })

    const summary = {
      clientesTotal: businesses.length,
      clientesNovos7Dias: businesses.filter((business) =>
        isRecent(business.created_at),
      ).length,
      assinaturasAtivas: 0,
      emTeste: 0,
      aguardandoPagamento: 0,
      bloqueios: 0,
      cobrancasAbertas: 0,
      cobrancasVencidas: 0,
      cobrancasPagas: 0,
      cobrancasErro: 0,
      acaoManual: 0,
    }

    assinaturaAtualPorBusiness.forEach((assinatura) => {
      const status = normalizeStatus(assinatura.status)
      const totalLancamentos =
        totalLancamentosPorBusiness.get(assinatura.business_id) ?? 0

      if (status === "active") {
        summary.assinaturasAtivas += 1
      }

      if (
        status === "trialing" &&
        !isTrialEnded(assinatura, totalLancamentos)
      ) {
        summary.emTeste += 1
      }

      if (status === "awaiting_payment") {
        summary.aguardandoPagamento += 1
        summary.acaoManual += 1
      }

      if (
        status === "grace_period" ||
        status === "overdue" ||
        status === "blocked" ||
        isTrialEnded(assinatura, totalLancamentos)
      ) {
        summary.bloqueios += 1
        summary.acaoManual += 1
      }
    })

    cobrancas.forEach((cobranca) => {
      const status = normalizeStatus(cobranca.status)

      if (isOpenCharge(cobranca)) {
        summary.cobrancasAbertas += 1
      }

      if (isOverdueCharge(cobranca)) {
        summary.cobrancasVencidas += 1
      }

      if (status === "paid") {
        summary.cobrancasPagas += 1
      }

      if (status === "error" || normalizeStatus(cobranca.sync_status) === "error") {
        summary.cobrancasErro += 1
      }

      if (isChargeNeedsAction(cobranca)) {
        summary.acaoManual += 1
      }
    })

    const chargeActions = cobrancas
      .filter(isChargeNeedsAction)
      .slice(0, 6)
      .map((cobranca) => ({
        id: `cobranca-${cobranca.id}`,
        type: "cobranca",
        title: isOverdueCharge(cobranca)
          ? "Cobrança vencida"
          : "Cobrança com erro",
        cliente: getBusinessName(businessMap, cobranca.business_id),
        email: getBusinessEmail(businessMap, cobranca.business_id),
        description: `Status: ${cobranca.status || "sem status"} · Vencimento: ${
          cobranca.vencimento || "não informado"
        }`,
        href: "/cobrancas",
        createdAt: cobranca.created_at,
      }))

    const assinaturaActions = Array.from(
      assinaturaAtualPorBusiness.values(),
    )
      .filter((assinatura) => {
        const status = normalizeStatus(assinatura.status)
        const totalLancamentos =
          totalLancamentosPorBusiness.get(assinatura.business_id) ?? 0

        return (
          status === "awaiting_payment" ||
          status === "grace_period" ||
          status === "overdue" ||
          status === "blocked" ||
          isTrialEnded(assinatura, totalLancamentos)
        )
      })
      .slice(0, 6)
      .map((assinatura) => {
        const totalLancamentos =
          totalLancamentosPorBusiness.get(assinatura.business_id) ?? 0

        return {
          id: `assinatura-${assinatura.id}`,
          type: "assinatura",
          title: isTrialEnded(assinatura, totalLancamentos)
            ? "Teste encerrado"
            : "Assinatura precisa de atenção",
          cliente: getBusinessName(businessMap, assinatura.business_id),
          email: getBusinessEmail(businessMap, assinatura.business_id),
          description: `Status: ${
            assinatura.status || "sem status"
          } · Próximo vencimento: ${
            assinatura.proximo_vencimento || "não informado"
          }`,
          href: "/assinaturas",
          createdAt: assinatura.created_at,
        }
      })

    const recentClients = businesses.slice(0, 5).map((business) => ({
      id: business.id,
      cliente: business.name || "Cliente sem nome",
      responsavel: business.nome_responsavel,
      email: business.email_financeiro,
      whatsapp: business.whatsapp,
      createdAt: business.created_at,
      href: "/clientes",
    }))

    return NextResponse.json({
      ok: true,
      data: {
        summary,
        actions: [...chargeActions, ...assinaturaActions].slice(0, 8),
        recentClients,
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Erro ao carregar painel da Torre:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Não foi possível carregar o painel da Torre.",
      },
      { status: 500 },
    )
  }
}