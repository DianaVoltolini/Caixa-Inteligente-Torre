// src/app/criador-ebooks/page.tsx
"use client"

import MarkdownEbookEditor from "@/components/ebooks/MarkdownEbookEditor"

import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react"

type Tone = "simples" | "profissional" | "didático" | "persuasivo" | "inspirador"

type FormState = {
  topic: string
  targetAudience: string
  problem: string
  goal: string
  tone: Tone
  chapters: string
  author: string
  cta: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

type ReflectionField = {
  label: string
  helper: string
}

type EbookChapter = {
  title: string
  opening: string
  paragraphs: string[]
  example: string
  practicalAction: string
  reflectionTitle: string
  reflectionIntro: string
  fields: ReflectionField[]
  summary: string
}

type EbookResult = {
  generatedAt: string
  title: string
  subtitle: string
  author: string
  impactPhrase: string
  shortDescription: string
  mainPromise: string
  targetAudience: string
  presentation: string[]
  introduction: string[]
  chapters: EbookChapter[]
  conclusion: string[]
  finalCta: string
  coverVisualSuggestion: string
}

const SAAS_NAME = "Meu Caixa Inteligente"

const initialForm: FormState = {
  topic: "Organização financeira simples para quem trabalha na área da beleza",
  targetAudience:
    "Quem trabalha na área da beleza, atende clientes todos os dias e sente que o dinheiro entra, mas não sabe exatamente quanto sobra no fim do mês.",
  problem:
    "Você trabalha bastante, recebe de clientes, paga contas, compra materiais, movimenta dinheiro todos os dias, mas no fim do mês sente que o dinheiro sumiu e não consegue enxergar quanto realmente ficou.",
  goal:
    "Entender para onde o dinheiro está indo, separar o que entrou, o que saiu e descobrir quanto realmente sobra no fim do mês.",
  tone: "simples",
  chapters: "7",
  author: SAAS_NAME,
  cta:
    "Comece seu teste gratuito no Meu Caixa Inteligente e descubra, em poucos minutos por dia, quanto realmente sobra para você.",
}

const toneOptions: { value: Tone; label: string; description: string }[] = [
  {
    value: "simples",
    label: "Simples",
    description: "Direto, fácil de entender e sem complicação.",
  },
  {
    value: "profissional",
    label: "Profissional",
    description: "Mais sério, confiável e com aparência consultiva.",
  },
  {
    value: "didático",
    label: "Didático",
    description: "Explica passo a passo, ideal para ensinar.",
  },
  {
    value: "persuasivo",
    label: "Persuasivo",
    description: "Focado em desejo, transformação e decisão.",
  },
  {
    value: "inspirador",
    label: "Inspirador",
    description: "Mais emocional, motivador e acolhedor.",
  },
]

const chapterAngles = [
  {
    title: "Entenda o problema antes de tentar resolver",
    focus: "clareza inicial",
  },
  {
    title: "O que entra precisa ser visto com atenção",
    focus: "entradas de dinheiro",
  },
  {
    title: "O que sai também conta a verdade",
    focus: "saídas e gastos",
  },
  {
    title: "A sobra mostra o resultado real",
    focus: "lucro real e sobra",
  },
  {
    title: "Dinheiro do trabalho não pode virar bagunça",
    focus: "separação e organização",
  },
  {
    title: "Rotina simples vence controle complicado",
    focus: "hábito diário",
  },
  {
    title: "Use seus números para decidir melhor",
    focus: "decisão prática",
  },
  {
    title: "Como transformar clareza em ação",
    focus: "aplicação",
  },
  {
    title: "Como manter o controle sem abandonar no caminho",
    focus: "continuidade",
  },
  {
    title: "Seu plano simples para os próximos 7 dias",
    focus: "plano de ação",
  },
  {
    title: "Checklist para sair do escuro financeiro",
    focus: "checklist",
  },
  {
    title: "O próximo passo para cuidar melhor do seu dinheiro",
    focus: "próximo passo",
  },
]

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

function capitalizeFirst(value: string) {
  const text = normalizeText(value)

  if (!text) {
    return ""
  }

  return text.charAt(0).toUpperCase() + text.slice(1)
}

function removeFinalDot(value: string) {
  return normalizeText(value).replace(/[.!?]+$/g, "")
}

function lowerFirst(value: string) {
  const text = removeFinalDot(value)

  if (!text) {
    return ""
  }

  return text.charAt(0).toLowerCase() + text.slice(1)
}

function getToneInstruction(tone: Tone) {
  const instructions: Record<Tone, string> = {
    simples: "com linguagem simples, direta e fácil de aplicar",
    profissional: "com linguagem profissional, segura e objetiva",
    didático: "com linguagem didática, explicando cada passo com clareza",
    persuasivo: "com linguagem persuasiva, mostrando o valor da transformação",
    inspirador: "com linguagem inspiradora, acolhedora e motivadora",
  }

  return instructions[tone]
}

function getTonePersonality(tone: Tone) {
  const personalities: Record<Tone, string> = {
    simples:
      "Sem palavras difíceis, sem fórmulas complicadas e sem aquela sensação de que cuidar do dinheiro é algo distante da sua realidade.",
    profissional:
      "Com uma visão objetiva, organizada e segura para ajudar você a tomar decisões com mais tranquilidade.",
    didático:
      "Passo a passo, com explicações claras, exemplos simples e espaços para você aplicar na sua própria rotina.",
    persuasivo:
      "Com foco na mudança que você quer sentir: mais clareza, mais controle e menos sensação de trabalhar no escuro.",
    inspirador:
      "Com acolhimento, leveza e incentivo para você começar mesmo que ainda não tenha tudo organizado.",
  }

  return personalities[tone]
}

function getTitleFromForm(topic: string, problem: string, goal: string) {
  const cleanTopic = capitalizeFirst(topic)
  const cleanProblem = lowerFirst(problem)
  const cleanGoal = lowerFirst(goal)

  if (
    cleanProblem.includes("dinheiro") &&
    (cleanProblem.includes("sumiu") ||
      cleanProblem.includes("some") ||
      cleanProblem.includes("sobra"))
  ) {
    return "O dinheiro entra, mas não sobra?"
  }

  if (cleanGoal.includes("lucro") || cleanGoal.includes("sobra")) {
    return "Descubra quanto realmente sobra para você"
  }

  if (cleanTopic.length <= 52) {
    return cleanTopic
  }

  return "Guia prático para organizar melhor seu dinheiro"
}

function getSubtitleFromForm(topic: string, targetAudience: string, goal: string) {
  const cleanTopic = lowerFirst(topic)
  const cleanAudience = lowerFirst(targetAudience)
  const cleanGoal = lowerFirst(goal)

  return `Um guia simples para você aplicar ${cleanTopic} na sua rotina e conseguir ${cleanGoal}.`
}

function getImpactPhrase(goal: string, tone: Tone) {
  const cleanGoal = lowerFirst(goal)

  if (tone === "inspirador") {
    return `Você não precisa resolver tudo hoje. Precisa apenas começar a enxergar seu dinheiro com mais clareza para ${cleanGoal}.`
  }

  if (tone === "persuasivo") {
    return `Pare de trabalhar no escuro e comece a usar seus números para ${cleanGoal}.`
  }

  if (tone === "profissional") {
    return `Clareza financeira para transformar rotina, decisões e resultado.`
  }

  if (tone === "didático") {
    return `Um passo de cada vez para entender o dinheiro, organizar sua rotina e ${cleanGoal}.`
  }

  return `Clareza financeira simples para você entender o que entra, o que sai e o que realmente sobra.`
}

function getChapterTitle(index: number, topic: string, goal: string) {
  const angle = chapterAngles[index]

  if (!angle) {
    return `Etapa ${index + 1}: coloque em prática`
  }

  if (index === 0) {
    return `Antes de tudo: o que ${lowerFirst(topic)} muda na sua rotina`
  }

  if (index === 3 && goal) {
    return `Como enxergar o resultado que você quer alcançar`
  }

  return angle.title
}

function createReflectionFields(index: number, topic: string, goal: string): ReflectionField[] {
  const cleanTopic = lowerFirst(topic)
  const cleanGoal = lowerFirst(goal)

  const fieldGroups: ReflectionField[][] = [
    [
      {
        label: "O que mais incomoda você hoje?",
        helper: "Escreva a principal dificuldade que aparece na sua rotina.",
      },
      {
        label: "O que você já tentou fazer para resolver?",
        helper: "Anote tentativas, mesmo que não tenham funcionado.",
      },
      {
        label: "O que precisa ficar mais claro para você?",
        helper: `Pense no que falta entender sobre ${cleanTopic}.`,
      },
    ],
    [
      {
        label: "Quanto dinheiro entrou hoje?",
        helper: "Some Pix, cartão, dinheiro, transferência e qualquer recebimento.",
      },
      {
        label: "De onde veio esse dinheiro?",
        helper: "Anote os serviços, atendimentos ou vendas que geraram entrada.",
      },
      {
        label: "Qual entrada você quase esqueceu de registrar?",
        helper: "Valores pequenos também contam.",
      },
    ],
    [
      {
        label: "Quanto dinheiro saiu hoje?",
        helper: "Anote compras, contas, materiais, taxas e pagamentos.",
      },
      {
        label: "Qual gasto mais pesou?",
        helper: "Escreva o gasto que mais chamou sua atenção.",
      },
      {
        label: "Qual saída poderia ser melhor planejada?",
        helper: "Pense em compras feitas na correria ou sem previsão.",
      },
    ],
    [
      {
        label: "Total que entrou no período",
        helper: "Some o dinheiro recebido no dia, semana ou mês.",
      },
      {
        label: "Total que saiu no período",
        helper: "Some todos os pagamentos e gastos.",
      },
      {
        label: "Quanto realmente sobrou?",
        helper: "Faça a conta: entradas menos saídas.",
      },
    ],
    [
      {
        label: "Quais gastos são do trabalho?",
        helper: "Anote tudo que existe para manter seus atendimentos funcionando.",
      },
      {
        label: "Quais gastos são pessoais?",
        helper: "Anote contas e compras que não pertencem ao trabalho.",
      },
      {
        label: "Qual valor você gostaria de retirar para você?",
        helper: "Comece com um valor possível, mesmo que pequeno.",
      },
    ],
    [
      {
        label: "Qual horário você pode reservar para registrar?",
        helper: "Exemplo: depois do último atendimento do dia.",
      },
      {
        label: "O que você vai registrar todos os dias?",
        helper: "Exemplo: o que entrou, o que saiu e quanto sobrou.",
      },
      {
        label: "Qual compromisso você assume por 7 dias?",
        helper: "Escreva algo simples e possível.",
      },
    ],
    [
      {
        label: "O que seus números mostraram?",
        helper: "Escreva uma descoberta importante.",
      },
      {
        label: "Qual decisão você pode tomar com base nisso?",
        helper: "Exemplo: ajustar preço, reduzir gasto ou separar dinheiro.",
      },
      {
        label: "Qual será seu primeiro passo?",
        helper: "Escolha uma ação simples para começar.",
      },
    ],
    [
      {
        label: "O que você quer mudar primeiro?",
        helper: `Escolha uma ação ligada ao objetivo de ${cleanGoal}.`,
      },
      {
        label: "O que você consegue fazer ainda esta semana?",
        helper: "Não precisa ser grande. Precisa ser possível.",
      },
      {
        label: "Como o Meu Caixa Inteligente pode ajudar?",
        helper: "Exemplo: registrar entradas, saídas e sobra todos os dias.",
      },
    ],
    [
      {
        label: "O que pode fazer você abandonar o controle?",
        helper: "Exemplo: correria, cansaço, esquecimento ou falta de hábito.",
      },
      {
        label: "O que você vai fazer nos dias difíceis?",
        helper: "Exemplo: registrar só o básico para não perder o ritmo.",
      },
      {
        label: "Qual lembrete você pode criar?",
        helper: "Exemplo: alarme no celular ou lembrete após o expediente.",
      },
    ],
    [
      {
        label: "Dia 1: qual será sua primeira ação?",
        helper: "Escolha uma ação simples para começar.",
      },
      {
        label: "Dia 3: o que você quer revisar?",
        helper: "Olhe para entradas, saídas e sobra.",
      },
      {
        label: "Dia 7: que resultado você quer enxergar?",
        helper: "Escreva o que você espera entender melhor.",
      },
    ],
    [
      {
        label: "Vou registrar minhas entradas?",
        helper: "Escreva quando vai começar.",
      },
      {
        label: "Vou registrar minhas saídas?",
        helper: "Escreva quando vai começar.",
      },
      {
        label: "Vou olhar minha sobra semanal?",
        helper: "Escolha um dia da semana para revisar.",
      },
    ],
    [
      {
        label: "Qual é seu próximo passo?",
        helper: "Escreva a ação mais importante depois desta leitura.",
      },
      {
        label: "O que você quer acompanhar no Meu Caixa Inteligente?",
        helper: "Exemplo: entradas, saídas, sobra e meta diária.",
      },
      {
        label: "Qual mudança você quer sentir no fim do mês?",
        helper: "Escreva a transformação esperada.",
      },
    ],
  ]

  return fieldGroups[index] || fieldGroups[0]
}

function createChapter(params: {
  index: number
  topic: string
  targetAudience: string
  problem: string
  goal: string
  tone: Tone
  generationNumber: number
}): EbookChapter {
  const { index, topic, targetAudience, problem, goal, tone, generationNumber } = params

  const cleanTopic = lowerFirst(topic)
  const cleanAudience = lowerFirst(targetAudience)
  const cleanProblem = lowerFirst(problem)
  const cleanGoal = lowerFirst(goal)
  const tonePersonality = getTonePersonality(tone)
  const angle = chapterAngles[index] || chapterAngles[chapterAngles.length - 1]
  const title = getChapterTitle(index, topic, goal)

  const variation = generationNumber % 3

  const openings = [
    `Quando o assunto é ${cleanTopic}, o primeiro passo é parar de olhar apenas para o movimento e começar a olhar para o resultado. Você pode trabalhar bastante, atender bem e ainda assim terminar o mês sem entender o que aconteceu com o dinheiro.`,
    `Antes de tentar resolver tudo de uma vez, olhe para sua realidade com calma. Se hoje você sente que ${cleanProblem}, este capítulo vai ajudar você a organizar esse ponto de forma mais simples.`,
    `Este capítulo existe para trazer clareza sobre ${angle.focus}. A ideia não é complicar sua rotina, mas mostrar como você pode enxergar melhor o dinheiro que passa pela sua mão todos os dias.`,
  ]

  const paragraphGroups = [
    [
      `A sua rotina não precisa virar uma planilha difícil para começar a funcionar melhor. O que você precisa é de um jeito simples de registrar o que acontece no dia a dia e transformar isso em clareza.`,
      `O problema de não acompanhar os números é que tudo começa a se misturar. O dinheiro entra, você paga algo, compra material, resolve uma urgência e, quando percebe, não sabe mais quanto realmente ficou.`,
      `É por isso que o ${SAAS_NAME} trabalha com uma lógica simples: entrou, saiu, sobrou. Essa lógica ajuda você a entender sua realidade sem precisar dominar termos financeiros.`,
    ],
    [
      `Para ${cleanAudience}, o controle precisa caber na rotina. Se for difícil demais, você começa animada, mas abandona em poucos dias.`,
      `A proposta aqui é diferente. Você vai olhar para poucos números, mas números que realmente ajudam: o que entrou, o que saiu e quanto sobrou.`,
      `Com essa clareza, fica mais fácil tomar decisões sobre preço, compras, gastos, metas e retirada para você.`,
    ],
    [
      `Se o seu objetivo é ${cleanGoal}, você precisa transformar a informação em atitude. Não basta saber que o dinheiro está confuso. É preciso criar um pequeno hábito para acompanhar melhor.`,
      `Esse hábito começa com registros simples. Um recebimento anotado. Um gasto registrado. Uma sobra conferida no fim do dia. Aos poucos, isso muda a forma como você enxerga seu trabalho.`,
      `${tonePersonality}`,
    ],
  ]

  const examples = [
    `Imagine que hoje você recebeu R$ 320,00 em atendimentos. No mesmo dia, comprou material, pagou uma conta e usou parte do dinheiro em uma despesa pessoal. Sem registro, fica parecendo que o dinheiro sumiu. Com registro, você consegue ver o caminho que ele fez.`,
    `Pense em uma semana com vários atendimentos. O movimento parece bom, mas no fim sobra pouco. Quando você olha para entradas e saídas, pode descobrir que o problema não era falta de cliente, e sim gasto sem acompanhamento ou preço que precisa ser revisto.`,
    `Você pode achar que um serviço é muito lucrativo porque o valor recebido parece alto. Mas, quando coloca na conta o material, a taxa, o tempo e os gastos envolvidos, percebe que a sobra real é menor do que imaginava.`,
  ]

  const practicalActions = [
    `Hoje, registre apenas três informações: quanto entrou, quanto saiu e quanto sobrou. Não tente organizar tudo de uma vez.`,
    `Escolha um período simples, como hoje ou esta semana, e acompanhe seus números sem se cobrar perfeição.`,
    `Abra o ${SAAS_NAME} e registre sua movimentação do dia. A meta é criar clareza, não complicação.`,
  ]

  const summaries = [
    `Você não precisa adivinhar o que acontece com seu dinheiro. Precisa enxergar o caminho que ele faz.`,
    `Quando você registra o básico, começa a entender melhor sua rotina e toma decisões com mais segurança.`,
    `Clareza financeira começa pequena, mas muda a forma como você olha para seu trabalho.`,
  ]

  return {
    title,
    opening: openings[variation],
    paragraphs: paragraphGroups[variation],
    example: examples[(index + variation) % examples.length],
    practicalAction: practicalActions[(index + variation) % practicalActions.length],
    reflectionTitle: `Agora aplique isso na sua realidade`,
    reflectionIntro:
      "Preencha os campos abaixo com as suas informações. Esse espaço transforma a leitura em um diagnóstico simples para você.",
    fields: createReflectionFields(index, topic, goal),
    summary: summaries[(index + variation) % summaries.length],
  }
}

async function generateFullEbook(
  form: FormState,
  generationNumber: number,
): Promise<EbookResult> {
  const topic = capitalizeFirst(form.topic)
  const targetAudience = normalizeText(form.targetAudience)
  const problem = normalizeText(form.problem)
  const goal = normalizeText(form.goal)
  const author = normalizeText(form.author) || SAAS_NAME
  const cta = normalizeText(form.cta)
  const toneInstruction = getToneInstruction(form.tone)
  const tonePersonality = getTonePersonality(form.tone)
  const chapterQuantity = Math.min(Math.max(Number(form.chapters) || 7, 3), 12)

  const title = getTitleFromForm(topic, problem, goal)
  const subtitle = getSubtitleFromForm(topic, targetAudience, goal)
  const impactPhrase = getImpactPhrase(goal, form.tone)

  const chapters = Array.from({ length: chapterQuantity }, (_, index) =>
    createChapter({
      index,
      topic,
      targetAudience,
      problem,
      goal,
      tone: form.tone,
      generationNumber,
    }),
  )

  return {
    generatedAt: new Date().toLocaleString("pt-BR"),
    title,
    subtitle,
    author,
    impactPhrase,
    shortDescription: `Este e-book foi criado para ajudar você a aplicar ${lowerFirst(
      topic,
    )} de um jeito prático, leve e sem termos complicados.`,
    mainPromise: `Ao final da leitura, você terá mais clareza para ${lowerFirst(
      goal,
    )}.`,
    targetAudience,
    presentation: [
      `Este material foi criado para você que se identifica com esta realidade: ${lowerFirst(
        targetAudience,
      )}.`,
      `A dor que vamos tratar aqui é direta: ${lowerFirst(problem)}.`,
      `A proposta deste e-book não é complicar sua rotina, nem fazer você virar especialista em finanças. A proposta é ajudar você a enxergar melhor o dinheiro do seu trabalho.`,
      `O conteúdo foi escrito ${toneInstruction}. ${tonePersonality}`,
      `Durante a leitura, você encontrará espaços para preencher suas próprias informações. Esses campos ajudam você a transformar o e-book em um diagnóstico simples da sua rotina financeira.`,
      `O ${SAAS_NAME} aparece como próximo passo porque ele foi criado exatamente para simplificar esse controle: registrar o que entrou, o que saiu e mostrar quanto sobrou.`,
    ],
    introduction: [
      `Se você chegou até este material, provavelmente quer entender melhor ${lowerFirst(
        topic,
      )}. E isso já mostra uma coisa importante: você não quer mais trabalhar sem clareza.`,
      `Quando você sente que ${lowerFirst(
        problem,
      )}, a rotina fica mais pesada. Não é só sobre dinheiro. É sobre insegurança, cansaço mental e a sensação de que todo esforço não aparece no fim do mês.`,
      `Muitas vezes, a primeira reação é pensar que precisa vender mais, atender mais, fazer mais promoções ou trabalhar ainda mais horas. Só que, antes disso, você precisa entender o que já acontece com o dinheiro que entra hoje.`,
      `É aqui que entra uma lógica simples: entrou, saiu, sobrou. Quando você começa a acompanhar esses três pontos, o dinheiro deixa de ser uma confusão e começa a virar informação.`,
      `Este e-book foi criado pelo ${SAAS_NAME} para ajudar você a dar esse primeiro passo com leveza. Sem linguagem difícil. Sem controle complicado. Sem cobrança para fazer tudo perfeito.`,
      `A partir de agora, leia cada capítulo pensando na sua realidade. Sempre que aparecer um espaço para preencher, use suas próprias informações. É isso que vai fazer o material parecer feito para você, porque ele será preenchido com a sua rotina.`,
    ],
    chapters,
    conclusion: [
      `Agora você tem uma visão mais clara sobre ${lowerFirst(topic)} e sobre como isso se conecta com o seu dia a dia.`,
      `A mudança não começa quando tudo está perfeito. Ela começa quando você decide olhar para o que acontece hoje: quanto entrou, quanto saiu e quanto sobrou.`,
      `Talvez você perceba que está vendendo bem, mas gastando sem acompanhar. Talvez descubra que precisa separar melhor o dinheiro pessoal do dinheiro do trabalho. Talvez veja que um serviço precisa ser revisto. Cada descoberta é um passo importante.`,
      `O mais importante é não deixar essa clareza parada. Use as informações que você preencheu ao longo do e-book para tomar uma primeira decisão simples.`,
      `E, para manter esse controle no dia a dia, use o ${SAAS_NAME}. Ele foi pensado para caber na rotina de quem atende clientes, trabalha muito e precisa de clareza sem complicação.`,
    ],
    finalCta: cta,
    coverVisualSuggestion:
      "Capa em estilo limpo e premium, com fundo claro, detalhes em azul profundo, título grande, subtítulo objetivo e elementos visuais que remetam a dinheiro, agenda, atendimento, rotina e clareza. O visual deve transmitir confiança, simplicidade e alívio mental.",
  }
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {}

  if (!normalizeText(form.topic)) {
    errors.topic = "Informe o tema do e-book."
  }

  if (!normalizeText(form.targetAudience)) {
    errors.targetAudience = "Informe para quem esse e-book será criado."
  }

  if (!normalizeText(form.problem)) {
    errors.problem = "Informe o principal problema que o e-book resolve."
  }

  if (!normalizeText(form.goal)) {
    errors.goal = "Informe o objetivo do e-book."
  }

  if (!normalizeText(form.author)) {
    errors.author = "Informe o nome do autor ou da marca."
  }

  if (!normalizeText(form.cta)) {
    errors.cta = "Informe a chamada para ação final."
  }

  const chaptersNumber = Number(form.chapters)

  if (!form.chapters || Number.isNaN(chaptersNumber)) {
    errors.chapters = "Informe a quantidade de capítulos."
  } else if (chaptersNumber < 3) {
    errors.chapters = "Use pelo menos 3 capítulos."
  } else if (chaptersNumber > 12) {
    errors.chapters = "Use no máximo 12 capítulos para manter o e-book objetivo."
  }

  return errors
}

function formatEbookAsText(result: EbookResult) {
  const chapters = result.chapters
    .map((chapter, index) => {
      const paragraphs = chapter.paragraphs.join("\n\n")
      const fields = chapter.fields
        .map(
          (field) =>
            `${field.label}\n${field.helper}\nResposta: ________________________________`,
        )
        .join("\n\n")

      return `CAPÍTULO ${index + 1}
${chapter.title}

${chapter.opening}

${paragraphs}

Exemplo prático:
${chapter.example}

Aplicação simples:
${chapter.practicalAction}

${chapter.reflectionTitle}
${chapter.reflectionIntro}

${fields}

Resumo do capítulo:
${chapter.summary}`
    })
    .join("\n\n---\n\n")

  return `${result.title}
${result.subtitle}

Criado por: ${result.author}
Gerado em: ${result.generatedAt}

${result.impactPhrase}

APRESENTAÇÃO

${result.presentation.join("\n\n")}

INTRODUÇÃO

${result.introduction.join("\n\n")}

${chapters}

CONCLUSÃO

${result.conclusion.join("\n\n")}

PRÓXIMO PASSO

${result.finalCta}`
}

function Field({
  label,
  htmlFor,
  helper,
  error,
  children,
}: {
  label: string
  htmlFor: string
  helper?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-black text-[#0B1020]"
      >
        {label}
      </label>

      {helper ? (
        <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
      ) : null}

      <div className="mt-2">{children}</div>

      {error ? (
        <p className="mt-2 rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function FormCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[30px] border border-[#DFE7F7] bg-white p-5 shadow-[0_18px_50px_rgba(0,33,152,0.06)] sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-black text-[#0B1020]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>

      {children}
    </section>
  )
}

function EbookPage({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`ebook-page mx-auto mb-8 min-h-[1040px] w-full max-w-[794px] overflow-hidden rounded-[34px] border border-[#DFE7F7] bg-white shadow-[0_24px_80px_rgba(0,33,152,0.10)] ${className}`}
    >
      {children}
    </section>
  )
}

function EbookHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <header className="relative overflow-hidden border-b border-[#DFE7F7] bg-[#F8FBFF] px-9 py-8">
      <div className="absolute right-[-80px] top-[-110px] h-56 w-56 rounded-full bg-blue-100" />
      <div className="relative">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#002198]">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-black leading-tight text-[#0B1020]">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
    </header>
  )
}

function Paragraphs({ items }: { items: string[] }) {
  return (
    <div className="space-y-5 text-[15px] leading-8 text-slate-700">
      {items.map((item, index) => (
        <p key={`${item.slice(0, 20)}-${index}`}>{item}</p>
      ))}
    </div>
  )
}

function FillableBox({
  title,
  intro,
  fields,
}: {
  title: string
  intro: string
  fields: ReflectionField[]
}) {
  return (
    <div className="avoid-break mt-7 overflow-hidden rounded-[30px] border border-[#DFE7F7] bg-[#F8FBFF]">
      <div className="border-b border-[#DFE7F7] bg-white px-6 py-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#002198]">
          Espaço para preencher
        </p>
        <h3 className="mt-2 text-xl font-black text-[#0B1020]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{intro}</p>
      </div>

      <div className="space-y-4 p-6">
        {fields.map((field, index) => (
          <div
            key={`${field.label}-${index}`}
            className="rounded-[22px] border border-[#DFE7F7] bg-white p-5"
          >
            <label className="block text-sm font-black text-[#0B1020]">
              {field.label}
            </label>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {field.helper}
            </p>
            <div className="mt-5 h-12 rounded-2xl border border-dashed border-[#B9C8EA] bg-[#F8FBFF]" />
          </div>
        ))}
      </div>
    </div>
  )
}

function BrandBadge() {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-[#DFE7F7] bg-white px-4 py-2 shadow-sm">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#002198] text-xs font-black text-white">
        MCI
      </span>
      <span className="text-xs font-black uppercase tracking-[0.16em] text-[#002198]">
        Meu Caixa Inteligente
      </span>
    </div>
  )
}

export default function CriadorEbooksPage() {
  const [editorMode, setEditorMode] = useState<"markdown" | "form">("markdown")
  const [form, setForm] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [result, setResult] = useState<EbookResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [generationNumber, setGenerationNumber] = useState(0)
  const resultRef = useRef<HTMLDivElement | null>(null)

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: undefined,
    }))

    setFeedback("")
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateForm(form)
    setErrors(validationErrors)
    setFeedback("")

    if (Object.keys(validationErrors).length > 0) {
      setFeedback("Preencha os campos destacados para gerar o e-book completo.")
      return
    }

    const nextGenerationNumber = generationNumber + 1

    setGenerationNumber(nextGenerationNumber)
    setIsGenerating(true)
    setResult(null)

    window.setTimeout(async () => {
      const generated = await generateFullEbook(form, nextGenerationNumber)

      setResult(generated)
      setIsGenerating(false)
      setFeedback("E-book completo gerado com base nas informações preenchidas.")

      window.setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }, 100)
    }, 700)
  }

  async function handleCopyResult() {
    if (!result) {
      return
    }

    const text = formatEbookAsText(result)

    try {
      await navigator.clipboard.writeText(text)
      setFeedback("Conteúdo copiado. Agora é só colar onde quiser.")
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.style.position = "fixed"
      textarea.style.left = "-9999px"
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setFeedback("Conteúdo copiado. Agora é só colar onde quiser.")
    }
  }

  function handlePrint() {
    if (!result) {
      setFeedback("Gere o e-book antes de salvar em PDF.")
      return
    }

    setFeedback("Na janela de impressão, escolha a opção Salvar como PDF.")
    window.setTimeout(() => {
      window.print()
    }, 150)
  }

  function handleClear() {
    setForm(initialForm)
    setErrors({})
    setResult(null)
    setFeedback("")
  }

  if (editorMode === "markdown") {
    return <MarkdownEbookEditor onSwitchMode={() => setEditorMode("form")} />
  }

  return (
    <main className="min-h-screen bg-[#F8FBFF] text-[#0B1020]">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html,
          body {
            background: #ffffff !important;
          }

          .no-print {
            display: none !important;
          }

          .print-area {
            display: block !important;
          }

          .ebook-page {
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            margin-bottom: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            page-break-after: always;
            break-after: page;
          }

          .ebook-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          .print-wrapper {
            padding: 0 !important;
            background: #ffffff !important;
          }

          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="no-print mx-auto flex max-w-7xl justify-end px-4 pt-4 sm:px-6">
        <button type="button" onClick={() => setEditorMode("markdown")} className="rounded-2xl border border-[#DFE7F7] bg-white px-4 py-3 text-sm font-semibold text-[#002198]">Diagramar conteúdo em Markdown</button>
      </div>
      <section className="no-print relative overflow-hidden border-b border-[#DFE7F7] bg-white">
        <div className="absolute left-[-120px] top-[-160px] h-[420px] w-[420px] rounded-full bg-blue-100 blur-3xl" />
        <div className="absolute right-[-120px] top-10 h-[460px] w-[460px] rounded-full bg-indigo-100 blur-3xl" />
        <div className="absolute bottom-[-180px] left-1/2 h-[360px] w-[360px] rounded-full bg-sky-100 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-4xl">
            <BrandBadge />

            <h1 className="mt-7 text-4xl font-black tracking-tight text-[#0B1020] sm:text-5xl lg:text-6xl">
              Criador de e-book do Meu Caixa Inteligente
            </h1>

            <p className="mt-5 max-w-3xl text-xl font-semibold leading-8 text-slate-800">
              Gere um material bonito, prático e personalizado conforme as
              informações preenchidas.
            </p>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              Cada clique no botão gera um novo e-book usando os campos atuais
              do formulário: tema, público, problema, objetivo, tom de voz,
              marca e chamada final.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[30px] border border-[#DFE7F7] bg-white/90 p-5 shadow-[0_18px_50px_rgba(0,33,152,0.06)]">
              <p className="text-3xl font-black text-[#002198]">1</p>
              <h2 className="mt-2 font-black text-[#0B1020]">
                Conteúdo personalizado
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                O e-book muda conforme o que foi preenchido.
              </p>
            </div>

            <div className="rounded-[30px] border border-[#DFE7F7] bg-white/90 p-5 shadow-[0_18px_50px_rgba(0,33,152,0.06)]">
              <p className="text-3xl font-black text-[#002198]">2</p>
              <h2 className="mt-2 font-black text-[#0B1020]">
                Exercícios práticos
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                A pessoa leitora preenche dados da própria realidade.
              </p>
            </div>

            <div className="rounded-[30px] border border-[#DFE7F7] bg-white/90 p-5 shadow-[0_18px_50px_rgba(0,33,152,0.06)]">
              <p className="text-3xl font-black text-[#002198]">3</p>
              <h2 className="mt-2 font-black text-[#0B1020]">
                Pronto para PDF
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Visual em HTML preparado para salvar como PDF pelo navegador.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="no-print mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormCard
            title="Informações principais"
            description="Tudo que você escrever aqui será usado na criação do e-book."
          >
            <div className="space-y-5">
              <Field
                label="Tema do e-book"
                htmlFor="topic"
                helper="Exemplo: organização financeira simples para profissionais da beleza."
                error={errors.topic}
              >
                <input
                  id="topic"
                  name="topic"
                  value={form.topic}
                  onChange={handleChange}
                  placeholder="Digite o tema principal do e-book"
                  className="w-full rounded-2xl border border-[#DFE7F7] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#002198] focus:ring-4 focus:ring-blue-100"
                />
              </Field>

              <Field
                label="Público-alvo"
                htmlFor="targetAudience"
                helper="Evite direcionar para ele ou ela. Use você, quem trabalha, quem atende, sua rotina."
                error={errors.targetAudience}
              >
                <textarea
                  id="targetAudience"
                  name="targetAudience"
                  value={form.targetAudience}
                  onChange={handleChange}
                  placeholder="Exemplo: quem trabalha na área da beleza e atende clientes todos os dias"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-[#DFE7F7] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#002198] focus:ring-4 focus:ring-blue-100"
                />
              </Field>

              <Field
                label="Principal problema que o e-book resolve"
                htmlFor="problem"
                helper="Escreva como se estivesse falando diretamente com a pessoa que vai ler."
                error={errors.problem}
              >
                <textarea
                  id="problem"
                  name="problem"
                  value={form.problem}
                  onChange={handleChange}
                  placeholder="Exemplo: você trabalha muito, mas sente que o dinheiro some"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-[#DFE7F7] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#002198] focus:ring-4 focus:ring-blue-100"
                />
              </Field>

              <Field
                label="Objetivo do e-book"
                htmlFor="goal"
                helper="Escreva o resultado que a pessoa deve alcançar depois da leitura."
                error={errors.goal}
              >
                <textarea
                  id="goal"
                  name="goal"
                  value={form.goal}
                  onChange={handleChange}
                  placeholder="Exemplo: entender para onde o dinheiro está indo"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-[#DFE7F7] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#002198] focus:ring-4 focus:ring-blue-100"
                />
              </Field>
            </div>
          </FormCard>

          <FormCard
            title="Formato e chamada final"
            description="Defina o estilo do conteúdo e o próximo passo que aparecerá no final do e-book."
          >
            <div className="space-y-5">
              <Field
                label="Tom de voz desejado"
                htmlFor="tone"
                helper="Escolha como o e-book deve conversar com quem lê."
              >
                <select
                  id="tone"
                  name="tone"
                  value={form.tone}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-[#DFE7F7] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#002198] focus:ring-4 focus:ring-blue-100"
                >
                  {toneOptions.map((tone) => (
                    <option key={tone.value} value={tone.value}>
                      {tone.label}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {
                    toneOptions.find((tone) => tone.value === form.tone)
                      ?.description
                  }
                </p>
              </Field>

              <Field
                label="Quantidade de capítulos"
                htmlFor="chapters"
                helper="Recomendado: 7 capítulos para material de entrada."
                error={errors.chapters}
              >
                <input
                  id="chapters"
                  name="chapters"
                  value={form.chapters}
                  onChange={handleChange}
                  type="number"
                  min={3}
                  max={12}
                  placeholder="Exemplo: 7"
                  className="w-full rounded-2xl border border-[#DFE7F7] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#002198] focus:ring-4 focus:ring-blue-100"
                />
              </Field>

              <Field
                label="Nome do autor ou marca"
                htmlFor="author"
                helper="Para este projeto, mantenha Meu Caixa Inteligente."
                error={errors.author}
              >
                <input
                  id="author"
                  name="author"
                  value={form.author}
                  onChange={handleChange}
                  placeholder="Meu Caixa Inteligente"
                  className="w-full rounded-2xl border border-[#DFE7F7] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#002198] focus:ring-4 focus:ring-blue-100"
                />
              </Field>

              <Field
                label="Chamada para ação final"
                htmlFor="cta"
                helper="Esse texto aparecerá no encerramento do e-book."
                error={errors.cta}
              >
                <textarea
                  id="cta"
                  name="cta"
                  value={form.cta}
                  onChange={handleChange}
                  placeholder="Exemplo: comece seu teste gratuito"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-[#DFE7F7] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#002198] focus:ring-4 focus:ring-blue-100"
                />
              </Field>

              {feedback ? (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#002198]">
                  {feedback}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#002198] px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-[#00176b] disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  {isGenerating
                    ? "Gerando e-book com os dados preenchidos..."
                    : "Gerar e-book completo em PDF"}
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isGenerating}
                  className="inline-flex items-center justify-center rounded-2xl border border-[#DFE7F7] bg-white px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Restaurar padrão
                </button>
              </div>
            </div>
          </FormCard>
        </form>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[34px] border border-[#DFE7F7] bg-white p-5 shadow-[0_24px_80px_rgba(0,33,152,0.10)] sm:p-6">
            <BrandBadge />

            <h2 className="mt-5 text-2xl font-black text-[#0B1020]">
              {result ? "Seu e-book está pronto" : "O e-book aparecerá aqui"}
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              {result
                ? "Revise a prévia em HTML, copie o conteúdo ou salve como PDF pelo navegador."
                : "Depois de preencher o formulário, a página vai gerar capa, apresentação, introdução, capítulos, exercícios, conclusão e chamada final."}
            </p>

            {result ? (
              <div className="mt-5 rounded-[24px] bg-[#F8FBFF] p-4 text-sm leading-6 text-slate-600">
                <strong className="text-[#0B1020]">Última geração:</strong>{" "}
                {result.generatedAt}
              </div>
            ) : null}

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={handlePrint}
                disabled={!result}
                className="inline-flex items-center justify-center rounded-2xl bg-[#002198] px-5 py-4 text-sm font-black text-white transition hover:bg-[#00176b] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Baixar PDF
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={!result}
                className="inline-flex items-center justify-center rounded-2xl border border-[#DFE7F7] bg-[#F8FBFF] px-5 py-4 text-sm font-black text-[#002198] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Imprimir ou salvar em PDF
              </button>

              <button
                type="button"
                onClick={handleCopyResult}
                disabled={!result}
                className="inline-flex items-center justify-center rounded-2xl border border-[#DFE7F7] bg-white px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Copiar conteúdo
              </button>

              <button
                type="button"
                onClick={() => {
                  setResult(null)
                  setFeedback("Ajuste as informações e gere novamente.")
                }}
                disabled={!result}
                className="inline-flex items-center justify-center rounded-2xl border border-[#DFE7F7] bg-white px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Gerar novamente
              </button>
            </div>

            <div className="mt-6 rounded-[26px] bg-[#F8FBFF] p-5">
              <h3 className="font-black text-[#0B1020]">
                Correção aplicada
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                O e-book agora não fica preso em textos fixos. A geração usa o
                conteúdo preenchido no formulário e muda conforme os dados
                informados.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section
        ref={resultRef}
        className="print-wrapper print-area mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8"
      >
        {result ? (
          <div id="ebook-print-area">
            <div className="no-print mb-6 rounded-[28px] border border-[#DFE7F7] bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-600">
                Prévia em HTML do e-book. O visual abaixo será usado na
                impressão/salvamento em PDF.
              </p>
            </div>

            <EbookPage className="relative bg-[#F8FBFF]">
              <div className="absolute right-[-150px] top-[-150px] h-[420px] w-[420px] rounded-full bg-blue-200" />
              <div className="absolute bottom-[-170px] left-[-170px] h-[420px] w-[420px] rounded-full bg-indigo-100" />
              <div className="absolute bottom-[160px] right-[70px] h-36 w-36 rounded-full border-[18px] border-white/70" />

              <div className="relative flex min-h-[1040px] flex-col justify-between p-10">
                <div>
                  <BrandBadge />

                  <div className="mt-24 max-w-2xl">
                    <p className="text-sm font-black uppercase tracking-[0.24em] text-[#002198]">
                      Guia prático gratuito
                    </p>

                    <h1 className="mt-6 text-6xl font-black leading-[0.96] tracking-tight text-[#0B1020]">
                      {result.title}
                    </h1>

                    <p className="mt-8 text-2xl font-semibold leading-9 text-slate-700">
                      {result.subtitle}
                    </p>

                    <div className="mt-10 h-2 w-32 rounded-full bg-[#002198]" />

                    <p className="mt-8 max-w-xl text-lg font-black leading-8 text-[#002198]">
                      {result.impactPhrase}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_0.75fr]">
                  <div className="rounded-[30px] border border-[#DFE7F7] bg-white/95 p-6">
                    <p className="text-sm font-semibold text-slate-500">
                      Criado por
                    </p>
                    <p className="mt-2 text-2xl font-black text-[#0B1020]">
                      {result.author}
                    </p>
                  </div>

                  <div className="rounded-[30px] bg-[#002198] p-6 text-white">
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-100">
                      método simples
                    </p>
                    <p className="mt-2 text-xl font-black">
                      Entrou · Saiu · Sobrou
                    </p>
                  </div>
                </div>
              </div>
            </EbookPage>

            <EbookPage>
              <EbookHeader
                eyebrow="Apresentação"
                title="Este material foi feito para você"
                description="A ideia é simples: olhar para seu dinheiro com mais clareza, sem complicar sua rotina."
              />

              <div className="p-9">
                <div className="rounded-[30px] bg-[#F8FBFF] p-6">
                  <h3 className="text-xl font-black text-[#0B1020]">
                    Para quem é este e-book
                  </h3>
                  <p className="mt-3 text-[15px] leading-8 text-slate-700">
                    {result.targetAudience}
                  </p>
                </div>

                <div className="mt-8">
                  <Paragraphs items={result.presentation} />
                </div>

                <div className="mt-8 grid gap-5">
                  <div className="rounded-[30px] border border-[#DFE7F7] bg-white p-6">
                    <h3 className="text-xl font-black text-[#0B1020]">
                      Promessa principal
                    </h3>
                    <p className="mt-3 text-[15px] leading-8 text-slate-700">
                      {result.mainPromise}
                    </p>
                  </div>

                  <div className="rounded-[30px] bg-[#002198] p-6 text-white">
                    <h3 className="text-xl font-black">
                      O que você vai encontrar aqui
                    </h3>
                    <p className="mt-3 text-[15px] leading-8 text-blue-50">
                      Um caminho simples para olhar para o dinheiro com mais
                      clareza, entender o que entra, o que sai e descobrir o que
                      realmente sobra no fim do mês.
                    </p>
                  </div>
                </div>
              </div>
            </EbookPage>

            <EbookPage>
              <EbookHeader
                eyebrow="Introdução"
                title="Trabalhar muito não pode significar viver no escuro"
                description="Antes de pensar em vender mais, você precisa entender melhor o dinheiro que já passa pela sua mão."
              />

              <div className="p-9">
                <Paragraphs items={result.introduction} />

                <div className="mt-10 rounded-[30px] border border-[#DFE7F7] bg-[#F8FBFF] p-6">
                  <h3 className="text-xl font-black text-[#0B1020]">
                    A ideia central
                  </h3>
                  <p className="mt-3 text-[15px] leading-8 text-slate-700">
                    Você não precisa complicar sua vida para cuidar melhor do
                    dinheiro. Precisa apenas criar uma forma simples de enxergar
                    o que acontece todos os dias.
                  </p>
                </div>
              </div>
            </EbookPage>

            {result.chapters.map((chapter, index) => (
              <EbookPage key={`${chapter.title}-${index}`}>
                <EbookHeader
                  eyebrow={`Capítulo ${index + 1}`}
                  title={chapter.title}
                  description="Leia, reflita e preencha os campos com a sua própria realidade."
                />

                <div className="p-9">
                  <div className="rounded-[30px] bg-[#F8FBFF] p-6">
                    <p className="text-[16px] font-semibold leading-8 text-[#0B1020]">
                      {chapter.opening}
                    </p>
                  </div>

                  <div className="mt-8">
                    <Paragraphs items={chapter.paragraphs} />
                  </div>

                  <div className="avoid-break mt-8 rounded-[30px] border border-[#DFE7F7] bg-white p-6">
                    <h3 className="text-lg font-black text-[#002198]">
                      Exemplo prático
                    </h3>
                    <p className="mt-3 text-[15px] leading-8 text-slate-700">
                      {chapter.example}
                    </p>
                  </div>

                  <div className="avoid-break mt-6 rounded-[30px] bg-[#002198] p-6 text-white">
                    <h3 className="text-lg font-black">Aplicação simples</h3>
                    <p className="mt-3 text-[15px] leading-8 text-blue-50">
                      {chapter.practicalAction}
                    </p>
                  </div>

                  <FillableBox
                    title={chapter.reflectionTitle}
                    intro={chapter.reflectionIntro}
                    fields={chapter.fields}
                  />

                  <div className="avoid-break mt-6 rounded-[30px] bg-[#F8FBFF] p-6">
                    <h3 className="text-lg font-black text-[#0B1020]">
                      Resumo do capítulo
                    </h3>
                    <p className="mt-3 text-[15px] leading-8 text-slate-700">
                      {chapter.summary}
                    </p>
                  </div>
                </div>
              </EbookPage>
            ))}

            <EbookPage>
              <EbookHeader
                eyebrow="Conclusão"
                title="Clareza muda a forma como você cuida do seu dinheiro"
                description="O objetivo não é controlar tudo com perfeição. O objetivo é parar de trabalhar sem saber o que está acontecendo."
              />

              <div className="p-9">
                <Paragraphs items={result.conclusion} />

                <div className="mt-10 rounded-[30px] bg-[#F8FBFF] p-6">
                  <h3 className="text-xl font-black text-[#0B1020]">
                    Lembre-se
                  </h3>
                  <p className="mt-3 text-[15px] leading-8 text-slate-700">
                    A mudança começa quando você enxerga o básico: o que entrou,
                    o que saiu e o que sobrou. É simples, mas é exatamente essa
                    clareza que muda a forma como você decide.
                  </p>
                </div>
              </div>
            </EbookPage>

            <EbookPage className="relative bg-[#F8FBFF]">
              <div className="absolute right-[-160px] top-[-160px] h-[420px] w-[420px] rounded-full bg-blue-200" />
              <div className="absolute bottom-[-170px] left-[-170px] h-[420px] w-[420px] rounded-full bg-indigo-100" />

              <div className="relative flex min-h-[1040px] flex-col justify-between p-10">
                <div>
                  <BrandBadge />

                  <p className="mt-20 text-xs font-black uppercase tracking-[0.24em] text-[#002198]">
                    Próximo passo
                  </p>

                  <h2 className="mt-6 max-w-2xl text-5xl font-black leading-tight text-[#0B1020]">
                    Quer transformar clareza em rotina?
                  </h2>

                  <p className="mt-8 max-w-2xl text-xl font-semibold leading-9 text-slate-700">
                    {result.finalCta}
                  </p>

                  <div className="mt-10 rounded-[30px] bg-[#002198] p-7 text-white">
                    <h3 className="text-2xl font-black">
                      Meu Caixa Inteligente
                    </h3>
                    <p className="mt-3 text-[16px] leading-8 text-blue-50">
                      Um jeito simples de registrar o que entrou, o que saiu e
                      ver quanto sobrou. Sem complicação, sem linguagem difícil
                      e feito para caber na rotina de quem atende clientes todos
                      os dias.
                    </p>
                  </div>
                </div>

                <div className="rounded-[30px] border border-[#DFE7F7] bg-white p-6">
                  <p className="text-sm font-semibold text-slate-500">
                    Material criado por
                  </p>
                  <p className="mt-2 text-2xl font-black text-[#0B1020]">
                    {result.author}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Gerado em {result.generatedAt}
                  </p>
                </div>
              </div>
            </EbookPage>
          </div>
        ) : null}
      </section>
    </main>
  )
}