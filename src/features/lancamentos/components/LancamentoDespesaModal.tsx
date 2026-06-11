// src/features/lancamentos/components/LancamentoDespesaModal.tsx

"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

import {
  Modal,
  FormField,
  FormInput,
  FormSelect,
  ModalActions,
  IconButton,
} from "@/components/ui"

import { maskCurrencyInput } from "@/lib/masks"
import { formatCurrency } from "@/lib/formatters"

import { useBusiness } from "@/contexts/BusinessContext"

import { ContatoModal } from "@/features/cadastros/components/ContatoModal"
import { CategoriaModal } from "@/features/cadastros/components/CategoriaModal"

import { useContatos } from "@/features/cadastros/hooks/useContatos"
import { useCategorias } from "@/features/cadastros/hooks/useCategorias"

import {
  createTransaction,
  updateTransaction,
} from "@/lib/db/transactions"

type SupplierOption = {
  id: string
  name: string
}

type CategoryOption = {
  id: string
  name: string
  is_fixed?: boolean
}

interface Props {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  transaction?: {
    id?: string
  } | null
}

export function LancamentoDespesaModal({
  open,
  onClose,
  onSuccess,
  transaction,
}: Props) {
  const supabase = createClient()
  const { businessId } = useBusiness()

  const contatos = useContatos()
  const categoriasHook = useCategorias()

  const editing = !!transaction?.id

  const [fornecedores, setFornecedores] = useState<SupplierOption[]>([])
  const [categorias, setCategorias] = useState<CategoryOption[]>([])

  const [supplierId, setSupplierId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [date, setDate] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")

  const [openFornecedorModal, setOpenFornecedorModal] = useState(false)
  const [openCategoriaModal, setOpenCategoriaModal] = useState(false)

  function resetForm() {
    setSupplierId("")
    setCategoryId("")
    setDate("")
    setAmount("")
    setDescription("")
  }

  async function loadFornecedores() {
    if (!businessId) {
      setFornecedores([])
      return
    }

    const { data } = await supabase
      .from("ci_contacts")
      .select("id,name")
      .eq("business_id", businessId)
      .eq("type", "supplier")
      .is("deleted_at", null)
      .order("name")

    setFornecedores((data as SupplierOption[] | null) ?? [])
  }

  async function loadCategorias() {
    if (!businessId) {
      setCategorias([])
      return
    }

    const { data } = await supabase
      .from("ci_categories")
      .select("id,name,is_fixed")
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .order("name")

    setCategorias((data as CategoryOption[] | null) ?? [])
  }

  useEffect(() => {
    if (open && businessId) {
      void loadFornecedores()
      void loadCategorias()
    }
  }, [open, businessId])

  useEffect(() => {
    if (!open || !businessId) return

    if (!transaction?.id) {
      resetForm()
      return
    }

    async function loadTransaction() {
      resetForm()

      const { data } = await supabase
        .from("ci_transactions")
        .select("*")
        .eq("id", transaction.id)
        .eq("business_id", businessId)
        .is("deleted_at", null)
        .single()

      if (!data) return

      if (data.transaction_date) {
        setDate(String(data.transaction_date).substring(0, 10))
      }

      if (data.contact_id) setSupplierId(String(data.contact_id))
      if (data.category_id) setCategoryId(String(data.category_id))
      if (data.description) setDescription(String(data.description))

      if (data.amount) {
        const formatted = Number(data.amount).toFixed(2).replace(".", ",")
        setAmount(formatted)
      }
    }

    void loadTransaction()
  }, [open, transaction, businessId, supabase])

  async function salvar(fechar = true) {
    if (!businessId) return

    if (!date) {
      alert("Me diga quando foi esse gasto")
      return
    }

    if (!supplierId) {
      alert("Selecione pra quem você pagou")
      return
    }

    if (!categoryId) {
      alert("Selecione o tipo desse gasto")
      return
    }

    if (!amount) {
      alert("Informe quanto foi esse gasto")
      return
    }

    try {
      const transactionDate = `${date} 00:00:00`

      const valor =
        Number(
          amount
            .replace(/\./g, "")
            .replace(",", "."),
        ) || 0

      const payload = {
        type: "expense" as const,
        transaction_date: transactionDate,
        contact_id: supplierId,
        category_id: categoryId,
        description,
        amount: valor,
      }

      if (editing && transaction?.id) {
        await updateTransaction(transaction.id, businessId, payload)
      } else {
        await createTransaction({
          business_id: businessId,
          ...payload,
        })
      }

      if (onSuccess) await onSuccess()

      if (fechar) {
        onClose()
      } else {
        resetForm()
      }
    } catch (error: any) {
      console.error(error)
      alert(error?.message || "Não conseguimos salvar esse gasto")
    }
  }

  if (!open) return null

  return (
    <>
      <Modal
        isOpen={open}
        onClose={onClose}
        title={editing ? "Ajustar saída de dinheiro" : "Registrar saída de dinheiro"}
      >
        <div className="space-y-5">
          <p className="text-sm text-neutral-600">
            Aqui você descobre para onde seu dinheiro está indo de verdade.
          </p>

          {editing && (
            <p className="text-xs text-amber-600">
              Você está ajustando um lançamento. Isso altera seus resultados.
            </p>
          )}

          <FormField label="Quando aconteceu esse gasto?">
            <FormInput type="date" value={date} onChange={(value: any) => setDate(value)} />
          </FormField>

          <FormField label="Fornecedor">
            <div className="flex items-center gap-2">
              <FormSelect value={supplierId} onChange={(value: any) => setSupplierId(value)}>
                <option value="">Selecione</option>
                {fornecedores.map((fornecedor) => (
                  <option key={fornecedor.id} value={fornecedor.id}>
                    {fornecedor.name}
                  </option>
                ))}
              </FormSelect>

              <IconButton onClick={() => setOpenFornecedorModal(true)}>+</IconButton>
            </div>
          </FormField>

          <FormField label="Categoria">
            <div className="flex items-center gap-2">
              <FormSelect value={categoryId} onChange={(value: any) => setCategoryId(value)}>
                <option value="">Selecione</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.name}
                  </option>
                ))}
              </FormSelect>

              <IconButton onClick={() => setOpenCategoriaModal(true)}>+</IconButton>
            </div>
          </FormField>

          <div className="rounded-2xl border border-[#d9d9d9] bg-[#f8fbff] p-4">
            <p className="text-xs text-neutral-500">Valor da saída</p>

            <div className="mt-2">
              <FormInput
                value={amount}
                onChange={(value: any) => setAmount(maskCurrencyInput(value))}
                placeholder="0,00"
              />
            </div>

            {amount && (
              <p className="mt-2 text-sm text-neutral-600">
                Total:{" "}
                <strong>
                  {formatCurrency(
                    Number(
                      amount
                        .replace(/\./g, "")
                        .replace(",", "."),
                    ) || 0,
                  )}
                </strong>
              </p>
            )}
          </div>

          <FormField label="Observação (opcional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-2xl border border-[#d9d9d9] px-3 py-2 text-sm text-black focus:border-[#bfd0fb] focus:outline-none"
            />
          </FormField>

          <ModalActions
            onCancel={onClose}
            onSave={() => salvar(true)}
            onSaveAndContinue={() => salvar(false)}
          />
        </div>
      </Modal>

      {openFornecedorModal && (
        <ContatoModal
          modalTipo="fornecedor"
          fecharModal={() => {
            setOpenFornecedorModal(false)
            void loadFornecedores()
          }}
          contatos={{
            ...contatos,
            refetch: loadFornecedores,
          }}
          onCreated={() => {
            void loadFornecedores()
          }}
        />
      )}

      {openCategoriaModal && (
        <CategoriaModal
          fecharModal={() => {
            setOpenCategoriaModal(false)
            void loadCategorias()
          }}
          categorias={{
            ...categoriasHook,
            refetch: loadCategorias,
          }}
          itemEditando={null}
        />
      )}
    </>
  )
}