// src/lib/api/rate-limit.ts

import { NextRequest } from "next/server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { ApiError, getRequestIp } from "@/lib/api/secure-api"

type RateLimitOptions = {
  key: string
  limit: number
  windowSeconds: number
  message?: string
}

export async function enforceRateLimit(
  request: NextRequest,
  {
    key,
    limit,
    windowSeconds,
    message = "Muitas tentativas. Aguarde um pouco e tente novamente.",
  }: RateLimitOptions,
) {
  const ip = getRequestIp(request)
  const since = new Date(
    Date.now() - windowSeconds * 1000,
  ).toISOString()

  const { count, error } = await supabaseAdmin
    .from("ci_security_logs")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("event_type", key)
    .eq("ip_address", ip)
    .gte("created_at", since)

  if (error) {
    console.error("[rate-limit] erro:", error)
    return
  }

  if ((count ?? 0) >= limit) {
    throw new ApiError(
      message,
      429,
      "rate_limited",
    )
  }
}