// middleware.ts

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

const PRIVATE_ROUTES = [
  "/dashboard",
  "/analytics",
  "/assinaturas",
  "/cadastros",
  "/configuracoes",
  "/lancamentos",
  "/relatorios",
]

const MASTER_ROUTES = ["/torre-controle"]

const PUBLIC_AUTH_ROUTES = [
  "/login",
  "/signup",
  "/desafio",
  "/torre-controle/login",
]

function isRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/assets") ||
    pathname.includes(".")
  )
}

function buildRedirectUrl(request: NextRequest, targetPath: string) {
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = targetPath
  redirectUrl.search = ""
  return redirectUrl
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isStaticAsset(pathname)) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPrivateRoute = isRoute(pathname, PRIVATE_ROUTES)
  const isMasterRoute = isRoute(pathname, MASTER_ROUTES)
  const isPublicAuthRoute = isRoute(pathname, PUBLIC_AUTH_ROUTES)

  if (isMasterRoute && pathname !== "/torre-controle/login" && !user) {
    return NextResponse.redirect(
      buildRedirectUrl(request, "/torre-controle/login"),
    )
  }

  if (isPrivateRoute && !user) {
    const redirectUrl = buildRedirectUrl(request, "/login")
    redirectUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if ((pathname === "/login" || pathname === "/signup") && user) {
    return NextResponse.redirect(buildRedirectUrl(request, "/dashboard"))
  }

  if (isPublicAuthRoute) {
    return response
  }

  return response
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/analytics/:path*",
    "/assinaturas/:path*",
    "/cadastros/:path*",
    "/configuracoes/:path*",
    "/lancamentos/:path*",
    "/relatorios/:path*",
    "/torre-controle/:path*",
    "/login",
    "/signup",
  ],
}