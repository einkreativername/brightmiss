import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes
  const publicRoutes = ['/', '/login', '/register']
  const inviteRoute = pathname.startsWith('/invite/')

  if (publicRoutes.includes(pathname) || inviteRoute) {
    return NextResponse.next()
  }

  // For all other routes, let Next.js handle auth checks server-side
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
