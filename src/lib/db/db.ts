// src/lib/db/db.ts

import { createClient } from "@/lib/supabase/client"
import { DB_TABLES } from "./tables"

export function db() {

  const supabase = createClient()

  return {

    transactions() {
      return supabase.from(DB_TABLES.TRANSACTIONS)
    },

    transactionServices() {
      return supabase.from(DB_TABLES.TRANSACTION_SERVICES)
    },

    contacts() {
      return supabase.from(DB_TABLES.CONTACTS)
    },

    services() {
      return supabase.from(DB_TABLES.SERVICES)
    },

    categories() {
      return supabase.from(DB_TABLES.CATEGORIES)
    },

    businessUsers() {
      return supabase.from(DB_TABLES.BUSINESS_USERS)
    },

    goals() {
      return supabase.from(DB_TABLES.GOALS)
    }

  }

}