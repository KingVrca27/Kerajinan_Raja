import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { voucherCode, subtotal } = payload;

    if (!voucherCode || typeof subtotal !== "number") {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const code = voucherCode.trim().toUpperCase();

    const { data: promotion, error: promoError } = await supabaseAdmin
      .from("promotions")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (promoError || !promotion) {
      return NextResponse.json({ error: "Voucher tidak ditemukan" }, { status: 400 });
    }

    if (!promotion.is_active) {
      return NextResponse.json({ error: "Voucher sudah tidak aktif" }, { status: 400 });
    }

    const now = new Date();
    if (promotion.starts_at && new Date(promotion.starts_at) > now) {
      return NextResponse.json({ error: "Voucher belum berlaku" }, { status: 400 });
    }

    if (promotion.expires_at && new Date(promotion.expires_at) < now) {
      return NextResponse.json({ error: "Voucher sudah kedaluwarsa" }, { status: 400 });
    }

    if (promotion.usage_limit !== null && promotion.usage_count >= promotion.usage_limit) {
      return NextResponse.json({ error: "Batas penggunaan voucher telah habis" }, { status: 400 });
    }

    if (subtotal < promotion.min_purchase) {
      return NextResponse.json(
        { error: `Minimum pembelian untuk voucher ini adalah Rp${promotion.min_purchase.toLocaleString("id-ID")}` },
        { status: 400 }
      );
    }

    let rawDiscount = 0;
    if (promotion.type === "percentage") {
      rawDiscount = subtotal * (promotion.value / 100);
      if (promotion.max_discount !== null) {
        rawDiscount = Math.min(rawDiscount, promotion.max_discount);
      }
    } else if (promotion.type === "fixed") {
      rawDiscount = promotion.value;
    } else {
      return NextResponse.json({ error: "Tipe voucher tidak valid" }, { status: 400 });
    }

    const discountAmount = Math.max(0, Math.min(rawDiscount, subtotal));

    return NextResponse.json({
      valid: true,
      promotionId: promotion.id,
      code: promotion.code,
      discountAmount,
    });
  } catch (error) {
    console.error("[Voucher Preview] Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server internal" }, { status: 500 });
  }
}
