import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/src/lib/supabaseServerRoute";

export async function GET(req: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(req);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ambil customer ID
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Ambil daftar alamat
    const { data: addresses, error: addressError } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", customer.id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });

    if (addressError) {
      return NextResponse.json({ error: addressError.message }, { status: 500 });
    }

    return NextResponse.json({ addresses: addresses ?? [] });
  } catch (err: unknown) {
    console.error("[GET /api/profile/addresses] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(req);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      receiver_name, phone, province, city, district, village, detail_address,
      latitude, longitude, is_primary
    } = body;

    if (!receiver_name || !phone || !province || !city || !district || !village || !detail_address) {
      return NextResponse.json({ error: "Semua field alamat wajib diisi." }, { status: 400 });
    }

    // Jika alamat baru di-set primary, ubah yang lain jadi non-primary
    if (is_primary) {
      await supabase
        .from("customer_addresses")
        .update({ is_primary: false })
        .eq("customer_id", customer.id);
    }

    // Jika ini adalah alamat pertama, jadikan primary otomatis
    let finalIsPrimary = is_primary;
    if (!finalIsPrimary) {
      const { count } = await supabase
        .from("customer_addresses")
        .select("*", { count: 'exact', head: true })
        .eq("customer_id", customer.id);
      
      if (count === 0) {
        finalIsPrimary = true;
      }
    }

    const { data: newAddress, error: insertError } = await supabase
      .from("customer_addresses")
      .insert({
        customer_id: customer.id,
        receiver_name,
        phone,
        province,
        city,
        district,
        village,
        detail_address,
        latitude,
        longitude,
        is_primary: finalIsPrimary
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ address: newAddress }, { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/profile/addresses] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
