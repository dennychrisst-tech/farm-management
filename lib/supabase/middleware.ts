import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and getUser -- it can
  // desync the session cookie and randomly log users out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // The password-recovery callback manages its own redirects (it exchanges
  // the recovery code for a session before a user cookie exists yet), so it
  // must never be intercepted by the checks below.
  if (pathname.startsWith("/auth/confirm")) {
    return supabaseResponse
  }

  const isPublicAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register")
  const isPasswordResetRoute =
    pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password")

  if (!user && !isPublicAuthRoute && !isPasswordResetRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (user && isPublicAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/home"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
