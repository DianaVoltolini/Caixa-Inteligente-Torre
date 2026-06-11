// src/lib/api/security-log.ts

import { NextRequest } from "next/server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  getRequestIp,
  getUserAgent,
} from "@/lib/api/secure-api"

type SecurityLogSeverity =
  | "info"
  | "warning"
  | "critical"

type SecurityLogInput = {
  request: NextRequest
  eventType: string
  severity?: SecurityLogSeverity
  userId?: string | null
  businessId?: string | null
  email?: string | null
  message?: string | null
  metadata?: Record<string, unknown>
}

export async function createSecurityLog({
  request,
  eventType,
  severity = "info",
  userId = null,
  businessId = null,
  email = null,
  message = null,
  metadata = {},
}: SecurityLogInput) {
  try {
    await supabaseAdmin
      .from("ci_security_logs")
      .insert({
        event_type: eventType,
        severity,
        user_id: userId,
        business_id: businessId,
        email,
        ip_address: getRequestIp(request),
        user_agent: getUserAgent(request),
        route: request.nextUrl.pathname,
        method: request.method,
        message,
        metadata,
      })
  } catch (error) {
    console.error(
      "[security-log] Não foi possível registrar log:",
      error,
    )
  }
}