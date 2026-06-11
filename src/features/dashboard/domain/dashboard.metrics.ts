// src/features/dashboard/domain/dashboard.metrics.ts

export function calculateDashboardMetrics(
  revenue: number,
  expense: number,
  goal: number
) {

  const profit = revenue - expense

  const percentualMeta =
    goal > 0 ? (revenue / goal) * 100 : 0

  const falta = goal - revenue

  const now = new Date()

  const diaAtual = now.getDate()

  const diasMes = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate()

  // ✅ PADRONIZADO
  const diasRestantes = diasMes - diaAtual + 1

  const mediaAtual =
    diaAtual > 0 ? revenue / diaAtual : 0

  const mediaNecessaria =
    diasRestantes > 0 && falta > 0
      ? falta / diasRestantes
      : 0

  const semanalNecessario =
    mediaNecessaria * 7

  const percentualDespesa =
    revenue > 0 ? (expense / revenue) * 100 : 0

  const lucroPercentual =
    revenue > 0 ? (profit / revenue) * 100 : 0

  const noRitmo =
    mediaAtual >= mediaNecessaria

  let alerta = ""

  if (falta <= 0 && goal > 0) {

    alerta =
      "🔥 Você já ultrapassou sua meta este mês."

  } else if (noRitmo && goal > 0) {

    alerta =
      "✅ Você está no ritmo para atingir sua meta mensal."

  } else if (goal > 0) {

    alerta =
      "⚠ Seu ritmo atual não é suficiente para bater a meta."

  }

  const healthScore =
    revenue === 0
      ? 0
      : Math.min(
          100,
          Math.max(
            0,
            50 +
              percentualMeta * 0.3 +
              (profit > 0 ? 20 : -20)
          )
        )

  return {

    profit,
    percentualMeta,
    falta,

    mediaAtual,
    mediaNecessaria,
    semanalNecessario,

    percentualDespesa,
    lucroPercentual,

    alerta,
    healthScore

  }

}