import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function PATCH(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Konfigurasi server tidak lengkap." },
        { status: 500 }
      );
    }

    // 1. Ambil payload
    const body = await request.json();
    const { target_user_id, role, is_active, full_name, avatar_url } = body;

    // 2. Validasi target_user_id (wajib UUID)
    if (!target_user_id || typeof target_user_id !== "string") {
      return NextResponse.json(
        { error: "target_user_id wajib disertakan dan harus berupa string UUID." },
        { status: 400 }
      );
    }

    // Cek field yang tidak diizinkan (Mass Assignment Prevention)
    const allowedFields = ["target_user_id", "role", "is_active", "full_name", "avatar_url"];
    const inputKeys = Object.keys(body);
    for (const key of inputKeys) {
      if (!allowedFields.includes(key)) {
        return NextResponse.json(
          { error: `Field '${key}' tidak diizinkan.` },
          { status: 400 }
        );
      }
    }

    // 3. Verifikasi token pemanggil
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

    // 4. Inisialisasi admin client untuk operasi privileged
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Ambil data pemanggil sebenarnya dari database (jangan percaya token/client)
    const { data: callerData, error: dbError } = await supabaseAdmin
      .from("users")
      .select("role, is_active")
      .eq("id", callerUser.id)
      .single();

    if (dbError || !callerData || !callerData.is_active) {
      return NextResponse.json(
        { error: "Akun Anda tidak aktif atau tidak ditemukan." },
        { status: 403 }
      );
    }

    const callerRole = callerData.role;

    // 5. Validasi Aturan Keamanan dan Siapkan payload update
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    let hasUpdates = false;

    // A. Aturan untuk 'role' dan 'is_active' (Hanya Superadmin)
    if (role !== undefined || is_active !== undefined) {
      if (callerRole !== "superadmin") {
        return NextResponse.json(
          { error: "Hanya superadmin yang diizinkan mengubah role atau status aktif." },
          { status: 403 }
        );
      }

      if (role !== undefined) {
        if (role !== "admin" && role !== "superadmin") {
          return NextResponse.json(
            { error: "Role hanya boleh bernilai 'admin' atau 'superadmin'." },
            { status: 400 }
          );
        }
        updatePayload.role = role;
        hasUpdates = true;
      }

      if (is_active !== undefined) {
        if (typeof is_active !== "boolean") {
          return NextResponse.json(
            { error: "is_active harus berupa boolean." },
            { status: 400 }
          );
        }
        updatePayload.is_active = is_active;
        hasUpdates = true;
      }
    }

    // B. Aturan untuk 'full_name'
    if (full_name !== undefined) {
      if (typeof full_name !== "string" || full_name.trim().length < 2) {
        return NextResponse.json(
          { error: "full_name harus berupa string dan minimal 2 karakter." },
          { status: 400 }
        );
      }

      // full_name hanya boleh diubah oleh user itu sendiri (self-service)
      if (callerUser.id !== target_user_id) {
        return NextResponse.json(
          { error: "Nama hanya dapat diubah oleh pemilik akun sendiri." },
          { status: 403 }
        );
      }

      updatePayload.full_name = full_name.trim();
      hasUpdates = true;
    }

    // C. Aturan untuk 'avatar_url' (self-service only)
    if (avatar_url !== undefined) {
      // null berarti hapus avatar
      if (avatar_url !== null && typeof avatar_url !== "string") {
        return NextResponse.json(
          { error: "avatar_url harus berupa string URL atau null." },
          { status: 400 }
        );
      }

      // avatar_url hanya boleh diubah oleh user itu sendiri
      if (callerUser.id !== target_user_id) {
        return NextResponse.json(
          { error: "Avatar hanya dapat diubah oleh pemilik akun sendiri." },
          { status: 403 }
        );
      }

      updatePayload.avatar_url = avatar_url ?? null;
      hasUpdates = true;
    }

    if (!hasUpdates) {
      return NextResponse.json(
        { error: "Tidak ada data valid yang dikirim untuk diperbarui." },
        { status: 400 }
      );
    }

    // 6. Jalankan update dengan supabaseAdmin
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update(updatePayload)
      .eq("id", target_user_id);

    if (updateError) {
      console.error("[Update Admin API] Database Error:", updateError);
      return NextResponse.json(
        { error: "Gagal memperbarui profil pengguna di database." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("[Update Admin API] Internal Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
