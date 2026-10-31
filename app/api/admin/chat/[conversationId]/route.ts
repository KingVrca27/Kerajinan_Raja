import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { createRouteHandlerClient } from "@/src/lib/supabaseServerRoute";

interface RouteContext {
  params: Promise<{ conversationId: string }>;
}

/**
 * GET /api/admin/chat/[conversationId]
 * Mengambil seluruh pesan dalam satu conversation.
 * Hanya dapat diakses oleh admin/superadmin.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { conversationId } = await context.params;

    // 1. Verifikasi session admin
    const { supabase } = createRouteHandlerClient(req);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verifikasi role
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (
      userError ||
      !userData ||
      !userData.is_active ||
      !["admin", "superadmin"].includes(userData.role)
    ) {
      return NextResponse.json(
        { error: "Forbidden: Admins only" },
        { status: 403 }
      );
    }

    // 3. Verifikasi conversation exists (IDOR protection — pastikan ID valid di DB)
    const { data: conv, error: convError } = await supabaseAdmin
      .from("conversations")
      .select("id, customer_id, product_id, status, customers:customer_id(id, user_id, full_name, email), products:product_id(id, name, slug)")
      .eq("id", conversationId)
      .maybeSingle();

    if (convError || !conv) {
      return NextResponse.json(
        { error: "Percakapan tidak ditemukan." },
        { status: 404 }
      );
    }

    // 4. Ambil semua pesan dalam conversation ini
    const { data: messages, error: msgError } = await supabaseAdmin
      .from("messages")
      .select("id, conversation_id, sender_id, content, is_read_by_admin, is_read_by_customer, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (msgError) {
      console.error("[AdminChatMessages:GET] error:", msgError);
      return NextResponse.json(
        { error: "Gagal mengambil pesan." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      conversation: conv,
      messages: messages ?? [],
    });
  } catch (err) {
    console.error("[AdminChatMessages:GET] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/chat/[conversationId]
 * Mengirim pesan balasan dari admin ke dalam sebuah conversation.
 * sender_id diambil dari session yang terautentikasi, bukan dari body request.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { conversationId } = await context.params;

    // 1. Verifikasi session admin
    const { supabase } = createRouteHandlerClient(req);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verifikasi role admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (
      userError ||
      !userData ||
      !userData.is_active ||
      !["admin", "superadmin"].includes(userData.role)
    ) {
      return NextResponse.json(
        { error: "Forbidden: Admins only" },
        { status: 403 }
      );
    }

    // 3. Parse dan validasi body
    let body: { content?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Request body tidak valid." },
        { status: 400 }
      );
    }

    const content = (body.content ?? "").trim();
    if (!content) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Pesan terlalu panjang. Maksimum 2000 karakter." },
        { status: 400 }
      );
    }

    // 4. Verifikasi conversation exists (IDOR protection)
    const { data: conv, error: convCheckError } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .maybeSingle();

    if (convCheckError || !conv) {
      return NextResponse.json(
        { error: "Percakapan tidak ditemukan." },
        { status: 404 }
      );
    }

    // 5. Insert pesan — sender_id adalah auth UID admin, BUKAN dari request body
    const { data: newMsg, error: insertError } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id, // Identitas admin dari session yang terverifikasi
        content,
        is_read_by_admin: true,
        is_read_by_customer: false,
      })
      .select()
      .single();

    if (insertError || !newMsg) {
      console.error("[AdminChatMessages:POST] insert error:", insertError);
      return NextResponse.json(
        { error: "Gagal mengirim pesan." },
        { status: 500 }
      );
    }

    // 6. Update updated_at conversation agar urutan di list tetap up-to-date
    await supabaseAdmin
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    return NextResponse.json({ message: newMsg }, { status: 201 });
  } catch (err) {
    console.error("[AdminChatMessages:POST] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
