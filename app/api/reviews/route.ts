import { NextRequest, NextResponse } from "next/server";
import { reviewRepository } from "@/src/lib/reviewRepository";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { createRouteHandlerClient } from "@/src/lib/supabaseServerRoute";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const product_id = formData.get("product_id")?.toString();
    const order_item_id = formData.get("order_item_id")?.toString();
    const ratingStr = formData.get("rating")?.toString();
    const title = formData.get("title")?.toString() || "";
    const content = formData.get("content")?.toString() || "";
    const imageFile = formData.get("image") as File | null;

    if (!product_id || !order_item_id || !ratingStr) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const rating = parseInt(ratingStr, 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating harus antara 1 dan 5" }, { status: 400 });
    }

    // =========================================================================
    // SESSION CHECK — Hanya customer yang login yang boleh submit review
    // =========================================================================
    const { supabase: supabaseAuth } = createRouteHandlerClient(req);
    const { data: { user: authUser } } = await supabaseAuth.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Ambil data order item beserta customer_id dan status order
    const { data: orderItemData, error: verifyError } = await supabaseAdmin
      .from("order_items")
      .select(`
        product_id,
        orders!inner (
          customer_id,
          status
        )
      `)
      .eq("id", order_item_id)
      .single();

    if (verifyError || !orderItemData) {
      return NextResponse.json({ error: "Item pesanan tidak ditemukan" }, { status: 404 });
    }

    // Tangani bentuk return dari relasi Supabase (objek atau array)
    const orderData = Array.isArray(orderItemData.orders)
      ? orderItemData.orders[0]
      : orderItemData.orders;

    if (!orderData) {
      return NextResponse.json({ error: "Data pesanan tidak valid" }, { status: 400 });
    }

    if (orderItemData.product_id !== product_id) {
      return NextResponse.json({ error: "Data produk tidak cocok dengan pesanan." }, { status: 400 });
    }

    if (orderData.status !== "delivered") {
      return NextResponse.json({ error: "Pesanan belum selesai/diterima." }, { status: 400 });
    }

    // =========================================================================
    // OWNERSHIP VERIFICATION
    // Pastikan customer record terhubung ke auth session yang terverifikasi
    // =========================================================================
    if (authUser) {
      // Verifikasi bahwa customer_id dari order terhubung ke auth.uid()
      const { data: customerData, error: customerError } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("id", orderData.customer_id)
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (customerError || !customerData) {
        // Order item ini bukan milik authenticated user
        return NextResponse.json({ error: "Anda tidak memiliki akses untuk mereview pesanan ini." }, { status: 403 });
      }
    }

    // =========================================================================
    // IMAGE UPLOAD (OPTIONAL)
    // =========================================================================
    let imageUrl = null;
    
    if (imageFile) {
      if (!imageFile.type.startsWith("image/")) {
        return NextResponse.json({ error: "File yang diupload harus berupa gambar" }, { status: 400 });
      }
      if (imageFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Ukuran gambar maksimal 5MB" }, { status: 400 });
      }
      
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `review_${order_item_id}_${Date.now()}.${fileExt}`;
      const filePath = `reviews/${orderData.customer_id}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage
        .from("Aset_Review")
        .upload(filePath, imageFile, {
          contentType: imageFile.type,
          upsert: false
        });
        
      if (uploadError) {
        console.error("[Reviews API] Upload Error:", uploadError);
        return NextResponse.json({ error: "Gagal mengunggah foto review" }, { status: 500 });
      }
      
      const { data: publicUrlData } = supabaseAdmin.storage.from("Aset_Review").getPublicUrl(filePath);
      imageUrl = publicUrlData.publicUrl;
    }

    const result = await reviewRepository.createReview({
      product_id,
      customer_id: orderData.customer_id, // AMAN: diambil dari DB, bukan dari request body
      order_item_id,
      rating,
      title: title || "",
      content: content || "",
      image_url: imageUrl,
    });

    if (!result.success) {
      // Cleanup image if review creation fails
      if (imageUrl) {
        const filePath = imageUrl.split("Aset_Review/")[1];
        if (filePath) {
          await supabaseAdmin.storage.from("Aset_Review").remove([filePath]);
        }
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Ulasan berhasil dikirim" });
  } catch (err) {
    console.error("[Reviews API] POST Error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
