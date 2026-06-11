// src/features/leads/services/createChallengeLead.ts

export type CreateChallengeLeadInput = {
  nome: string
  email: string
  whatsapp: string
  dificuldade?: string
  origem?: string
}

export type CreateChallengeLeadResult = {
  success: boolean
  leadId?: string
  duplicated?: boolean
  error?: string
}

export async function createChallengeLead(
  input: CreateChallengeLeadInput
): Promise<CreateChallengeLeadResult> {
  const response = await fetch("/api/leads/desafio", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  })

  const data = await response.json()

  if (!response.ok) {
    return {
      success: false,
      error: data?.error || "Não consegui registrar seu cadastro agora.",
    }
  }

  return {
    success: true,
    leadId: data?.leadId,
    duplicated: Boolean(data?.duplicated),
  }
}