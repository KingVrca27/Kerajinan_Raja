import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Environment variable validation
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "[Supabase] Missing environment variable: NEXT_PUBLIC_SUPABASE_URL\n" +
      "Pastikan variabel ini sudah didefinisikan di file .env.local Anda.\n" +
      "Contoh: NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co"
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "[Supabase] Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY\n" +
      "Pastikan variabel ini sudah didefinisikan di file .env.local Anda.\n" +
      "Contoh: NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>"
  );
}

// ---------------------------------------------------------------------------
// Supabase client instance (singleton)
// Digunakan di seluruh project — jangan buat instance baru di tempat lain.
// ---------------------------------------------------------------------------

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
