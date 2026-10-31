import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Auth Callback Route Handler
 *
 * Menangani dua skenario Supabase Auth dengan PKCE flow:
 * 1. Email confirmation (sign-up verify): GET /auth/callback?code=<code>
 * 2. Password reset (recovery): GET /auth/callback?code=<code>&type=recovery
 *
 * Proses:
 *   - Tukar `code` → session via exchangeCodeForSession()
 *   - Untuk recovery → redirect ke halaman reset-password yang sesuai
 *   - Untuk email confirm → redirect ke /login dengan status sukses
 *   - Error → redirect ke /login dengan error
 *
 * CATATAN KEAMANAN:
 *   - Code PKCE hanya bisa digunakan sekali (one-time use).
 *   - Session hanya dibuat jika code valid dan belum kedaluwarsa.
 *   - Tidak ada data sensitif yang dikembalikan ke browser.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const type = searchParams.get('type') // 'recovery' | 'signup' | undefined

  // Jika tidak ada code, arahkan ke login dengan pesan error
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    // Link kedaluwarsa atau sudah digunakan
    console.error('[Auth Callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
  }

  // Sukses: tentukan redirect berdasarkan type
  if (type === 'recovery') {
    // Password reset flow — arahkan ke halaman reset-password
    // Cek apakah ini dari alur admin (origin-nya bisa dibaca dari referrer, tapi
    // lebih aman pakai query param yang dikirim via redirectTo pada forgot-password).
    const next = searchParams.get('next') ?? '/reset-password'
    // Validasi keamanan: hanya izinkan path internal
    if (next.startsWith('/') && !next.startsWith('//') && !next.includes('://')) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}/reset-password`)
  }

  // Default: email confirmation berhasil → arahkan ke login
  return NextResponse.redirect(`${origin}/login?confirmed=1`)
}
