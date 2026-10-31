import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/src/lib/supabaseServerRoute";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";

/**
 * POST /api/profile/update
 *
 * Update (atau buat) profil customer yang sedang login.
 *
 * KEAMANAN:
 * - Identity bersumber dari server-side session (cookie), bukan dari request body.
 * - user_id tidak pernah diambil dari body/query params.
 * - supabaseAdmin hanya digunakan setelah identity diverifikasi dari session.
 * - Password tidak pernah diproses di sini (ditangani Supabase Auth langsung).
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verifikasi session dari cookie
    const { supabase } = createRouteHandlerClient(req);
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse body — hanya field yang diizinkan
    const body = await req.json();
    const fullName = typeof body.full_name === "string" ? body.full_name.trim() : null;
    const phone = typeof body.phone === "string" ? body.phone.trim() : null;

    // 3. Cek apakah sudah ada customer record untuk user ini
    const { data: existing } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (existing) {
      // 4a. Update record yang ada — identity diverifikasi via user_id dari session
      const { error } = await supabaseAdmin
        .from("customers")
        .update({
          full_name: fullName || null,
          phone: phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", authUser.id); // Kunci keamanan: selalu filter by auth.uid()

      if (error) {
        console.error("[ProfileUpdate] Update error:", error.message);
        return NextResponse.json({ error: "Gagal memperbarui profil." }, { status: 500 });
      }
    } else {
      // 4b. Buat record baru dan kaitkan ke auth user
      const { error } = await supabaseAdmin.from("customers").insert({
        user_id: authUser.id,
        email: authUser.email || "",
        full_name: fullName || null,
        phone: phone || null,
      });

      if (error) {
        // Handle duplicate (race condition)
        if (error.code === "23505") {
          // unique violation
          return NextResponse.json({ error: "Profil sudah ada. Silakan coba lagi." }, { status: 409 });
        }
        console.error("[ProfileUpdate] Insert error:", error.message);
        return NextResponse.json({ error: "Gagal membuat profil." }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[ProfileUpdate] Unexpected error:", err.message);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
