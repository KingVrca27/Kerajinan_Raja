import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Konfigurasi server tidak lengkap (Service Role Key belum disetel)." },
        { status: 500 }
      );
    }

    // Ambil target user ID dari body
    const { target_user_id } = await request.json();

    if (!target_user_id) {
      return NextResponse.json(
        { error: "ID admin yang akan dihapus tidak disertakan." },
        { status: 400 }
      );
    }

    // Ambil header authorization untuk mengecek siapa pemanggil API
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Inisialisasi client anon untuk memverifikasi token caller
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user: callerUser }, error: callerError } = await supabaseAnon.auth.getUser(token);
    
    if (callerError || !callerUser) {
      return NextResponse.json({ error: "Invalid token atau sesi kedaluwarsa." }, { status: 401 });
    }

    // Cegah penghapusan diri sendiri
    if (callerUser.id === target_user_id) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus akun Anda sendiri." },
        { status: 403 }
      );
    }

    // Inisialisasi admin client untuk melakukan operasi privileged
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Verifikasi bahwa caller adalah Super Admin
    const { data: callerData, error: dbError } = await supabaseAdmin
      .from("users")
      .select("role, is_active")
      .eq("id", callerUser.id)
      .single();

    if (dbError || !callerData || !callerData.is_active || callerData.role !== "superadmin") {
      return NextResponse.json(
        { error: "Hanya Super Admin aktif yang diizinkan menghapus akun." },
        { status: 403 }
      );
    }

    // 2. Pastikan akun yang akan dihapus statusnya dinonaktifkan
    const { data: targetData, error: targetError } = await supabaseAdmin
      .from("users")
      .select("is_active, full_name")
      .eq("id", target_user_id)
      .single();
      
    if (targetError || !targetData) {
      return NextResponse.json(
        { error: "Admin tidak ditemukan di database." },
        { status: 404 }
      );
    }

    if (targetData.is_active) {
      return NextResponse.json(
        { error: "Gagal: Anda hanya dapat menghapus akun yang telah dinonaktifkan." },
        { status: 400 }
      );
    }

    // 3. Hapus dari Supabase Auth terlebih dahulu
    // Jika user tidak ada di auth (misal dibuat manual), lanjut ke langkah 4
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(target_user_id);
    
    if (deleteAuthError) {
      // Jika error adalah "User not found", berarti akun ini hanya ada di tabel users
      // (dibuat manual / tidak melalui invite), kita tetap lanjutkan penghapusan profil
      const isNotFound = deleteAuthError.message.toLowerCase().includes("user not found") ||
                         deleteAuthError.message.toLowerCase().includes("not found");
      if (!isNotFound) {
        return NextResponse.json(
          { error: `Gagal menghapus kredensial login: ${deleteAuthError.message}` },
          { status: 500 }
        );
      }
      // Jika "not found", log saja dan lanjut hapus profil
      console.warn(`[Delete Admin API] User ${target_user_id} tidak ada di auth.users, melanjutkan hapus profil...`);
    }

    // 4. Hapus profil dari tabel users
    const { error: deleteProfileError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", target_user_id);

    if (deleteProfileError) {
      return NextResponse.json(
        { error: `Gagal menghapus profil dari database: ${deleteProfileError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: `Akun ${targetData.full_name} berhasil dihapus permanen.` },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("[Delete Admin API] Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server saat menghapus akun." },
      { status: 500 }
    );
  }
}
