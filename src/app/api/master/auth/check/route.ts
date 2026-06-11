// src/app/api/master/auth/check/route.ts

import { NextRequest } from "next/server"

import {
  apiSuccess,
  ApiError,
  secureRoute,
} from "@/lib/api/secure-api"

import { requireMasterApiUser } from "@/lib/auth/require-master-api"

export async function GET(
  request: NextRequest,
) {
  return secureRoute(async () => {
    const auth =
      await requireMasterApiUser(
        request,
      )

    if (!auth.authorized) {
      return auth.response
    }

    if (
      auth.masterUser.status !==
      "ativo"
    ) {
      throw new ApiError(
        "Usuário master inativo.",
        403,
        "master_inactive",
      )
    }

    return apiSuccess({
      authorized: true,

      masterUser: {
        id: auth.masterUser.id,
        nome:
          auth.masterUser.nome,
        email:
          auth.masterUser.email,
        status:
          auth.masterUser.status,
      },
    })
  })
}