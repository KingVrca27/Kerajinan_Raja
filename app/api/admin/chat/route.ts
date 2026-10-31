import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { createRouteHandlerClient } from "@/src/lib/supabaseServerRoute";

/**
 * GET /api/admin/chat
 * Mengambil daftar seluruh percakapan (conversations) beserta relasi customer dan produk.
 * Hanya dapat diakses oleh admin atau superadmin yang sudah login.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Verifikasi session admin menggunakan cookie dari request
    const { supabase } = createRouteHandlerClient(req);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verifikasi role admin di server (jangan percaya client)
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

    // 3. Ambil seluruh conversations dengan relasi customer dan produk
    // Menggunakan supabaseAdmin agar dapat melewati RLS (admin dapat melihat semua conversation)
    const { data: conversations, error: convError } = await supabaseAdmin
      .from("conversations")
      .select(`
        id,
        customer_id,
        product_id,
        status,
        created_at,
        updated_at,
        customers:customer_id ( id, user_id, full_name, email ),
        products:product_id ( id, name, slug )
      `)
      .order("updated_at", { ascending: false });

    if (convError) {
      console.error("[AdminChat:GET] conversations error:", convError);
      return NextResponse.json(
        { error: "Gagal mengambil data percakapan." },
        { status: 500 }
      );
    }

    // 4. Ambil pesan terakhir & hitung unread untuk setiap conversation
    const convIds = (conversations ?? []).map((c: { id: string }) => c.id);
    let lastMessages: Record<string, { content: string; created_at: string; sender_id: string }> = {};
    let unreadCounts: Record<string, number> = {};

    if (convIds.length > 0) {
      // Ambil semua messages dari conversations ini, ambil 1 terakhir per conversation
      const { data: messages } = await supabaseAdmin
        .from("messages")
        .select("conversation_id, content, created_at, sender_id")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false });

      if (messages) {
        for (const msg of messages) {
          if (!lastMessages[msg.conversation_id]) {
            lastMessages[msg.conversation_id] = {
              content: msg.content,
              created_at: msg.created_at,
              sender_id: msg.sender_id,
            };
          }
        }
      }
      // Hitung unread count terpisah agar lebih akurat dan ringan.
      const { data: unreads } = await supabaseAdmin
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", convIds)
        .eq("is_read_by_admin", false);
        
      if (unreads) {
        for (const u of unreads) {
          unreadCounts[u.conversation_id] = (unreadCounts[u.conversation_id] || 0) + 1;
        }
      }
    }

    // 5. Gabungkan lastMessage dan unread_count ke setiap conversation
    const result = (conversations ?? []).map((c: { id: string; [key: string]: unknown }) => ({
      ...c,
      last_message: lastMessages[c.id] ?? null,
      unread_count: unreadCounts[c.id] || 0,
    }));

    return NextResponse.json({ conversations: result });
  } catch (err) {
    console.error("[AdminChat:GET] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
