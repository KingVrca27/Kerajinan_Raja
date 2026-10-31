import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Supabase Admin Client — menggunakan SERVICE_ROLE_KEY
// Hanya digunakan di server-side (API Routes / Server Actions).
// JANGAN pernah di-export ke client components atau dipakai di browser.
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "[SupabaseAdmin] Missing environment variable: NEXT_PUBLIC_SUPABASE_URL"
  );
}

if (!serviceRoleKey) {
  throw new Error(
    "[SupabaseAdmin] Missing environment variable: SUPABASE_SERVICE_ROLE_KEY\n" +
      "Pastikan variabel ini sudah didefinisikan di file .env.local Anda."
  );
}

/**
 * Admin client dengan SERVICE_ROLE_KEY.
 * Melewati RLS — gunakan hanya di server-side untuk operasi yang
 * memerlukan akses penuh ke tabel (checkout, lacak pesanan, dsb.).
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
