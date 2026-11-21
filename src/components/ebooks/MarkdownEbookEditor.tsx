"use client"

import { useMemo, useState, type ReactNode } from "react"

type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "code"; text: string }
  | { kind: "table"; rows: string[][] }
  | { kind: "rule" }

const example = [
  "# O dinheiro do MEI",
  "",
  "## Entenda o dinheiro que entra e o que realmente sobra",
  "",
  "Um guia prático para organizar o dinheiro do seu negócio.",
  "",
  "## Capítulo 1 — Organize suas entradas",
  "",
  "Registre todos os valores recebidos. **Não confunda faturamento com resultado.**",
  "",
  "- Vendas e serviços",
  "- Recebimentos por Pix, cartão e dinheiro",
  "- Outras receitas do negócio",
  "",
  "### Exemplo prático",
  "",
  "| Descrição | Valor |",
  "| --- | ---: |",
  "| Entradas | R$ 2.500,00 |",
  "| Saídas | R$ 1.350,00 |",
  "| Sobra | R$ 1.150,00 |",
  "",
  "> Este é um exemplo ilustrativo, não uma apuração tributária.",
  "",
  "## Capítulo 2 — Confira suas saídas",
  "",
  "Anote despesas e compare com o que entrou. Defina os próximos passos com base nos seus registros.",
].join("\n")

function safeUrl(value: string): string | undefined {
  const url = value.trim()
  if (/^https?:\/\//i.test(url) || /^mailto:/i.test(url)) return url
  return undefined
}

function inline(text: string): ReactNode[] {
  const pattern = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\*([^*\n]+)\*|_([^_\n]+)_)/g
  const output: ReactNode[] = []
  let offset = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > offset) output.push(text.slice(offset, match.index))
    const key = String(match.index)
    if (match[2] !== undefined) {
      const href = safeUrl(match[3])
      output.push(href ? <a key={key} href={href} className="text-[#002198] underline">{match[2]}</a> : match[2])
    } else if (match[4] || match[5]) {
      output.push(<strong key={key}>{match[4] || match[5]}</strong>)
    } else if (match[6]) {
      output.push(<code key={key} className="rounded bg-slate-100 px-1">{match[6]}</code>)
    } else {
      output.push(<em key={key}>{match[7] || match[8]}</em>)
    }
    offset = pattern.lastIndex
  }
  if (offset < text.length) output.push(text.slice(offset))
  return output
}

function parseMarkdown(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n")
  const blocks: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed) { i++; continue }
    if (/^```/.test(trimmed)) {
      i++
      const code: string[] = []
      while (i < lines.length && !/^```/.test(lines[i].trim())) code.push(lines[i++])
      if (i < lines.length) i++
      blocks.push({ kind: "code", text: code.join("\n") })
      continue
    }
    const heading = /^(#{1,6})\s+(.+)$/.exec(trimmed)
    if (heading) {
      blocks.push({ kind: "heading", level: heading[1].length, text: heading[2].replace(/\s+#+\s*$/, "") })
      i++
      continue
    }
    if (/^([-*_]\s*){3,}$/.test(trimmed)) { blocks.push({ kind: "rule" }); i++; continue }
    if (/^\|.*\|$/.test(trimmed) && i + 1 < lines.length && /^\|[\s:|\-]+\|$/.test(lines[i + 1].trim())) {
      const rows = [trimmed.split("|").slice(1, -1).map(x => x.trim())]
      i += 2
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) {
        rows.push(lines[i++].trim().split("|").slice(1, -1).map(x => x.trim()))
      }
      blocks.push({ kind: "table", rows })
      continue
    }
    if (/^\s*>/.test(line)) {
      const parts: string[] = []
      while (i < lines.length && /^\s*>/.test(lines[i])) parts.push(lines[i++].replace(/^\s*>\s?/, ""))
      blocks.push({ kind: "quote", text: parts.join(" ") })
      continue
    }
    const bullet = /^\s*(?:([-*+])|(\d+)\.)\s+(.+)$/.exec(line)
    if (bullet) {
      const items: string[] = []
      const ordered = Boolean(bullet[2])
      while (i < lines.length) {
        const item = /^\s*(?:([-*+])|(\d+)\.)\s+(.+)$/.exec(lines[i])
        if (!item || Boolean(item[2]) !== ordered) break
        items.push(item[3])
        i++
      }
      blocks.push({ kind: "list", ordered, items })
      continue
    }
    const paragraph: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(#{1,6})\s+|^\s*>|^\s*(?:[-*+]|\d+\.)\s+|^```|^\|.*\|$/.test(lines[i])) {
      paragraph.push(lines[i++].trim())
    }
    if (!paragraph.length) { paragraph.push(lines[i++].trim()) }
    blocks.push({ kind: "paragraph", text: paragraph.join(" ") })
  }
  return blocks
}

function RenderBlock({ block }: { block: Block }) {
  if (block.kind === "heading") {
    if (block.level === 1) return <h1 className="mt-8 mb-5 text-3xl font-extrabold text-[#002198]">{inline(block.text)}</h1>
    if (block.level === 2) return <h2 className="mt-9 mb-4 break-after-avoid border-b border-[#DFE7F7] pb-3 text-2xl font-bold text-[#002198]">{inline(block.text)}</h2>
    return <h3 className="mt-7 mb-3 break-after-avoid text-lg font-bold text-[#002198]">{inline(block.text)}</h3>
  }
  if (block.kind === "paragraph") return <p className="mb-4 text-[15px] leading-8 text-slate-700">{inline(block.text)}</p>
  if (block.kind === "quote") return <blockquote className="my-5 break-inside-avoid border-l-4 border-[#002198] bg-[#F8FBFF] px-5 py-4 text-sm leading-7 text-slate-700">{inline(block.text)}</blockquote>
  if (block.kind === "rule") return <hr className="my-8 border-[#DFE7F7]" />
  if (block.kind === "code") return <pre className="my-5 overflow-auto rounded-xl bg-slate-100 p-4 text-xs leading-6 whitespace-pre-wrap">{block.text}</pre>
  if (block.kind === "list") {
    const items = block.items.map((value, i) => <li key={i} className="mb-1 pl-1">{inline(value)}</li>)
    return block.ordered
      ? <ol className="mb-5 ml-6 list-decimal text-[15px] leading-7 text-slate-700">{items}</ol>
      : <ul className="mb-5 ml-6 list-disc text-[15px] leading-7 text-slate-700">{items}</ul>
  }
  return <div className="my-6 overflow-x-auto"><table className="w-full border-collapse text-sm">
    <thead><tr>{(block.rows[0] || []).map((cell, i) => <th key={i} className="border border-[#DFE7F7] bg-[#002198] px-3 py-2 text-left font-semibold text-white">{inline(cell)}</th>)}</tr></thead>
    <tbody>{block.rows.slice(1).map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="border border-[#DFE7F7] px-3 py-2 text-slate-700">{inline(cell)}</td>)}</tr>)}</tbody>
  </table></div>
}

export default function MarkdownEbookEditor({ onSwitchMode }: { onSwitchMode: () => void }) {
  const [markdown, setMarkdown] = useState("")
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [author, setAuthor] = useState("Meu Caixa Inteligente")
  const [preview, setPreview] = useState(false)
  const [feedback, setFeedback] = useState("")
  const blocks = useMemo(() => parseMarkdown(markdown), [markdown])
  const headings = blocks.filter((b): b is Extract<Block, { kind: "heading" }> => b.kind === "heading" && b.level === 2)
  const firstTitle = blocks.find((b): b is Extract<Block, { kind: "heading" }> => b.kind === "heading" && b.level === 1)
  const bookTitle = title.trim() || firstTitle?.text || "E-book"
  function showPreview() {
    if (!markdown.trim()) { setFeedback("Cole o conteúdo Markdown antes de visualizar."); return }
    setFeedback("")
    setPreview(true)
  }
  function printPdf() {
    if (!preview) { setFeedback("Visualize o conteúdo antes de gerar o PDF."); return }
    window.print()
  }
  function saveMarkdown() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = (bookTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "ebook") + ".md"
    link.click()
    URL.revokeObjectURL(url)
  }

  return <div className="min-h-screen bg-[#F8FBFF] text-[#0B1020]">
    <style>{`
      @media print {
        @page { size: A4; margin: 15mm; }
        .md-editor { display: none !important; }
        .md-book { display: block !important; width: 100% !important; max-width: none !important; border: 0 !important; box-shadow: none !important; margin: 0 !important; padding: 0 !important; }
        .md-cover { min-height: 245mm !important; break-after: page; page-break-after: always; }
        .md-toc { break-after: page; page-break-after: always; }
        .md-book h2 { break-after: avoid; page-break-after: avoid; }
        .md-book p, .md-book blockquote, .md-book li, .md-book table { orphans: 3; widows: 3; }
        .md-book tr { break-inside: avoid; }
        .md-book * { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
      }
    `}</style>
    <div className="md-editor mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-widest text-[#002198]">Meu Caixa Inteligente · Torre</p>
          <h1 className="mt-2 text-3xl font-extrabold">Criador de E-book — Markdown</h1>
          <p className="mt-2 text-sm text-slate-600">Diagramação sem IA: o conteúdo é preservado, sem reescrever nem acrescentar informações.</p>
        </div>
        <button type="button" onClick={onSwitchMode} className="rounded-2xl border border-[#DFE7F7] bg-white px-4 py-3 text-sm font-semibold text-[#002198]">Usar formulário antigo</button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="space-y-4 rounded-[28px] border border-[#DFE7F7] bg-white p-5">
          <label className="block text-sm font-bold">Título da capa (opcional)
            <input value={title} onChange={e => { setTitle(e.target.value); setPreview(false) }} placeholder="Se vazio, usa o primeiro título # do Markdown" className="mt-2 w-full rounded-xl border border-[#DFE7F7] p-3 font-normal" />
          </label>
          <label className="block text-sm font-bold">Subtítulo (opcional)
            <input value={subtitle} onChange={e => { setSubtitle(e.target.value); setPreview(false) }} className="mt-2 w-full rounded-xl border border-[#DFE7F7] p-3 font-normal" />
          </label>
          <label className="block text-sm font-bold">Autoria / marca
            <input value={author} onChange={e => { setAuthor(e.target.value); setPreview(false) }} className="mt-2 w-full rounded-xl border border-[#DFE7F7] p-3 font-normal" />
          </label>
          <label htmlFor="markdown-ebook" className="block text-sm font-bold">Conteúdo completo em Markdown</label>
          <textarea id="markdown-ebook" value={markdown} onChange={e => { setMarkdown(e.target.value); setPreview(false) }} rows={22} spellCheck={false} placeholder={"# Título do livro\n\n## Capítulo 1\n\nTexto completo do capítulo..."} className="w-full resize-y rounded-2xl border border-[#DFE7F7] bg-[#F8FBFF] p-4 font-mono text-sm leading-6 outline-none focus:border-[#002198]" />
          <p className="text-xs leading-5 text-slate-500">Aceita títulos #, ##, ###, parágrafos, **negrito**, *itálico*, listas, tabelas, citações e links HTTPS. O editor não executa HTML do texto.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={showPreview} className="rounded-xl bg-[#002198] px-5 py-3 text-sm font-bold text-white">Atualizar prévia</button>
            <button type="button" onClick={() => { setMarkdown(example); setTitle(""); setSubtitle(""); setPreview(false); setFeedback("") }} className="rounded-xl border border-[#DFE7F7] px-4 py-3 text-sm font-semibold">Carregar exemplo</button>
            <button type="button" disabled={!markdown.trim()} onClick={saveMarkdown} className="rounded-xl border border-[#DFE7F7] px-4 py-3 text-sm font-semibold disabled:opacity-50">Salvar .md</button>
            <button type="button" disabled={!preview} onClick={printPdf} className="rounded-xl border border-[#DFE7F7] px-4 py-3 text-sm font-semibold disabled:opacity-50">Salvar PDF</button>
          </div>
          {feedback && <p role="status" className="text-sm font-semibold text-amber-700">{feedback}</p>}
        </div>
        <div className="rounded-[28px] border border-[#DFE7F7] bg-white p-5">
          <p className="mb-4 text-sm font-bold text-[#002198]">Pré-visualização do e-book</p>
          {!preview ? <p className="rounded-2xl bg-[#F8FBFF] p-5 text-sm text-slate-600">Cole o texto e clique em “Atualizar prévia”. As alterações não serão impressas até atualizar a prévia.</p> :
            <div className="text-sm text-slate-600">Prévia atualizada. O conteúdo completo aparece abaixo e pode ser salvo em PDF.</div>}
        </div>
      </div>
    </div>
    {preview && <article className="md-book mx-auto mb-10 max-w-[794px] overflow-hidden rounded-[28px] border border-[#DFE7F7] bg-white shadow-xl">
      <section className="md-cover flex min-h-[980px] flex-col justify-between bg-[#F8FBFF] p-10 sm:p-14">
        <div className="inline-flex self-start rounded-full border border-[#DFE7F7] bg-white px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-[#002198]">Meu Caixa Inteligente</div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#002198]">E-book digital</p>
          <h2 className="mt-7 text-5xl font-extrabold leading-tight text-[#07122F]">{bookTitle}</h2>
          {subtitle && <p className="mt-6 text-xl leading-8 text-slate-600">{subtitle}</p>}
          <div className="mt-9 h-2 w-28 rounded bg-[#002198]" />
        </div>
        <p className="text-sm font-semibold text-[#002198]">{author}</p>
      </section>
      {headings.length > 0 && <section className="md-toc p-10 sm:p-14">
        <h2 className="mb-8 border-b border-[#DFE7F7] pb-4 text-3xl font-bold text-[#002198]">Sumário</h2>
        <ol className="space-y-4">{headings.map((h, i) => <li key={i} className="border-b border-dashed border-[#DFE7F7] pb-3 text-base text-slate-700">{h.text}</li>)}</ol>
      </section>}
      <div className="px-10 py-10 sm:px-14 sm:py-14">{blocks.filter(b => !(b.kind === "heading" && b.level === 1 && b.text === firstTitle?.text)).map((block, i) => <RenderBlock key={i} block={block} />)}</div>
      <footer className="border-t border-[#DFE7F7] px-10 py-6 text-xs font-semibold text-[#002198]">{author} · Meu Caixa Inteligente</footer>
    </article>}
  </div>
}
