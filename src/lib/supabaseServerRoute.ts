import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Membuat Supabase server client yang aware terhadap cookies dari NextRequest.
 * Digunakan di API Route Handlers (tidak bisa menggunakan `cookies()` dari next/headers
 * karena tidak tersedia di konteks Route Handler secara langsung seperti di Server Components).
 *
 * Mengembalikan: { supabase, response }
 * - supabase: client yang sudah di-setup dengan cookie dari request
 * - response: NextResponse yang akan meneruskan cookie updates ke browser
 */
export function createRouteHandlerClient(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  return { supabase, response }
}
