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

    const { payment_proof_path } = await req.json();

    if (!payment_proof_path) {
      return NextResponse.json({ error: "payment_proof_path is required" }, { status: 400 });
    }

    // Verify that the path belongs to a valid order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("payment_proof_path", payment_proof_path)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: "Path tidak terkait dengan pesanan yang valid" }, { status: 404 });
    }

    // Generate signed URL valid for 60 seconds
    const { data, error } = await supabaseAdmin.storage
      .from("payment_proofs")
      .createSignedUrl(payment_proof_path, 60);

    if (error || !data) {
      console.error("[PaymentProof] Failed to generate signed URL:", error);
      return NextResponse.json({ error: "Gagal memuat URL bukti pembayaran" }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: data.signedUrl });

  } catch (error) {
    console.error("[PaymentProof] Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
