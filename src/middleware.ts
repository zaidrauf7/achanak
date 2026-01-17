import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')
  const { pathname } = request.nextUrl

  // Limit access to internal app pages
  const protectedRoutes = ['/dashboard', '/create-order', '/menu', '/orders', '/dine-in', '/staff']
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-based protection
  if (token) {
      try {
        // Simple decode for routing (verification happens on API)
        const payload = JSON.parse(atob(token.value.split('.')[1]));
        const role = payload.role;

        // Owner Restrictions: Can only see /dashboard and /staff (and potentially /settings if added)
        // Cannot see: /orders, /create-order, /menu, /dine-in
        if (role === 'owner') {
             const ownerRestricted = ['/orders', '/create-order', '/menu', '/dine-in'];
             if (ownerRestricted.some(r => pathname.startsWith(r))) {
                 return NextResponse.redirect(new URL('/dashboard', request.url));
             }
        }

        // Manager Restrictions: Cannot see /staff
        // Maybe restricting dashboard for managers? User didn't explicitly ask, but previous logic hinted at strict separate views.
        // For now, blocking /staff for non-owners.
        if (role !== 'owner' && pathname.startsWith('/staff')) {
            return NextResponse.redirect(new URL('/create-order', request.url));
        }

        // Redirect logged-in users away from login page
        if (pathname === '/login') {
             if (role === 'owner') return NextResponse.redirect(new URL('/dashboard', request.url));
             return NextResponse.redirect(new URL('/create-order', request.url));
        }

      } catch (e) {
          // If token is malformed, maybe clear it or ignore?
          // For now let strictly protected routes fail if verified by server components
      }
  }

  return NextResponse.next()
}
 
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/create-order/:path*', 
    '/menu/:path*', 
    '/login', 
    '/orders/:path*', 
    '/dine-in/:path*',
    '/staff/:path*'
  ],
}
