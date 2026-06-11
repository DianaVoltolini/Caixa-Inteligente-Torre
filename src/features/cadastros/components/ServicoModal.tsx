// src/features/cadastros/components/ServicoModal.tsx

"use client"

import { useEffect, useState } from "react"
import { maskCurrencyInput } from "@/lib/masks"
import {
  Modal,
  FormField,
  FormInput,
  ModalActions
} from "@/components/ui"

type Props = {
  servicos: any
  fecharModal: () => void
  modalTipo: "servico" | null
  itemEditando?: any
  onCreated?: (service: any) => void
}

export function ServicoModal({
  servicos,
  fecharModal,
  modalTipo,
  itemEditando,
  onCreated
}: Props) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (modalTipo === null) return

    if (itemEditando) {
      setName(itemEditando.descricao || "")

      if (itemEditando.raw?.price) {
        const formatted = Number(itemEditando.raw.price)
          .toFixed(2)
          .replace(".", ",")
        setPrice(formatted)
      } else {
        setPrice("")
      }
    } else {
      setName("")
      setPrice("")
    }
  }, [modalTipo, itemEditando])

  if (modalTipo !== "servico") return null

  function limpar() {
    setName("")
    setPrice("")
    setError(null)
  }

  async function salvar(fecharDepois: boolean) {
    setError(null)

    if (!name.trim()) {
      setError("Me diga qual é esse serviço")
      return
    }

    if (!price) {
      setError("Informe quanto você cobra")
      return
    }

    const valor = Number(price.replace(",", ".")) || 0

    try {
      setLoading(true)

      let result

      if (itemEditando) {
        result = await servicos.updateServico(itemEditando.id, {
          name,
          price: valor
        })
      } else {
        result = await servicos.createServico({
          name,
          price: valor
        })
      }

      if (!result?.success) {
        setError(result?.error || "Erro ao salvar")
        return
      }

      if (!itemEditando) {
        onCreated?.({
          id: result?.data?.id,
          name,
          price: valor
        })
      }

      if (fecharDepois) {
        limpar()
        fecharModal()
      } else {
        limpar()
      }
    } finally {
      setLoading(false)
    }
  }

  function cancelar() {
    limpar()
    fecharModal()
  }

  return (
    <Modal
      isOpen={true}
      onClose={cancelar}
      title={itemEditando ? "Editar serviço" : "Cadastrar serviço"}
    >
      <div className="space-y-5">
        <p className="text-sm text-neutral-600">
          Cadastre aqui o que você oferece para vender e quanto costuma cobrar.
        </p>

        <FormField label="Nome do serviço">
          <FormInput
            value={name}
            onChange={(value: any) => setName(value)}
            placeholder="Ex: Corte, Manicure..."
          />
        </FormField>

        <FormField label="Quanto você cobra">
          <FormInput
            value={price}
            onChange={(value: any) => setPrice(maskCurrencyInput(value))}
            placeholder="0,00"
          />
        </FormField>

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