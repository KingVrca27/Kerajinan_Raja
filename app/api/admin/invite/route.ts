import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Menggunakan tipe dari auth-js untuk kemudahan pengecekan
import type { AdminRole } from "@/src/types/admin";

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[Invite API] SUPABASE_SERVICE_ROLE_KEY is missing");
      return NextResponse.json(
        { error: "Konfigurasi server tidak lengkap (Service Role Key belum disetel)." },
        { status: 500 }
      );
    }

    // Ambil body request
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Data email dan role wajib diisi." },
        { status: 400 }
      );
    }

    // Ambil header authorization untuk mengecek siapa yang meng-invite
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Inisialisasi client biasa (anon key) untuk memverifikasi session si pemanggil
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user: callerUser }, error: callerError } = await supabaseAnon.auth.getUser(token);
    
    if (callerError || !callerUser) {
      return NextResponse.json({ error: "Invalid token atau sesi telah kedaluwarsa." }, { status: 401 });
    }

    // Inisialisasi admin client untuk operasi khusus
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Pastikan yang memanggil (caller) adalah Super Admin atau Admin yang punya hak
    const { data: callerData, error: dbError } = await supabaseAdmin
      .from("users")
      .select("role, is_active")
      .eq("id", callerUser.id)
      .single();

    if (dbError || !callerData || !callerData.is_active || callerData.role !== "superadmin") {
      return NextResponse.json(
        { error: "Hanya Super Admin aktif yang diizinkan untuk mengundang admin baru." },
        { status: 403 }
      );
    }

    // 2. Cek apakah email sudah ada di tabel users
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: `Email "${email}" sudah terdaftar.` },
        { status: 400 }
      );
    }

    // 3. Invite user via Supabase Auth Admin API
    // Perhatikan: origin bisa berbeda di Vercel, kita gunakan NEXT_PUBLIC_SITE_URL jika ada
    const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                        request.headers.get("origin") || 
                        "http://localhost:3000";

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.toLowerCase(),
      {
        redirectTo: `${redirectUrl}/admin/reset-password`,
      }
    );

    if (inviteError) {
      return NextResponse.json(
        { error: `Gagal mengirim undangan: ${inviteError.message}` },
        { status: 500 }
      );
    }

    // 4. Masukkan ke tabel users profil menggunakan ID dari auth.users
    const userId = inviteData.user.id;
    
    const { error: insertError } = await supabaseAdmin.from("users").insert({
      id: userId,
      full_name: null,
      email: email.toLowerCase(),
      role: role as AdminRole,
      is_active: true,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      // Jika insert gagal, sebaiknya hapus user dari auth agar konsisten
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: `Gagal menyimpan profil admin: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Undangan berhasil dikirim." },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("[Invite API] Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
