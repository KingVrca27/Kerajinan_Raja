import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";

/**
 * GET /api/shipping-cost
 *
 * Mengembalikan nilai ongkos kirim default dari site_settings.
 * Endpoint ini aman untuk dipanggil oleh client karena hanya memberikan
 * informasi harga yang sama dengan yang digunakan server saat checkout.
 *
 * Shipping cost SELALU dihitung ulang di server saat checkout —
 * nilai dari endpoint ini hanya digunakan untuk tampilan UI kepada customer.
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "default_shipping_cost")
      .maybeSingle();

    if (error) {
      console.error("[shipping-cost] Error membaca site_settings:", error);
      // Fallback ke nilai default jika DB error
      return NextResponse.json({ shipping_cost: 15000 });
    }

    const shippingCost = data?.value ? parseFloat(data.value) || 0 : 0;
    return NextResponse.json({ shipping_cost: shippingCost });
  } catch (error) {
    console.error("[shipping-cost] Unexpected error:", error);
    return NextResponse.json({ shipping_cost: 15000 });
  }
}
