import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { createRouteHandlerClient } from "@/src/lib/supabaseServerRoute";

/**
 * POST /api/admin/chat/[conversationId]/read
 * Menandai pesan dalam percakapan sebagai telah dibaca oleh admin.
 * Hanya dapat diakses oleh admin/superadmin.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const { supabase } = createRouteHandlerClient(req);

    // 1. Verifikasi session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verifikasi role admin
    const { data: userData, error: roleError } = await supabaseAdmin
      .from("users")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (
      roleError ||
      !userData ||
      !userData.is_active ||
      !["admin", "superadmin"].includes(userData.role)
    ) {
      return NextResponse.json(
        { error: "Forbidden: Admins only" },
        { status: 403 }
      );
    }

    // 3. Update pesan yang belum dibaca (dikirim oleh customer)
    // Pesan milik customer tidak ditandai oleh admin sendiri (sender_id bukan admin ini/siapapun dari admin)
    // Sebaiknya kita cek berdasarkan conversation ini dan `is_read_by_admin = false`. 
    // Pesan dari admin sendiri tidak perlu di-update (is_read_by_admin sudah true saat dikirim, atau tidak masalah diupdate jadi true).
    const { error: updateError } = await supabaseAdmin
      .from("messages")
      .update({ is_read_by_admin: true })
      .eq("conversation_id", conversationId)
      .eq("is_read_by_admin", false);

    if (updateError) {
      console.error("[AdminChat:Read] update error:", updateError);
      return NextResponse.json(
        { error: "Gagal menandai pesan sebagai dibaca." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[AdminChat:Read] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
