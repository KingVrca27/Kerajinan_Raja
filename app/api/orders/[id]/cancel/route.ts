import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/src/lib/supabaseServerRoute";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { activityLogRepository } from "@/src/lib/activityLogRepository";

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID tidak valid." }, { status: 400 });
    }

    const { supabase } = createRouteHandlerClient(req);
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Ambil customer ID dari user login
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (customerError) {
      console.error("[OrderCancel] DB error fetch customer:", customerError.message);
      return NextResponse.json({ success: false, error: "Gagal membatalkan pesanan." }, { status: 500 });
    }

    if (!customer) {
      return NextResponse.json({ success: false, error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    const customerId = customer.id;

    // Ambil detail order dengan ownership
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, status, payment_status")
      .eq("id", orderId)
      .eq("customer_id", customerId)
      .maybeSingle();

    if (orderError) {
      console.error("[OrderCancel] DB error fetch order:", orderError.message);
      return NextResponse.json({ success: false, error: "Gagal membatalkan pesanan." }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({ success: false, error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    // Validasi aturan pembatalan
    if (order.status === "shipped") {
      return NextResponse.json(
        { success: false, error: "Pesanan yang sudah dikirim tidak dapat dibatalkan." },
        { status: 400 }
      );
    }

    if (order.status === "delivered") {
      return NextResponse.json(
        { success: false, error: "Pesanan yang sudah selesai tidak dapat dibatalkan." },
        { status: 400 }
      );
    }

    if (order.status === "cancelled" || order.status === "refunded") {
      return NextResponse.json(
        { success: false, error: "Pesanan sudah dibatalkan atau dikembalikan." },
        { status: 400 }
      );
    }

    if (order.payment_status === "paid") {
      return NextResponse.json(
        { success: false, error: "Pesanan yang sudah dibayar tidak dapat dibatalkan. Silakan hubungi admin." },
        { status: 400 }
      );
    }

    if (!["pending", "confirmed"].includes(order.status)) {
      return NextResponse.json(
        { success: false, error: "Pesanan dalam status ini tidak dapat dibatalkan." },
        { status: 400 }
      );
    }

    // Double-lock update
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ 
        status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId)
      .eq("customer_id", customerId)
      .in("status", ["pending", "confirmed"])
      .neq("payment_status", "paid")
      .select()
      .maybeSingle();

    if (updateError) {
      console.error("[OrderCancel] DB error update order:", updateError.message);
      return NextResponse.json({ success: false, error: "Gagal membatalkan pesanan." }, { status: 500 });
    }

    if (!updateData) {
      // Tidak ada row yang ter-update (mungkin race condition)
      return NextResponse.json(
        { success: false, error: "Gagal membatalkan pesanan. Status pesanan mungkin telah berubah." },
        { status: 400 }
      );
    }
    
    // Opsional: Log Activity jika perlu
    // await activityLogRepository.logActivity(...) jika customer side activity log ada, 
    // namun biasanya activityLogRepository untuk Admin. Kita abaikan saja jika tidak diwajibkan.

    return NextResponse.json({
      success: true,
      message: "Pesanan berhasil dibatalkan.",
      data: {
        orderId: updateData.id,
        status: "cancelled"
      }
    });

  } catch (error: any) {
    console.error("[OrderCancel] Unexpected error:", error.message);
    return NextResponse.json({ success: false, error: "Gagal membatalkan pesanan." }, { status: 500 });
  }
}
