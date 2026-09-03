import { type NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|swe-worker|icon|apple-icon|videos/|images/|.well-known/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|mov|js|json|txt|xml|ico)$).*)",
  ],
}
