// src/features/cadastros/components/ContatoModal.tsx

"use client"

import { useEffect, useMemo, useState } from "react"

import {
  Modal,
  FormField,
  FormInput,
  ModalActions
} from "@/components/ui"

import { maskWhatsapp } from "@/lib/masks"

interface Props {
  modalTipo: "cliente" | "fornecedor" | null
  fecharModal: () => void
  contatos: any
  itemEditando?: any
  onCreated?: (novo: any) => void
}

export function ContatoModal({
  modalTipo,
  fecharModal,
  contatos,
  itemEditando,
  onCreated
}: Props) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const editId = useMemo(() => {
    return itemEditando?.raw?.id || itemEditando?.id || null
  }, [itemEditando])

  const editing = Boolean(editId)

  useEffect(() => {
    if (!modalTipo) return

    if (editing) {
      setName(itemEditando?.raw?.name || itemEditando?.descricao || "")
      setPhone(itemEditando?.raw?.phone || "")
      setEmail(itemEditando?.raw?.email || "")
      return
    }

    resetForm()
  }, [modalTipo, editing, itemEditando])

  if (!modalTipo) return null

  function resetForm() {
    setName("")
    setPhone("")
    setEmail("")
  }

  function handleClose() {
    resetForm()
    fecharModal()
  }

  async function salvar(fechar = true) {
    if (!name.trim()) {
      alert(
        modalTipo === "cliente"
          ? "Me diga o nome da cliente"
          : "Me diga o nome do fornecedor"
      )
      return
    }

    try {
      setLoading(true)

      const payload = {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        type: modalTipo === "cliente" ? "client" : "supplier"
      }

      if (editing && editId) {
        const result = await contatos.updateContato(editId, payload)

        if (!result?.success) {
          alert(result?.error || "Não conseguimos salvar essa alteração")
          return
        }

        if (typeof contatos.refetch === "function") {
          await contatos.refetch()
        }
      } else {
        const result = await contatos.createContato(payload)

        if (!result?.success) {
          alert(result?.error || "Não conseguimos salvar esse cadastro")
          return
        }

        if (typeof contatos.refetch === "function") {
          await contatos.refetch()
        }

        if (onCreated) {
          onCreated(result?.data)
        }
      }

      if (fechar) {
        handleClose()
      } else {
        resetForm()
      }
    } catch (error: any) {
      console.error(error)
      alert(error?.message || "Não conseguimos salvar esse cadastro")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title={
        editing
          ? modalTipo === "cliente"
            ? "Editar cliente"
            : "Editar fornecedor"
          : modalTipo === "cliente"
            ? "Cadastrar cliente"
            : "Cadastrar fornecedor"
      }
    >
      <div className="space-y-5">
        <p className="text-sm text-neutral-600">
          {modalTipo === "cliente"
            ? "Guarde aqui quem compra de você para deixar seus lançamentos mais rápidos."
            : "Registre aqui quem você paga para manter seu negócio mais organizado."}
        </p>

        <FormField label="Nome">
          <FormInput
            value={name}
            onChange={(value: any) => setName(value)}
            placeholder={
              modalTipo === "cliente"
                ? "Ex: Maria, Joana..."
                : "Ex: fornecedor, loja, prestador..."
            }
          />
        </FormField>

        <FormField label="WhatsApp (opcional)">
          <FormInput
            value={phone}
            onChange={(value: any) => setPhone(maskWhatsapp(value))}
            placeholder="(00) 00000-0000"
          />
        </FormField>

        <FormField label="Email (opcional)">
          <FormInput
            value={email}
            onChange={(value: any) => setEmail(value)}
            placeholder="email@exemplo.com"
          />
        </FormField>

        <ModalActions
          onCancel={handleClose}
          onSave={() => salvar(true)}
          onSaveAndContinue={() => salvar(false)}
          loading={loading}
        />
      </div>
    </Modal>
  )
}