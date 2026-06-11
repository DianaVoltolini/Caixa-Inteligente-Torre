// src/features/cadastros/components/CategoriaModal.tsx

"use client"

import { useEffect, useState } from "react"
import {
  Modal,
  FormCheckbox,
  FormField,
  FormInput,
  ModalActions
} from "@/components/ui"

type Props = {
  categorias: any
  fecharModal: () => void
  itemEditando: any
}

export function CategoriaModal({
  categorias,
  fecharModal,
  itemEditando
}: Props) {
  const [name, setName] = useState("")
  const [isFixed, setIsFixed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (itemEditando) {
      setName(itemEditando.descricao || "")
      setIsFixed(itemEditando.raw?.is_fixed || false)
    } else {
      setName("")
      setIsFixed(false)
    }
  }, [itemEditando])

  function limparFormulario() {
    setName("")
    setIsFixed(false)
    setError(null)
  }

  async function salvar(fecharDepois: boolean) {
    setError(null)

    if (!name.trim()) {
      setError("Dê um nome para esse tipo de gasto")
      return
    }

    try {
      setLoading(true)

      let result

      if (itemEditando) {
        result = await categorias.updateCategoria(itemEditando.id, {
          name,
          is_fixed: isFixed
        })
      } else {
        result = await categorias.createCategoria({
          name,
          is_fixed: isFixed,
          type: "expense"
        })
      }

      if (!result?.success) {
        setError(result?.error || "Erro ao salvar")
        return
      }

      if (fecharDepois) {
        limparFormulario()
        fecharModal()
      } else {
        limparFormulario()
      }
    } finally {
      setLoading(false)
    }
  }

  function cancelar() {
    limparFormulario()
    fecharModal()
  }

  return (
    <Modal
      isOpen={true}
      onClose={cancelar}
      title={itemEditando ? "Editar tipo de gasto" : "Criar tipo de gasto"}
    >
      <div className="space-y-5">
        <p className="text-sm text-neutral-600">
          Separe seus gastos para entender melhor para onde seu dinheiro está indo.
        </p>

        <FormField label="Nome">
          <FormInput
            value={name}
            onChange={(value: any) => setName(value)}
            placeholder="Ex: Produtos, Aluguel, Marketing..."
          />
        </FormField>

        <FormCheckbox
          label="Esse gasto acontece todo mês"
          checked={isFixed}
          onChange={setIsFixed}
        />

        {error && (
          <div className="text-sm text-rose-600">
            {error}
          </div>
        )}

        <ModalActions
          onCancel={cancelar}
          onSave={() => salvar(true)}
          onSaveAndContinue={() => salvar(false)}
          loading={loading}
        />
      </div>
    </Modal>
  )
}