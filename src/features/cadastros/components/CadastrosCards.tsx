// src/features/cadastros/components/CadastrosCards.tsx

"use client"

import { IconButton, Card } from "@/components/ui"

type Props = {
  abrirCliente: () => void
  abrirFornecedor: () => void
  abrirServico: () => void
  abrirCategoria: () => void
  setFiltroTipo: (tipo: any) => void
  contatos: any
  servicos: any
  categorias: any
}

export function CadastrosCards({
  abrirCliente,
  abrirFornecedor,
  abrirServico,
  abrirCategoria,
  setFiltroTipo,
  contatos,
  servicos,
  categorias
}: Props) {
  const clientes = contatos?.contatos?.filter((c: any) => c.type === "client") || []
  const fornecedores = contatos?.contatos?.filter((c: any) => c.type === "supplier") || []
  const servicosLista = servicos?.services || []
  const categoriasLista = categorias?.categories || []

  function CardItem({ title, count, description, onClick, onAdd }: any) {
    return (
      <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        className="cursor-pointer"
      >
        <Card className="p-6 hover:shadow-[0_22px_55px_rgba(15,23,42,0.08)] transition">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#002198]">
                {title}
              </p>

              <p className="text-2xl font-bold text-black">
                {count}
              </p>

              <p className="text-sm text-neutral-600">
                {description}
              </p>
            </div>

            <IconButton
              title={`Adicionar ${title.toLowerCase()}`}
              onClick={(e: any) => {
                e.stopPropagation()
                onAdd()
              }}
            >
              +
            </IconButton>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <CardItem
        title="Clientes"
        count={clientes.length}
        description="Quem compra de você"
        onClick={() => setFiltroTipo("cliente")}
        onAdd={abrirCliente}
      />

      <CardItem
        title="Fornecedores"
        count={fornecedores.length}
        description="Quem você paga"
        onClick={() => setFiltroTipo("fornecedor")}
        onAdd={abrirFornecedor}
      />

      <CardItem
        title="Serviços"
        count={servicosLista.length}
        description="O que você vende"
        onClick={() => setFiltroTipo("servico")}
        onAdd={abrirServico}
      />

      <CardItem
        title="Categorias"
        count={categoriasLista.length}
        description="Organização financeira"
        onClick={() => setFiltroTipo("categoria")}
        onAdd={abrirCategoria}
      />
    </div>
  )
}