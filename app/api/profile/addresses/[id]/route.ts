import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/src/lib/supabaseServerRoute";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    if (!id) return NextResponse.json({ error: "ID alamat tidak valid" }, { status: 400 });

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

    // Jika diubah jadi primary, matikan primary alamat yang lain
    if (is_primary === true) {
      await supabase
        .from("customer_addresses")
        .update({ is_primary: false })
        .eq("customer_id", customer.id)
        .neq("id", id);
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (receiver_name !== undefined) updatePayload.receiver_name = receiver_name;
    if (phone !== undefined) updatePayload.phone = phone;
    if (province !== undefined) updatePayload.province = province;
    if (city !== undefined) updatePayload.city = city;
    if (district !== undefined) updatePayload.district = district;
    if (village !== undefined) updatePayload.village = village;
    if (detail_address !== undefined) updatePayload.detail_address = detail_address;
    if (latitude !== undefined) updatePayload.latitude = latitude;
    if (longitude !== undefined) updatePayload.longitude = longitude;
    if (is_primary !== undefined) updatePayload.is_primary = is_primary;

    const { data: updatedAddress, error: updateError } = await supabase
      .from("customer_addresses")
      .update(updatePayload)
      .eq("id", id)
      .eq("customer_id", customer.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ address: updatedAddress });
  } catch (err: unknown) {
    console.error("[PUT /api/profile/addresses/[id]] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    if (!id) return NextResponse.json({ error: "ID alamat tidak valid" }, { status: 400 });

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

    // Jangan izinkan hapus jika ini adalah alamat terakhir dan is_primary (opsional, tapi baik untuk UX)
    // Di sini kita izinkan saja.

    const { error: deleteError } = await supabase
      .from("customer_addresses")
      .delete()
      .eq("id", id)
      .eq("customer_id", customer.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Jika yang dihapus adalah is_primary, jadikan salah satu yang tersisa sebagai primary
    const { data: remaining } = await supabase
      .from("customer_addresses")
      .select("id")
      .eq("customer_id", customer.id)
      .limit(1);

    if (remaining && remaining.length > 0) {
      await supabase
        .from("customer_addresses")
        .update({ is_primary: true })
        .eq("id", remaining[0].id)
        .eq("customer_id", customer.id);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[DELETE /api/profile/addresses/[id]] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
