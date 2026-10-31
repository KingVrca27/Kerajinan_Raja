import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with cross-browser cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Helper untuk redirect yang mempertahankan cookies
  const redirect = (pathname: string, searchParams?: URLSearchParams) => {
    const url = request.nextUrl.clone()
    url.pathname = pathname
    if (searchParams) {
      searchParams.forEach((value, key) => {
        url.searchParams.set(key, value)
      })
    }
    const redirectResponse = NextResponse.redirect(url)
    
    // Copy cookies dari supabaseResponse (terutama session yang baru di-refresh/dihapus)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  // 1. Admin Routes
  // Middleware memblokir akses jika tidak ada session untuk route /admin/dashboard
  if (request.nextUrl.pathname.startsWith('/admin/dashboard')) {
    if (!user) {
      return redirect('/admin')
    }
    // Jika ada user (entah customer atau admin), biarkan AdminSessionGuard 
    // yang memvalidasi role-nya di client-side (Layer 2).
    return supabaseResponse
  }

  // Biarkan rute login admin (/admin) dapat diakses
  if (request.nextUrl.pathname === '/admin') {
    return supabaseResponse
  }

  // 2. Protected Customer Routes
  // Misalnya, /profile
  const protectedRoutes = ['/profile', '/account']
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
  
  if (isProtectedRoute && !user) {
    // redirect ke login dengan return URL
    const searchParams = new URLSearchParams()
    searchParams.set('redirect', request.nextUrl.pathname)
    return redirect('/login', searchParams)
  }

  // 3. Auth Routes (Prevent logged-in users from accessing login/register)
  // CATATAN: /reset-password dan /admin/reset-password TIDAK dimasukkan ke sini.
  // Setelah klik link reset password, Supabase menetapkan session untuk user tersebut.
  // Jika reset-password dimasukkan ke authRoutes, middleware akan mendeteksi session
  // dan langsung redirect user sebelum mereka sempat mengubah password.
  // /auth/callback juga dikecualikan agar code-exchange PKCE tidak pernah diinterupsi.
  const authRoutes = ['/login', '/register', '/forgot-password', '/admin/forgot-password']
  const isAuthRoute = authRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  if (isAuthRoute && user) {
    return redirect('/profile')
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
