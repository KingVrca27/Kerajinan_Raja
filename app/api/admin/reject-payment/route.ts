import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { createRouteHandlerClient } from "@/src/lib/supabaseServerRoute";

export async function POST(req: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(req);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (userError || !userData || !["admin", "superadmin"].includes(userData.role)) {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const { order_id, reason } = await req.json();

    if (!order_id || !reason || typeof reason !== "string" || reason.trim() === "") {
      return NextResponse.json({ error: "order_id dan reason wajib diisi" }, { status: 400 });
    }

    // Verify order state before updating
    const { data: existingOrder, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("payment_method, payment_proof_path, payment_status")
      .eq("id", order_id)
      .maybeSingle();

    if (fetchError || !existingOrder) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    if (existingOrder.payment_method !== "TRANSFER_BANK" || !existingOrder.payment_proof_path) {
      return NextResponse.json({ error: "Pesanan ini tidak memerlukan verifikasi bukti pembayaran" }, { status: 400 });
    }

    if (existingOrder.payment_status !== "unpaid") {
      return NextResponse.json({ error: "Pesanan ini sudah diverifikasi atau tidak dapat ditolak lagi" }, { status: 400 });
    }

    // Update order
    const { data: order, error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "unpaid",
        payment_verified_at: null,
        payment_verified_by: null,
        payment_rejection_reason: reason.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id)
      .select("id, order_number")
      .single();

    if (updateError || !order) {
      console.error("[RejectPayment] Failed to update order:", updateError);
      return NextResponse.json({ error: "Gagal menolak pembayaran" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Pembayaran berhasil ditolak" });

  } catch (error) {
    console.error("[RejectPayment] Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
