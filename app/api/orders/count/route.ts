import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/src/lib/supabaseServerRoute";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";

/**
 * GET /api/orders/count
 *
 * Mengembalikan jumlah pesanan aktif (bukan cancelled/refunded/delivered)
 * milik customer yang sedang login.
 *
 * Digunakan oleh OrderBadge di Navbar untuk menampilkan badge jumlah pesanan.
 *
 * Returns:
 *   200 { count: number }
 *   401 jika tidak terautentikasi
 *   500 jika server error
 */
export async function GET(req: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(req);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve customer_id dari user_id
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (customerError) {
      console.error("[/api/orders/count] Error resolving customer:", customerError.message);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    if (!customer) {
      // User belum punya customer record → 0 pesanan
      return NextResponse.json({ count: 0 });
    }

    // Hitung pesanan aktif (bukan cancelled, refunded, atau delivered)
    const { count, error: countError } = await supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customer.id)
      .not("status", "in", '("cancelled","refunded","delivered")');

    if (countError) {
      console.error("[/api/orders/count] Error counting orders:", countError.message);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (err) {
    console.error("[/api/orders/count] Unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
