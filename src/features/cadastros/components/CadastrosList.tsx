// src/features/cadastros/components/CadastrosList.tsx

"use client"

import { Card, IconButton, Input } from "@/components/ui"
import { openWhatsApp, maskWhatsapp } from "@/lib/masks"

type Props = {
  listaUnificada: any[]
  setItemEditando: (item: any) => void
  setModalTipo: (tipo: any) => void
  filtroTipo: string
  setFiltroTipo: (tipo: any) => void
  search: string
  setSearch: (value: string) => void
  onDelete: (item: any) => void
}

export function CadastrosList({
  listaUnificada,
  setItemEditando,
  setModalTipo,
  filtroTipo,
  setFiltroTipo,
  search,
  setSearch,
  onDelete
}: Props) {
  function handleEdit(item: any) {
    setModalTipo(null)

    setTimeout(() => {
      setItemEditando(item)
      setModalTipo(item.tipo)
    }, 0)
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-[#e8eefc] bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_55%,#eef3ff_100%)] px-6 py-5">
        <h2 className="text-xl font-bold text-black">
          Sua base organizada
        </h2>

        <p className="mt-1 text-sm text-neutral-600">
          Quando isso está bem estruturado, você ganha velocidade no dia a dia.
        </p>
      </div>

      <div className="flex flex-col gap-4 border-b border-[#e8eefc] px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2 text-sm">
          {["todos", "cliente", "fornecedor", "servico", "categoria"].map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setFiltroTipo(tipo)}
              className={[
                "rounded-full px-3 py-1.5 transition",
                filtroTipo === tipo
                  ? "bg-[#eef3ff] text-[#002198] font-semibold"
                  : "text-neutral-600 hover:bg-[#f8fbff] hover:text-black",
              ].join(" ")}
            >
              {tipo === "todos"
                ? "Todos"
                : tipo === "cliente"
                  ? "Clientes"
                  : tipo === "fornecedor"
                    ? "Fornecedores"
                    : tipo === "servico"
                      ? "Serviços"
                      : "Categorias"}
            </button>
          ))}
        </div>

        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="w-full md:w-72"
        />
      </div>

      <div className="divide-y divide-[#eef2f7]">
        {listaUnificada.length === 0 ? (
          <div className="space-y-3 px-6 py-12 text-center">
            <p className="text-sm font-semibold text-black">
              Você ainda não tem nada cadastrado
            </p>

            <p className="text-sm text-neutral-600">
              Comece pelos itens que você mais usa no dia a dia.
            </p>
          </div>
        ) : (
          listaUnificada.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-6 py-4 hover:bg-[#f8fbff] transition"
            >
              <div className="min-w-0 space-y-1 pr-3">
                <div className="text-xs text-neutral-500 capitalize">
                  {item.tipo}
                </div>

                <div className="font-semibold text-black">
                  {item.descricao}
                </div>

                {item.raw?.phone && (
                  <button
                    type="button"
                    onClick={() => openWhatsApp(item.raw.phone)}
                    className="text-sm text-[#002198]"
                  >
                    📱 {maskWhatsapp(item.raw.phone)}
                  </button>
                )}

                {!item.raw?.phone && item.extra && (
                  <div className="text-sm text-neutral-500">
                    {item.extra}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <IconButton title="Editar" onClick={() => handleEdit(item)}>
                  ✏️
                </IconButton>

                <IconButton
                  title="Excluir"
                  variant="danger"
                  onClick={() => onDelete(item)}
                >
                  🗑
                </IconButton>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}