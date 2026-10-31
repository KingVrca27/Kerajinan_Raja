import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { createRouteHandlerClient } from "@/src/lib/supabaseServerRoute";

/**
 * POST /api/chat/[conversationId]/read
 * Menandai pesan dalam percakapan sebagai telah dibaca oleh pelanggan.
 * Hanya pemilik conversation (customer) yang dapat mengakses ini.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const { supabase } = createRouteHandlerClient(req);

    // 1. Verifikasi session pengguna
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Resolve customers.id dari auth.uid()
    const { data: customerData, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (customerError || !customerData) {
      return NextResponse.json({ error: "Customer profile not found" }, { status: 404 });
    }

    // 3. Verifikasi ownership conversation
    const { data: conv, error: convError } = await supabaseAdmin
      .from("conversations")
      .select("customer_id")
      .eq("id", conversationId)
      .maybeSingle();

    if (convError || !conv) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (conv.customer_id !== customerData.id) {
      return NextResponse.json(
        { error: "Forbidden: Not your conversation" },
        { status: 403 }
      );
    }

    // 3. Update pesan yang belum dibaca (dikirim oleh admin)
    // Karena ini menggunakan supabaseAdmin, RLS dilewati. 
    // Kita membatasi hanya pesan milik conversationId, dan di mana is_read_by_customer = false.
    const { error: updateError } = await supabaseAdmin
      .from("messages")
      .update({ is_read_by_customer: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id) // Pesan bukan dari diri sendiri
      .eq("is_read_by_customer", false);

    if (updateError) {
      console.error("[CustomerChat:Read] update error:", updateError);
      return NextResponse.json(
        { error: "Gagal menandai pesan sebagai dibaca." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[CustomerChat:Read] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
