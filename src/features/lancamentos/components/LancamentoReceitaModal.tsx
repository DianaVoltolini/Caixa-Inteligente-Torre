// src/features/lancamentos/components/LancamentoReceitaModal.tsx

"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useBusiness } from "@/contexts/BusinessContext"

import { ServicoSelect } from "./ServicoSelect"
import { ServicosSelecionados } from "./ServicosSelecionados"

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

import { ContatoModal } from "@/features/cadastros/components/ContatoModal"
import { ServicoModal } from "@/features/cadastros/components/ServicoModal"

import { useContatos } from "@/features/cadastros/hooks/useContatos"
import { useServicos } from "@/features/cadastros/hooks/useServicos"

import {
  createTransaction,
  updateTransaction,
} from "@/lib/db/transactions"

type SelectedService = {
  service_id: string
  service_name: string
  service_price: number
  qty: number
}

type ClientOption = {
  id: string
  name: string
}

type ServiceOption = {
  id: string
  name: string
  price: number
}

interface Props {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  transaction?: {
    id?: string
  } | null
}

export function LancamentoReceitaModal({
  open,
  onClose,
  onSuccess,
  transaction,
}: Props) {
  const supabase = createClient()
  const { businessId } = useBusiness()

  const contatos = useContatos()
  const servicosHook = useServicos()

  const editing = !!transaction?.id

  const [clientes, setClientes] = useState<ClientOption[]>([])
  const [servicos, setServicos] = useState<ServiceOption[]>([])

  const [contactId, setContactId] = useState("")
  const [services, setServices] = useState<SelectedService[]>([])

  const [date, setDate] = useState("")
  const [time, setTime] = useState("")

  const [valorCobrado, setValorCobrado] = useState("")
  const [description, setDescription] = useState("")

  const [openClienteModal, setOpenClienteModal] = useState(false)
  const [openServicoModal, setOpenServicoModal] = useState(false)

  function resetForm() {
    setContactId("")
    setServices([])
    setDate("")
    setTime("")
    setValorCobrado("")
    setDescription("")
  }

  async function loadClientes() {
    if (!businessId) {
      setClientes([])
      return
    }

    const { data } = await supabase
      .from("ci_contacts")
      .select("id,name")
      .eq("business_id", businessId)
      .eq("type", "client")
      .is("deleted_at", null)
      .order("name")

    setClientes((data as ClientOption[] | null) ?? [])
  }

  async function loadServicos() {
    if (!businessId) {
      setServicos([])
      return
    }

    const { data } = await supabase
      .from("ci_services")
      .select("id,name,price")
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .order("name")

    setServicos((data as ServiceOption[] | null) ?? [])
  }

  useEffect(() => {
    if (open && businessId) {
      void loadClientes()
      void loadServicos()
    }
  }, [open, businessId])

  useEffect(() => {
    if (!open || !businessId) return

    if (!transaction?.id) {
      resetForm()
      return
    }

    async function loadTransactionFromDB() {
      resetForm()

      const { data: trx } = await supabase
        .from("ci_transactions")
        .select("*")
        .eq("id", transaction.id)
        .eq("business_id", businessId)
        .is("deleted_at", null)
        .single()

      if (!trx) return

      if (trx.transaction_date) {
        const raw = String(trx.transaction_date)
        setDate(raw.substring(0, 10))
        setTime(raw.substring(11, 16))
      }

      if (trx.contact_id) setContactId(String(trx.contact_id))
      if (trx.description) setDescription(String(trx.description))

      if (trx.amount) {
        const formatted = Number(trx.amount).toFixed(2).replace(".", ",")
        setValorCobrado(formatted)
      }

      const { data: serv } = await supabase
        .from("ci_transaction_services")
        .select(`
          service_id,
          ci_services!inner (
            id,
            name,
            price
          )
        `)
        .eq("transaction_id", transaction.id)
        .eq("business_id", businessId)
        .is("deleted_at", null)

      if (serv && serv.length > 0) {
        setServices(
          serv.map((s: any) => ({
            service_id: String(s.service_id),
            service_name: String(s.ci_services?.name ?? ""),
            service_price: Number(s.ci_services?.price ?? 0),
            qty: 1,
          })),
        )
      }
    }

    void loadTransactionFromDB()
  }, [open, transaction, businessId, supabase])

  function addService(service: ServiceOption) {
    const exists = services.some((s) => s.service_id === service.id)

    if (exists) {
      alert("Esse serviço já foi adicionado")
      return
    }

    setServices((prev) => [
      ...prev,
      {
        service_id: service.id,
        service_name: service.name,
        service_price: service.price,
        qty: 1,
      },
    ])
  }

  const totalServicos = useMemo(() => {
    return services.reduce((acc, s) => acc + s.qty * s.service_price, 0)
  }, [services])

  const valorDigitado = Number(valorCobrado.replace(",", ".")) || 0
  const valorFinal = valorDigitado > 0 ? valorDigitado : totalServicos
  const diferenca = valorFinal - totalServicos

  async function salvar(fechar = true) {
    if (!businessId) {
      alert("Erro: empresa não identificada")
      return
    }

    if (!date) {
      alert("Informe a data do atendimento")
      return
    }

    if (!time) {
      alert("Informe o horário do atendimento")
      return
    }

    if (!contactId) {
      alert("Selecione o cliente")
      return
    }

    if (services.length === 0) {
      alert("Adicione pelo menos um serviço")
      return
    }

    try {
      const transactionDate = `${date} ${time}:00`

      const payload = {
        type: "income" as const,
        transaction_date: transactionDate,
        contact_id: contactId,
        description,
        amount: valorFinal,
        services: services.map((service) => ({
          service_id: service.service_id,
        })),
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
      alert(error?.message || "Erro ao salvar atendimento")
    }
  }

  if (!open) return null

  return (
    <>
      <Modal
        isOpen={open}
        onClose={onClose}
        title={editing ? "Ajustar entrada de dinheiro" : "Registrar entrada de dinheiro"}
      >
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-5">
            <p className="text-sm text-neutral-600">
              Tudo que entra precisa passar por aqui. É assim que você começa a enxergar seu faturamento de verdade.
            </p>

            {editing && (
              <p className="text-xs text-amber-600">
                Você está ajustando um lançamento. Isso altera seus resultados.
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Quando foi o atendimento?">
                <FormInput type="date" value={date} onChange={(value: any) => setDate(value)} />
              </FormField>

              <FormField label="Horário">
                <FormInput type="time" value={time} onChange={(value: any) => setTime(value)} />
              </FormField>
            </div>

            <FormField label="Cliente">
              <div className="flex items-center gap-2">
                <FormSelect value={contactId} onChange={(value: any) => setContactId(value)}>
                  <option value="">Selecione</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </FormSelect>

                <IconButton onClick={() => setOpenClienteModal(true)}>+</IconButton>
              </div>
            </FormField>

            <div className="space-y-3">
              <div>
                <p className="mb-2 text-sm text-neutral-500">
                  O que você fez nesse atendimento
                </p>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <ServicoSelect services={servicos} onSelect={addService} />
                  </div>

                  <IconButton onClick={() => setOpenServicoModal(true)}>+</IconButton>
                </div>
              </div>

              <div className="rounded-2xl border border-[#d9d9d9] bg-[#f5f5f5] p-3">
                <p className="mb-2 text-sm text-neutral-500">
                  O que você fez nesse atendimento
                </p>

                <ServicosSelecionados
                  services={services}
                  onRemove={(id: string) =>
                    setServices((prev) => prev.filter((s) => s.service_id !== id))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-[#d9d9d9] bg-white p-3">
                <p className="text-xs text-neutral-500">Total dos serviços</p>
                <p className="mt-1 text-base font-semibold">
                  {formatCurrency(totalServicos)}
                </p>
              </div>

              <div className="rounded-2xl border border-[#d9d9d9] bg-white p-3">
                <p className="text-xs text-neutral-500">
                  Quanto entrou nesse atendimento
                </p>
                <div className="mt-1">
                  <FormInput
                    value={valorCobrado}
                    onChange={(value: any) => setValorCobrado(maskCurrencyInput(value))}
                    placeholder="0,00 (opcional)"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#d9d9d9] bg-white p-3">
                <p className="text-xs text-neutral-500">Diferença no valor cobrado</p>
                <p className="mt-1 text-sm text-neutral-600">
                  {diferenca === 0 && "Cobrança exata"}
                  {diferenca > 0 &&
                    `Cobrou a mais do que o padrão: ${formatCurrency(diferenca)}`}
                  {diferenca < 0 &&
                    `Deu desconto de ${formatCurrency(Math.abs(diferenca))}`}
                </p>
              </div>
            </div>

            <FormField label="Algo importante sobre esse atendimento (opcional)">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-2xl border border-[#d9d9d9] px-3 py-2 text-sm text-black focus:border-[#bfd0fb] focus:outline-none focus:ring-0"
              />
            </FormField>

            <ModalActions
              onCancel={onClose}
              onSave={() => salvar(true)}
              onSaveAndContinue={() => salvar(false)}
            />
          </div>
        </div>
      </Modal>

      {openClienteModal && (
        <ContatoModal
          modalTipo="cliente"
          fecharModal={() => setOpenClienteModal(false)}
          contatos={{
            ...contatos,
            refetch: loadClientes,
          }}
          onCreated={(novo: { id: string }) => {
            void loadClientes()
            setContactId(novo.id)
          }}
        />
      )}

      {openServicoModal && (
        <ServicoModal
          modalTipo="servico"
          fecharModal={() => setOpenServicoModal(false)}
          servicos={{
            ...servicosHook,
            refetch: loadServicos,
          }}
          onCreated={() => {
            void loadServicos()
          }}
        />
      )}
    </>
  )
}