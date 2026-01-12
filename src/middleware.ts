import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')
  const { pathname } = request.nextUrl

  // Limit access to internal app pages
  const protectedRoutes = ['/dashboard', '/create-order', '/menu', '/orders']
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If logged in and trying to go to login, redirect to dashboard
  if (pathname === '/login' && token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}
 
export const config = {
  matcher: ['/dashboard/:path*', '/create-order/:path*', '/menu/:path*', '/login', '/orders/:path*'],
}
