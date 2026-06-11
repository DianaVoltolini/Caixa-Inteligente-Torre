// src/features/cadastros/hooks/useCadastros.ts

"use client"

import { useMemo, useState } from "react"

import { useContatos } from "./useContatos"
import { useServicos } from "./useServicos"
import { useCategorias } from "./useCategorias"

import { formatCurrency } from "@/lib/formatters"
import { maskWhatsapp } from "@/lib/masks"

export type TipoFiltro =
  | "todos"
  | "cliente"
  | "fornecedor"
  | "servico"
  | "categoria"

export function useCadastros() {

  const contatos = useContatos()
  const servicos = useServicos()
  const categorias = useCategorias()

  const [search, setSearch] = useState("")
  const [filtroTipo, setFiltroTipo] =
    useState<TipoFiltro>("todos")

  const [modalTipo, setModalTipo] = useState<
    "cliente" | "fornecedor" | "servico" | "categoria" | null
  >(null)

  const [itemEditando, setItemEditando] =
    useState<any | null>(null)

  function abrirCliente() {
    setItemEditando(null)
    setModalTipo("cliente")
  }

  function abrirFornecedor() {
    setItemEditando(null)
    setModalTipo("fornecedor")
  }

  function abrirServico() {
    setItemEditando(null)
    setModalTipo("servico")
  }

  function abrirCategoria() {
    setItemEditando(null)
    setModalTipo("categoria")
  }

  function fecharModal() {
    setModalTipo(null)
    setItemEditando(null)
  }

  const loading =
    contatos.loading ||
    servicos.loading ||
    categorias.loading

  const error =
    contatos.error ||
    servicos.error ||
    categorias.error

  // 🔥 NORMALIZAÇÃO SEGURA (evita edge case)
  const contatosData = contatos.contatos || []
  const servicosData = servicos.services || []
  const categoriasData = categorias.categories || []

  const listaUnificada = useMemo(() => {

    const contatosLista =
      contatosData.map((c: any) => ({

        id: c.id,

        tipo: c.type === "client"
          ? "cliente"
          : "fornecedor",

        descricao: c.name,

        telefone: c.phone || "",

        extra:
          [
            c.phone ? `📱 ${maskWhatsapp(c.phone)}` : null,
            c.email ? `✉ ${c.email}` : null
          ]
            .filter(Boolean)
            .join("  "),

        raw: c

      }))

    const servicosLista =
      servicosData.map((s: any) => ({

        id: s.id,

        tipo: "servico",

        descricao: s.name,

        extra: formatCurrency(s.price || 0),

        raw: s

      }))

    const categoriasLista =
      categoriasData.map((cat: any) => ({

        id: cat.id,

        tipo: "categoria",

        descricao: cat.name,

        extra: cat.is_fixed
          ? "Despesa fixa"
          : "",

        raw: cat

      }))

    let todos = [

      ...contatosLista,
      ...servicosLista,
      ...categoriasLista

    ]

    if (filtroTipo !== "todos") {

      todos = todos.filter(
        (item) => item.tipo === filtroTipo
      )

    }

    if (search.trim()) {

      const termo = search.toLowerCase()

      todos = todos.filter((item) =>
        item.descricao
          .toLowerCase()
          .includes(termo)
      )

    }

    return todos

  }, [
    contatosData,
    servicosData,
    categoriasData,
    search,
    filtroTipo
  ])

  return {

    contatos,
    servicos,
    categorias,

    listaUnificada,

    loading,
    error,

    search,
    setSearch,

    filtroTipo,
    setFiltroTipo,

    modalTipo,
    setModalTipo,

    itemEditando,
    setItemEditando,

    abrirCliente,
    abrirFornecedor,
    abrirServico,
    abrirCategoria,
    fecharModal

  }

}