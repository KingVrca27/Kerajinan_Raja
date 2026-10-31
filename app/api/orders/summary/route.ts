import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/src/lib/supabaseServerRoute";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(req);
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Ambil customer ID
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (customerError) {
      console.error("[OrdersSummary] DB error fetch customer:", customerError.message);
      return NextResponse.json({ success: false, error: "Gagal mengambil ringkasan pesanan" }, { status: 500 });
    }

    // Jika user belum punya profil customer, maka pasti belum ada pesanan
    if (!customer) {
      return NextResponse.json({
        success: true,
        data: {
          unpaid: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          rating: 0,
        },
      });
    }

    const customerId = customer.id;

    // Ambil semua orders dan itemnya untuk customer ini, serta reviews
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select(`
        id,
        status,
        payment_status,
        payment_proof_path,
        order_items (
          id,
          reviews (
            id
          )
        )
      `)
      .eq("customer_id", customerId);

    if (ordersError) {
      console.error("[OrdersSummary] DB error fetch orders:", ordersError.message);
      return NextResponse.json({ success: false, error: "Gagal mengambil ringkasan pesanan" }, { status: 500 });
    }

    const ordersData = orders as any[];

    let unpaidCount = 0;
    let processingCount = 0;
    let shippedCount = 0;
    let deliveredCount = 0;
    let ratingCount = 0;
    const deliveredIds: string[] = [];

    for (const order of ordersData || []) {
      // 1. Unpaid
      if (
        order.payment_status === "unpaid" &&
        !order.payment_proof_path &&
        !["cancelled", "refunded", "delivered"].includes(order.status)
      ) {
        unpaidCount++;
      }

      // 2. Processing
      if (["pending", "confirmed", "processing"].includes(order.status)) {
        processingCount++;
      }

      // 3. Shipped
      if (order.status === "shipped") {
        shippedCount++;
      }

      // 4. Delivered
      if (order.status === "delivered") {
        deliveredCount++;
        deliveredIds.push(order.id);
      }

      // 5. Rating (Hitung per order_item, jika order delivered dan belum ada review)
      if (order.status === "delivered" && Array.isArray(order.order_items)) {
        for (const item of order.order_items) {
          const reviews = item.reviews;
          const hasReview = Array.isArray(reviews) ? reviews.length > 0 : !!reviews;
          
          if (!hasReview) {
            ratingCount++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        unpaid: unpaidCount,
        processing: processingCount,
        shipped: shippedCount,
        delivered: deliveredCount,
        deliveredIds: deliveredIds,
        rating: ratingCount,
      },
    });
  } catch (error: any) {
    console.error("[OrdersSummary] Unexpected error:", error.message);
    return NextResponse.json({ success: false, error: "Gagal mengambil ringkasan pesanan" }, { status: 500 });
  }
}
