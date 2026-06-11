// src/types/contact.ts

export type ContactType = "client" | "supplier"

export type Contact = {
  id: string
  business_id: string

  name: string
  type: ContactType

  whatsapp: string
  email?: string | null

  notes?: string | null   // 👈 ESTA LINHA É A CORREÇÃO

  created_at?: string
}